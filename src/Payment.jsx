import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X, CreditCard, Lock } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";

import logoImage from "./assets/image/Logo.png";
import visaLogo from "./assets/payway/visa.svg";
import mastercardLogo from "./assets/payway/mastercard.svg";
import unionpayLogo from "./assets/payway/unionpay.svg";
import jcbLogo from "./assets/payway/jcb.svg";
import khqrLogo from "./assets/payway/khqr.svg";
import bakongLogo from "./assets/payway/bakong.svg";
import Footer from "./Footer";

// ABA PayWay's checkout widget script. Works for both sandbox and
// production (which base URL create-payway-transaction points at is
// controlled server-side by the PAYWAY_BASE_URL secret). Exposes a global
// `AbaPayway.checkout()` used below to open the payment modal.
const PAYWAY_CHECKOUT_SCRIPT_SRC =
  "https://checkout.payway.com.kh/plugins/checkout2-0.js?hide-close=2";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

// Fallback order used only if this page is opened directly without
// coming from Checkout (e.g. a stale link/refresh).
const FALLBACK_ORDER = {
  cartItems: [],
  subtotal: 0,
  shippingCost: 0,
  whiteGlove: false,
  grandTotal: 47028,
  fullName: "",
  shippingAddress: "",
  city: "",
  country: "",
};

const KHQR_EXPIRY_SECONDS = 5 * 60;
const KHQR_POLL_INTERVAL_MS = 3000;

function formatMinutesSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// paywayParams (checkoutUrl + signed form fields) comes from
// create-payway-transaction. Submitting the form is intercepted by
// AbaPayway.checkout(), which opens PayWay's own hosted card-entry modal —
// this page never touches raw card numbers itself. The order is only
// flipped to "paid" by the payway-callback Edge Function once PayWay
// confirms the charge — never by this client-side code.
function PaywayPayButton({ amountDue, paywayParams, submitting, setSubmitting, setError }) {
  if (!paywayParams) {
    return (
      <button type="button" className="pm-pay-btn" disabled>
        Preparing secure payment…
      </button>
    );
  }

  const openPaywayCheckout = () => {
    // checkout2-0.js declares AbaPayway as a lexical global, so it is NOT
    // reachable as window.AbaPayway — it has to be referenced bare, behind
    // a typeof guard in case the script hasn't finished loading yet.
    // eslint-disable-next-line no-undef
    const aba = typeof AbaPayway !== "undefined" ? AbaPayway : undefined;
    if (!aba) {
      setError("Payment window is still loading. Please try again in a moment.");
      setSubmitting(false);
      return;
    }
    aba.checkout();
  };

  return (
    <form
      id="aba_merchant_request"
      method="POST"
      target="aba_webservice"
      action={paywayParams.checkoutUrl}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitting(true);
        openPaywayCheckout();
      }}
    >
      {Object.entries(paywayParams.params).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className="pm-pay-btn" disabled={submitting}>
        {submitting ? "Processing..." : `Pay $${amountDue.toLocaleString()}`}
      </button>
    </form>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const order = location.state || FALLBACK_ORDER;
  const amountDue = order.grandTotal;

  const [paymentMethod, setPaymentMethod] = useState("khqr");
  const [khqrSecondsLeft, setKhqrSecondsLeft] = useState(KHQR_EXPIRY_SECONDS);
  const [paywayData, setPaywayData] = useState(null);
  const [paywayLoading, setPaywayLoading] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [khqrStatus, setKhqrStatus] = useState("waiting");
  const [khqrChecking, setKhqrChecking] = useState(false);

  const [firstName, setFirstName] = useState("Hor");
  const [lastName, setLastName] = useState("Kimly");
  const [streetAddress, setStreetAddress] = useState(
    order.shippingAddress || "#123B , Street 125"
  );
  const [city, setCity] = useState(order.city || "Phnom Penh");
  const [postalCode, setPostalCode] = useState("1280");
  const [country, setCountry] = useState(order.country || "Cambodia");
  const [phone, setPhone] = useState("+855 123 456 789");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Countdown only runs against a QR that actually exists.
  useEffect(() => {
    if (paymentMethod !== "khqr" || !paywayData?.qrImage) return undefined;
    if (khqrStatus !== "waiting") return undefined;
    const timer = setInterval(() => {
      setKhqrSecondsLeft((prev) => {
        if (prev <= 1) {
          setKhqrStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, paywayData, khqrStatus]);

  // A KHQR payment happens inside the customer's banking app, so nothing
  // redirects back here — ask payway-status until it settles. That
  // function re-checks with PayWay itself, so this works even if PayWay's
  // pushback to payway-callback is delayed or never arrives. checkKhqrStatus
  // is shared by the background poll below and the manual "I've paid, check
  // now" button, so both paths land on the exact same status handling.
  const checkKhqrStatus = async () => {
    if (!pendingOrderId) return;
    const { data, error: fnError } = await supabase.functions.invoke(
      "payway-status",
      { body: { orderId: pendingOrderId } }
    );
    if (fnError) return;

    if (data?.status === "paid") {
      setKhqrStatus("paid");
      navigate(
        `/payment/success?order_id=${pendingOrderId}${data.demo ? "&demo=1" : ""}`
      );
    } else if (data?.status === "failed") {
      setKhqrStatus("failed");
    }
  };

  const handleManualKhqrCheck = async () => {
    setKhqrChecking(true);
    await checkKhqrStatus();
    setKhqrChecking(false);
  };

  useEffect(() => {
    if (paymentMethod !== "khqr" || !paywayData?.qrImage) return undefined;
    if (khqrStatus !== "waiting" || !pendingOrderId) return undefined;

    let cancelled = false;
    const timer = setInterval(() => {
      if (!cancelled) checkKhqrStatus();
    }, KHQR_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, paywayData, khqrStatus, pendingOrderId, navigate]);

  useEffect(() => {
    if (document.getElementById("payway-checkout-script")) return;
    const script = document.createElement("script");
    script.id = "payway-checkout-script";
    script.src = PAYWAY_CHECKOUT_SCRIPT_SRC;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Both methods route through ABA PayWay. Choosing one writes the order
  // as "pending" (so the amount is fixed server-side) and asks the
  // create-payway-transaction Edge Function — which re-reads that order by
  // id — to build the PayWay request:
  //
  //   card -> signed form fields, submitted into PayWay's hosted card
  //           modal (this page never collects raw card numbers itself)
  //   khqr -> a ready-made KHQR image from PayWay's generate-qr API
  //
  // Either way the order is only flipped to "paid" by payway-callback or
  // payway-status once PayWay's own API confirms the payment — never by
  // this client-side code.
  const initPaywayTransaction = (method) => {
    if (paywayData?.method === method || paywayLoading) return;
    requireAuth(async () => {
      setError("");
      setPaywayLoading(true);
      setPaywayData(null);
      setKhqrStatus("waiting");

      const { data: inserted, error: insertError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          items: order.cartItems,
          subtotal: order.subtotal,
          shipping_cost: order.shippingCost,
          white_glove: order.whiteGlove,
          grand_total: order.grandTotal,
          full_name: order.fullName || `${firstName} ${lastName}`,
          shipping_address: streetAddress,
          city,
          country,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        setPaywayLoading(false);
        setError(insertError.message);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "create-payway-transaction",
        { body: { orderId: inserted.id, method } }
      );

      setPaywayLoading(false);

      if (fnError || data?.error || !data?.method) {
        setError(
          data?.error ||
            fnError?.message ||
            "Could not start ABA PayWay payment. Please try again."
        );
        return;
      }

      setPendingOrderId(inserted.id);
      setPaywayData(data);
      if (method === "khqr") {
        setKhqrSecondsLeft(data.expiresInSeconds ?? KHQR_EXPIRY_SECONDS);
      }
    });
  };

  return (
    <div className="pm-page">
      <style>{`
        .pm-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .pm-page * {
          box-sizing: border-box;
        }
        .pm-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .pm-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .pm-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .pm-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .pm-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .pm-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .pm-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pm-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .pm-menu-btn {
          display: flex;
        }
        .pm-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .pm-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 24px 96px;
        }
        .pm-title {
          font-weight: 600;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0 0 32px 0;
        }

        .pm-layout {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }
        .pm-form-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .pm-summary-col {
          width: 100%;
        }

        .pm-payment-box {
          background: #f9f9f9;
          border: 1px solid #c4c7c7;
          border-radius: 5px;
          padding: 32px;
          margin-bottom: 32px;
        }

        /* Payment method selector */
        .pm-method-section {
          margin-bottom: 32px;
        }
        .pm-method-heading {
          font-weight: 600;
          font-size: 20px;
          color: #1a1c1c;
          margin: 0 0 4px 0;
        }
        .pm-method-subtext {
          font-size: 14px;
          color: #747878;
          margin: 0 0 20px 0;
        }
        .pm-method-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pm-method-option {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          background: #fff;
          border: 1px solid #c4c7c7;
          border-radius: 5px;
          padding: 16px;
          cursor: pointer;
          color: #1a1c1c;
          text-align: left;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .pm-method-option.selected {
          border-color: #ac834b;
          background: #fbf7f0;
        }
        .pm-method-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pm-method-name {
          font-size: 16px;
          color: #1a1c1c;
        }
        .pm-method-desc {
          font-size: 13px;
          color: #747878;
        }
        .pm-method-radio {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          border: 1px solid #c4c7c7;
          flex-shrink: 0;
          position: relative;
        }
        .pm-method-option.selected .pm-method-radio {
          border-color: #ac834b;
        }
        .pm-method-option.selected .pm-method-radio::after {
          content: "";
          position: absolute;
          inset: 3px;
          border-radius: 9999px;
          background: #ac834b;
        }

        /* ABA-style method badge + card brand marks (assets from ABA's
           own brand kit, see src/assets/payway). */
        .pm-method-badge {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #12556d;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .pm-method-badge-khqr {
          background: #fff;
          border: 1px solid #e3e5e5;
          padding: 4px;
        }
        .pm-badge-khqr-img {
          width: 100%;
          height: auto;
          display: block;
        }
        .pm-card-brands {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .pm-card-brands img {
          height: 20px;
          width: auto;
          display: block;
        }
        .pm-khqr-brandrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .pm-khqr-brandrow img {
          height: 22px;
          width: auto;
          display: block;
        }

        .pm-secure-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fbf7f0;
          border: 1px solid #ac834b;
          border-radius: 5px;
          padding: 14px 16px;
          margin-bottom: 24px;
        }
        .pm-secure-note svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: #ac834b;
        }
        .pm-secure-note p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #444748;
        }

        .pm-card-embed {
          margin-top: 8px;
        }
        .pm-card-embed .pm-secure-note {
          margin-top: 8px;
        }

        .pm-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        .pm-field-label {
          font-size: 13px;
          color: rgba(0,0,0,0.6);
        }
        .pm-input {
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          border: 0.5px solid #000;
          border-radius: 5px;
          padding: 14px 16px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          color: #1a1c1c;
          outline: none;
        }
        .pm-two-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .pm-section-heading {
          font-weight: 600;
          font-size: 18px;
          color: #1a1c1c;
          margin: 8px 0 20px 0;
        }

        /* Order summary */
        .pm-summary-card {
          background: #f9f9f9;
          border: 1px solid #c4c7c7;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .pm-summary-heading {
          font-weight: 400;
          font-size: 24px;
          color: #1a1c1c;
          margin: 0;
        }
        .pm-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-top: 1px solid #c4c7c7;
          padding-top: 16px;
          font-size: 16px;
          color: #444748;
        }
        .pm-summary-amount {
          font-size: 28px;
          color: #1a1c1c;
        }

        .pm-pay-btn {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 20px 0;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 1.2px;
        }
        .pm-pay-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* KHQR panel */
        .pm-khqr-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }
        /* PayWay's generate-qr returns the finished KHQR card artwork
           (logo, amount, QR, footer), so it just gets sized here. */
        .pm-khqr-img {
          width: 100%;
          max-width: 240px;
          height: auto;
          display: block;
        }
        .pm-khqr-deeplink {
          font-size: 13px;
          color: #12556d;
          text-decoration: underline;
        }
        .pm-khqr-check-btn {
          width: 100%;
          max-width: 240px;
          background: #c8102e;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .pm-khqr-check-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .pm-khqr-demo {
          margin: 0;
          padding: 8px 12px;
          border: 1px solid #ac834b;
          background: #fbf7f0;
          color: #7a5a28;
          font-size: 12px;
          line-height: 1.45;
          border-radius: 5px;
        }
        .pm-khqr-timer {
          font-size: 14px;
          color: #444748;
          margin: 0;
        }
        .pm-khqr-timer strong {
          color: #ac834b;
        }
        .pm-khqr-help {
          font-size: 13px;
          color: #747878;
          line-height: 1.5;
          margin: 0;
        }
        .pm-khqr-powered {
          font-size: 11px;
          letter-spacing: 0.4px;
          color: #a3a3a3;
          margin: 0;
        }

        .pm-error {
          color: #993c1d;
          font-size: 14px;
          margin: 16px 0 0;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .pm-header-inner { padding: 10px 48px; }
          .pm-nav-desktop { display: flex; }
          .pm-menu-btn { display: none; }
          .pm-main { padding: 64px 48px 128px; }
          .pm-two-col { grid-template-columns: 1fr 1fr; }
          .pm-layout { flex-direction: row; align-items: flex-start; gap: 64px; }
          .pm-form-col { flex: 1 1 58%; }
          .pm-summary-col { flex: 1 1 38%; min-width: 320px; position: sticky; top: 96px; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .pm-header-inner { padding: 10px 64px; }
          .pm-main { padding: 64px 64px 128px; }
          .pm-title { font-size: 32px; }
        }
      `}</style>

      {/* Header */}
      <header className="pm-header">
        <div className="pm-header-inner">
          <img src={logoImage} alt="Snadai" className="pm-logo" />

          <nav className="pm-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="pm-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="pm-icons">
            <button type="button" className="pm-icon-btn" aria-label="Search">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="pm-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="pm-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="pm-icon-btn pm-menu-btn"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="pm-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="pm-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="pm-main">
        <h1 className="pm-title pm-serif">Complete Your Payment</h1>

        <div className="pm-layout">
            {/* Payment method + form */}
            <div className="pm-form-col">
              <div className="pm-payment-box">
              <div className="pm-method-section">
                <h2 className="pm-method-heading pm-serif">Payment Method</h2>
                <p className="pm-method-subtext">
                  Scan with KHQR, or pay by card.
                </p>

                <div className="pm-method-list">
                  <button
                    type="button"
                    className={`pm-method-option ${
                      paymentMethod === "khqr" ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod("khqr")}
                  >
                    <span className="pm-method-badge pm-method-badge-khqr">
                      <img src={khqrLogo} alt="" className="pm-badge-khqr-img" />
                    </span>
                    <span className="pm-method-info">
                      <span className="pm-method-name">ABA KHQR</span>
                      <span className="pm-method-desc">
                        Scan to pay with any banking app
                      </span>
                    </span>
                    <span className="pm-method-radio" />
                  </button>

                  <button
                    type="button"
                    className={`pm-method-option ${
                      paymentMethod === "card" ? "selected" : ""
                    }`}
                    onClick={() => {
                      setPaymentMethod("card");
                      initPaywayTransaction("card");
                    }}
                  >
                    <span className="pm-method-badge">
                      <CreditCard size={22} strokeWidth={1.75} color="#fff" />
                    </span>
                    <span className="pm-method-info">
                      <span className="pm-method-name">Credit/Debit Card</span>
                      <span className="pm-card-brands">
                        <img src={visaLogo} alt="Visa" />
                        <img src={mastercardLogo} alt="Mastercard" />
                        <img src={unionpayLogo} alt="UnionPay" />
                        <img src={jcbLogo} alt="JCB" />
                      </span>
                    </span>
                    <span className="pm-method-radio" />
                  </button>
                </div>
              </div>

              {paymentMethod === "card" && (
                <div className="pm-card-embed">
                  <div className="pm-secure-note">
                    <Lock size={16} strokeWidth={1.5} />
                    <p>
                      Card details are entered securely in ABA PayWay's own
                      payment window — this page never sees your card
                      number.
                    </p>
                  </div>

                  {error && <p className="pm-error">{error}</p>}
                </div>
              )}
              </div>

              {paymentMethod === "card" && (
                <>
                  <h2 className="pm-section-heading pm-serif">
                    Billing Address
                  </h2>

                  <div className="pm-two-col">
                    <div className="pm-field" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        placeholder="First name"
                        className="pm-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="pm-field" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        placeholder="Last name"
                        className="pm-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pm-field">
                    <input
                      type="text"
                      placeholder="Street address"
                      className="pm-input"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                  </div>

                  <div className="pm-field">
                    <input
                      type="text"
                      placeholder="City"
                      className="pm-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="pm-field">
                    <input
                      type="text"
                      placeholder="Country"
                      className="pm-input"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>

                  <div className="pm-field">
                    <input
                      type="text"
                      placeholder="Postal code"
                      className="pm-input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>

                  <div className="pm-field">
                    <input
                      type="tel"
                      placeholder="Phone number"
                      className="pm-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="pm-field">
                    <input
                      type="email"
                      placeholder="Email address"
                      className="pm-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </>
              )}

              {paymentMethod === "khqr" && error && (
                <p className="pm-error">{error}</p>
              )}
            </div>

            {/* Order summary / confirm */}
            <div className="pm-summary-col">
              <div className="pm-summary-card">
                <h2 className="pm-summary-heading pm-serif">
                  Order Summary
                </h2>

                <div className="pm-summary-row">
                  <span>Amount Due</span>
                  <span className="pm-summary-amount pm-serif">
                    ${amountDue.toLocaleString()}
                  </span>
                </div>

                {paymentMethod === "khqr" ? (
                  <div className="pm-khqr-panel">
                    {paywayData?.qrImage && khqrStatus === "waiting" ? (
                      <>
                        {/* PayWay renders the whole KHQR card itself via
                            qr_image_template, so it already matches ABA's
                            layout guideline — don't redraw it. */}
                        <img
                          src={paywayData.qrImage}
                          alt="KHQR code for this payment"
                          className="pm-khqr-img"
                        />
                        <p className="pm-khqr-timer pm-serif">
                          QR code expires in{" "}
                          <strong>{formatMinutesSeconds(khqrSecondsLeft)}</strong>
                        </p>
                        <p className="pm-khqr-help">
                          Scan with ABA Mobile or any KHQR banking app. This
                          page updates by itself once the payment goes
                          through — no need to confirm anything.
                        </p>
                        <button
                          type="button"
                          className="pm-khqr-check-btn"
                          onClick={handleManualKhqrCheck}
                          disabled={khqrChecking}
                        >
                          {khqrChecking ? "Checking…" : "I've paid, check now"}
                        </button>
                        {paywayData.deeplink && (
                          <a
                            className="pm-khqr-deeplink"
                            href={paywayData.deeplink}
                          >
                            Open in ABA Mobile
                          </a>
                        )}
                      </>
                    ) : khqrStatus === "expired" ? (
                      <>
                        <p className="pm-khqr-help">
                          This QR code has expired.
                        </p>
                        <button
                          type="button"
                          className="pm-pay-btn"
                          onClick={() => initPaywayTransaction("khqr")}
                          disabled={paywayLoading}
                        >
                          {paywayLoading ? "Generating..." : "Get a new QR code"}
                        </button>
                      </>
                    ) : khqrStatus === "failed" ? (
                      <>
                        <p className="pm-khqr-help">
                          That payment was declined or cancelled.
                        </p>
                        <button
                          type="button"
                          className="pm-pay-btn"
                          onClick={() => initPaywayTransaction("khqr")}
                          disabled={paywayLoading}
                        >
                          {paywayLoading ? "Generating..." : "Try again"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="pm-pay-btn"
                        onClick={() => initPaywayTransaction("khqr")}
                        disabled={paywayLoading}
                      >
                        {paywayLoading
                          ? "Generating QR code..."
                          : "Show QR code"}
                      </button>
                    )}

                    <div className="pm-khqr-brandrow">
                      <img src={bakongLogo} alt="" />
                      <img src={khqrLogo} alt="" />
                    </div>
                    <p className="pm-khqr-powered">
                      Powered by Bakong, National Bank of Cambodia
                    </p>
                  </div>
                ) : (
                  <PaywayPayButton
                    amountDue={amountDue}
                    paywayParams={paywayData?.method === "card" ? paywayData : null}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    setError={setError}
                  />
                )}
              </div>
            </div>
          </div>
      </main>

      <Footer />
    </div>
  );
}
