import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  Check,
  Package,
  Truck,
  MapPin,
  PackageCheck,
} from "lucide-react";

import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";
import { useAuth } from "./useAuth";
import { useAuthGate } from "./useAuthGate";
import { supabase } from "./supabaseClient";
import { artworks } from "./ArtworkData";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

// Only a handful of carriers get a real "track package" link; anything else
// (or no carrier set yet) just shows the tracking number as plain text.
const CARRIER_TRACKING_URLS = {
  ups: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  dhl: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
};

const DELIVERY_STAGES = [
  { key: "confirmed", label: "Confirmed", Icon: Check },
  { key: "processing", label: "Processing", Icon: Package },
  { key: "shipped", label: "Shipping", Icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", Icon: MapPin },
  { key: "delivered", label: "Delivered", Icon: PackageCheck },
];

// Demo flow: animates through every stage on its own, Confirmed to
// Delivered in DEMO_DURATION_MS total, instead of reflecting the real
// delivery_status column — for showing the tracker off without needing to
// hand-update an order's status first.
const DEMO_DURATION_MS = 10000;
const DEMO_STEP_MS = DEMO_DURATION_MS / (DELIVERY_STAGES.length - 1);
// Each step is a line traveling to the next badge, then a short pause once
// it arrives before that badge lights up — not the badge lighting up first
// while the line is still catching up.
const DEMO_LINE_MS = DEMO_STEP_MS * 0.8;
const DEMO_BADGE_MS = DEMO_STEP_MS - DEMO_LINE_MS;

function OrderTracker({ orderId, carrier, trackingNumber }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function play() {
      for (let i = 1; i < DELIVERY_STAGES.length; i++) {
        setLineIndex(i);
        await sleep(DEMO_LINE_MS);
        if (cancelled) return;
        setCurrentIndex(i);
        await sleep(DEMO_BADGE_MS);
        if (cancelled) return;
      }
    }

    const kickoff = setTimeout(play, 0);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
    };
  }, []);

  const trackingUrl =
    trackingNumber && carrier && CARRIER_TRACKING_URLS[carrier.toLowerCase()]
      ? CARRIER_TRACKING_URLS[carrier.toLowerCase()](trackingNumber)
      : null;

  return (
    <div className="ord-tracker">
      <div className="ord-tracker-header">
        <div>
          <p className="ord-tracker-eyebrow">Order Status</p>
          <h4 className="ord-tracker-heading ord-serif">Track Order</h4>
        </div>
        <div className="ord-tracker-number">
          <span className="ord-tracker-number-label">Order Number</span>
          <span className="ord-tracker-number-value">
            #{orderId.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="ord-tracker-steps">
        {DELIVERY_STAGES.map(({ key, label, Icon }, i) => (
          <Fragment key={key}>
            {i > 0 && (
              <span className="ord-tracker-line">
                <span
                  className={`ord-tracker-line-fill ${
                    i <= lineIndex ? "done" : ""
                  }`}
                  style={{ transitionDuration: `${DEMO_LINE_MS}ms` }}
                />
              </span>
            )}
            <div className="ord-tracker-step">
              <span
                className={`ord-tracker-badge ${
                  i < currentIndex ? "done" : i === currentIndex ? "active" : ""
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <span className="ord-tracker-step-label">{label}</span>
            </div>
          </Fragment>
        ))}
      </div>

      {trackingNumber && (
        <p className="ord-delivery-tracking">
          {carrier ? `${carrier.toUpperCase()} · ` : ""}
          {trackingUrl ? (
            <a href={trackingUrl} target="_blank" rel="noreferrer">
              Track package ({trackingNumber})
            </a>
          ) : (
            trackingNumber
          )}
        </p>
      )}
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, loading } = useAuth();
  const { requestAuth } = useAuthGate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      requestAuth();
      navigate("/home-page");
    }
  }, [loading, user, requestAuth, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }
      setOrdersLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setOrders(data || []);
        setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Orders store each item's image as the hashed build URL that was live at
  // checkout time (e.g. /assets/01-abc123.jpg). Every redeploy regenerates
  // those hashes, so an old order's stored image 404s once the asset it
  // pointed at is gone. Re-resolve against the current ArtworkData by id so
  // the image always matches what's actually deployed right now.
  const purchasedItems = orders.flatMap((order) =>
    (order.items || []).map((item, index) => ({
      ...item,
      image: artworks.find((a) => a.id === item.id)?.image || item.image,
      orderId: order.id,
      key: `${order.id}-${index}`,
      status: order.status,
      deliveryStatus: order.delivery_status,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      acquiredDate: order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "",
    }))
  );

  // /orders/:orderId shows just that one order instead of the full list.
  const itemsToShow = orderId
    ? purchasedItems.filter((item) => item.orderId === orderId)
    : purchasedItems;

  return (
    <div className="ord-page">
      <style>{`
        .ord-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .ord-page * {
          box-sizing: border-box;
        }
        .ord-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .ord-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .ord-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .ord-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .ord-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .ord-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .ord-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ord-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .ord-menu-btn {
          display: flex;
        }
        .ord-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .ord-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 24px 96px;
        }

        .ord-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-bottom: 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid #c4c7c7;
        }
        .ord-page-title {
          font-weight: 400;
          font-size: 36px;
          color: #1a1c1c;
          margin: 0;
        }
        .ord-page-count {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #444748;
        }

        .ord-list {
          display: flex;
          flex-direction: column;
        }
        .ord-item {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-top: 32px;
          margin-top: 32px;
          border-top: 1px solid #c4c7c7;
        }
        .ord-item:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        .ord-item-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ord-image-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #eee;
        }
        .ord-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ord-item-category {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          margin: 0 0 4px 0;
        }
        .ord-item-title {
          font-size: 24px;
          color: #1a1c1c;
          margin: 0 0 4px 0;
        }
        .ord-item-price {
          font-size: 14px;
          color: #444748;
          margin: 0;
        }
        .ord-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ord-meta-label {
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
        }
        .ord-meta-value {
          font-size: 14px;
          color: #1a1c1c;
        }
        .ord-tracker {
          background: #f4f3f3;
          border: 1px solid #e2e2e2;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ord-tracker-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ord-tracker-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #ac834b;
          margin: 0 0 4px 0;
        }
        .ord-tracker-heading {
          font-size: 22px;
          color: #1a1c1c;
          margin: 0;
        }
        .ord-tracker-number {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          background: #fff;
          border: 1px solid #e2e2e2;
          padding: 8px 14px;
        }
        .ord-tracker-number-label {
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #747878;
        }
        .ord-tracker-number-value {
          font-size: 13px;
          font-weight: 700;
          color: #1a1c1c;
        }
        .ord-tracker-steps {
          display: flex;
          align-items: flex-start;
          overflow-x: auto;
          margin: 0 -16px;
          padding: 0 16px;
        }
        .ord-tracker-line {
          position: relative;
          flex: 1 1 16px;
          min-width: 16px;
          height: 2px;
          background: #d4d4d4;
          margin: 13px 2px 0;
          overflow: hidden;
        }
        .ord-tracker-line-fill {
          position: absolute;
          inset: 0;
          background: #1a1c1c;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform linear;
        }
        .ord-tracker-line-fill.done {
          transform: scaleX(1);
        }
        .ord-tracker-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          width: 60px;
        }
        .ord-tracker-badge {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e2e2;
          color: #9a9a9a;
          flex-shrink: 0;
          transition: background-color 0.5s ease, color 0.5s ease;
        }
        .ord-tracker-badge.done {
          background: #1a1c1c;
          color: #fff;
        }
        .ord-tracker-badge.active {
          background: #1a1c1c;
          color: #fff;
          animation: ord-tracker-pulse 1s ease-in-out infinite;
        }
        @keyframes ord-tracker-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26, 28, 28, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(26, 28, 28, 0); }
        }
        .ord-tracker-step-label {
          font-size: 10px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #444748;
          text-align: center;
          line-height: 1.3;
        }
        .ord-delivery-tracking {
          font-size: 13px;
          color: #1a1c1c;
          margin: 0;
        }
        .ord-delivery-tracking a {
          color: #1a1c1c;
          text-decoration: underline;
        }
        .ord-empty {
          font-size: 16px;
          color: #747878;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .ord-header-inner { padding: 10px 48px; }
          .ord-nav-desktop { display: flex; }
          .ord-menu-btn { display: none; }
          .ord-main { padding: 64px 48px 128px; }
          .ord-item-main { flex-direction: row; align-items: center; }
          .ord-image-wrap { width: 160px; flex-shrink: 0; aspect-ratio: 4 / 3; }
          .ord-item-info { flex: 1 1 220px; }
          .ord-meta { flex: 1 1 120px; }
          .ord-tracker { padding: 24px; gap: 24px; }
          .ord-tracker-steps { margin: 0; padding: 0; }
          .ord-tracker-step { width: 76px; gap: 8px; }
          .ord-tracker-badge { width: 36px; height: 36px; }
          .ord-tracker-line { margin: 17px 4px 0; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .ord-header-inner { padding: 10px 64px; }
          .ord-main { padding: 64px 64px 128px; }
          .ord-page-title { font-size: 48px; }
        }
      `}</style>

      {/* Header */}
      <header className="ord-header">
        <div className="ord-header-inner">
          <img src={logoImage} alt="Snadai" className="ord-logo" />

          <nav className="ord-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="ord-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="ord-icons">
            <button
              type="button"
              className="ord-icon-btn"
              aria-label="Favorites"
              onClick={() => navigate("/collector-profile")}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="ord-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <Link to="/Profile" className="ord-icon-btn" aria-label="Account">
              <User size={18} strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              className="ord-icon-btn ord-menu-btn"
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
          <nav className="ord-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="ord-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="ord-main">
        <div className="ord-page-header">
          <div>
            <h1 className="ord-page-title ord-serif">Orders &amp; Delivery</h1>
          </div>
          {!orderId && (
            <span className="ord-page-count">
              {purchasedItems.length} ITEMS PURCHASED
            </span>
          )}
        </div>

        {ordersLoading ? (
          <p className="ord-empty ord-serif">Loading your purchases...</p>
        ) : itemsToShow.length === 0 ? (
          <p className="ord-empty ord-serif">
            {orderId
              ? "That order couldn't be found."
              : "No purchases yet. Artworks you buy will show up here."}
          </p>
        ) : (
          <div className="ord-list">
            {itemsToShow.map((item) => (
              <div className="ord-item" key={item.key}>
                <div className="ord-item-main">
                  <div className="ord-image-wrap">
                    <img src={item.image} alt={item.title} className="ord-image" />
                  </div>
                  <div className="ord-item-info">
                    <p className="ord-item-category ord-serif">{item.status}</p>
                    <h3 className="ord-item-title ord-serif">{item.title}</h3>
                    <p className="ord-item-price ord-serif">{item.price}</p>
                  </div>
                  <div className="ord-meta">
                    <span className="ord-meta-label">Purchased</span>
                    <span className="ord-meta-value ord-serif">
                      {item.acquiredDate}
                    </span>
                  </div>
                </div>
                {item.status === "paid" && (
                  <OrderTracker
                    orderId={item.orderId}
                    carrier={item.carrier}
                    trackingNumber={item.trackingNumber}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
