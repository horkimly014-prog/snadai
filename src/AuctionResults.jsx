import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";
import Footer from "./Footer";

import { artworks } from "./ArtworkData";
import logoImage from "./assets/image/Logo.png";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

// Only one lot runs at a time today, so this mirrors the LOT_ID Auction.jsx
// bids against — used to re-derive the winner below when this page is
// opened without route state (e.g. the "view your win" link in the win
// email, or a refresh).
const LOT_ID = "lot-042";

// Falls back to an existing artwork image so nothing's missing/expired
// when this page is opened directly instead of via a won auction.
const defaultLotImage = artworks[6]?.image;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}`;
}

function secondsUntil(deadline) {
  return Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000));
}

export default function AuctionResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // ?demo=1 shows this page with sample data instead of the real
  // "are you actually the current winner" DB check below — for showing the
  // page off (e.g. to a teacher) without needing a real completed auction
  // win lined up. The real flow for actual winners is untouched.
  const isDemo = searchParams.get("demo") === "1";
  const requireAuth = useRequireAuth();
  const { user, loading: authLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Optimistic pre-fill right after clicking "View Your Result" on
  // Auction.jsx, so there's no blank flash while the authoritative check
  // below runs. Overwritten by resolveWinner()'s result as soon as it lands.
  const [winner, setWinner] = useState(() => {
    if (isDemo) {
      return {
        winnerName: "Hor Kimly",
        finalBid: 65000,
        round: 1,
        payBy: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        paid: false,
        closeDate: dateFormatter.format(new Date()),
      };
    }
    if (!location.state?.winnerName) return null;
    const { winnerName, finalBid, closeDate, round, payBy } = location.state;
    return { winnerName, finalBid, closeDate, round, payBy, paid: false };
  });
  const [secondsToPay, setSecondsToPay] = useState(() =>
    winner?.payBy && !winner.paid ? secondsUntil(winner.payBy) : null
  );

  const {
    lotNumber = "042",
    title = "The Silence of Form",
    artist = "Elena Rossi, 2026",
    medium = "Hand-carved Carrara Marble",
    dimensions = "110 x 85 x 60 cm",
    image = defaultLotImage,
  } = location.state || {};

  // The authoritative "who currently holds the right to buy this lot" check
  // — the same one get_lot_winner uses for send-auction-win-email. Never
  // trusted purely from route state, because the winner can change after
  // the fact: if the top bidder misses their payment window, the
  // next-highest bidder becomes the active winner with their own window,
  // and if all three miss it the lot reopens for a fresh round. Anyone who
  // isn't the current active winner is sent back to the live auction
  // instead of being shown stale or wrong winner info.
  const resolveWinner = useCallback(() => {
    if (isDemo) return;
    requireAuth(async () => {
      const [{ data: lot }, { data: rows, error }] = await Promise.all([
        supabase.from("lots").select("closes_at").eq("id", LOT_ID).single(),
        supabase.rpc("get_lot_winner", { p_lot_id: LOT_ID }),
      ]);

      const row = rows?.[0];

      if (error || !row || row.user_id !== user.id) {
        navigate("/auction", { replace: true });
        return;
      }

      setWinner({
        winnerName: row.bidder_name,
        finalBid: row.amount,
        round: row.round,
        payBy: row.pay_by,
        paid: row.paid,
        closeDate: lot ? dateFormatter.format(new Date(lot.closes_at)) : undefined,
      });
      setSecondsToPay(row.pay_by && !row.paid ? secondsUntil(row.pay_by) : null);
    });
  }, [isDemo, requireAuth, user, navigate]);

  useEffect(() => {
    if (isDemo || authLoading) return;
    resolveWinner();
  }, [isDemo, authLoading, resolveWinner]);

  // Ticks down the payment window shown below; once it hits zero, re-checks
  // with the database in case the active winner has changed underneath —
  // missed their own window, the next bidder got promoted, or the round
  // reset entirely. In demo mode it just loops the countdown instead of
  // ever re-resolving, since there's no real deadline to enforce.
  useEffect(() => {
    if (!winner?.payBy || winner.paid) return;

    const timer = setInterval(() => {
      const remaining = secondsUntil(winner.payBy);
      setSecondsToPay(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        if (isDemo) {
          setWinner((w) => ({
            ...w,
            payBy: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          }));
        } else {
          resolveWinner();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isDemo, winner?.payBy, winner?.paid, resolveWinner]);

  const { winnerName, finalBid, closeDate, round, paid } = winner || {};

  const handlePurchase = () => {
    requireAuth(() => {
      navigate("/checkout", {
        state: {
          cartItems: [
            {
              id: lotNumber,
              round,
              title,
              price: currencyFormatter.format(finalBid),
              image,
            },
          ],
        },
      });
    });
  };

  // Still confirming (or the login prompt is up) that the visitor opening
  // this link is actually the current active winner — render nothing
  // rather than flash placeholder winner info while that's in flight.
  if (!winner) {
    return (
      <div className="ar-page" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Times New Roman', Georgia, serif", color: "#5d5f5f" }}>
          Confirming your result…
        </p>
      </div>
    );
  }

  return (
    <div className="ar-page">
      <style>{`
        .ar-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .ar-page * {
          box-sizing: border-box;
        }
        .ar-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .ar-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .ar-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .ar-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .ar-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .ar-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .ar-nav-link.active {
          color: #000;
          border-bottom: 1px solid #ac834b;
          padding-bottom: 5px;
        }
        .ar-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ar-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .ar-menu-btn {
          display: flex;
        }
        .ar-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .ar-main {
          max-width: 1312px;
          margin: 0 auto;
          padding: 48px 24px 96px;
        }

        /* Announcement */
        .ar-announcement {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 48px;
        }
        .ar-eyebrow {
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #5d5f5f;
          margin: 0 0 16px 0;
        }
        .ar-title {
          font-weight: 400;
          font-size: 36px;
          line-height: 1.15;
          color: #000;
          margin: 0;
        }
        .ar-close-label {
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #5d5f5f;
          margin: 0 0 8px 0;
        }
        .ar-close-date {
          font-size: 16px;
          color: #1a1c1c;
          margin: 0;
        }

        /* Lot detail grid */
        .ar-lot-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .ar-image-col {
          background: #fff;
          border: 1px solid #e2e2e2;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ar-lot-image-wrap {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #eee;
        }
        .ar-lot-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ar-lot-eyebrow {
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #5d5f5f;
          margin: 0 0 8px 0;
        }
        .ar-lot-title {
          font-weight: 400;
          font-size: 32px;
          line-height: 1.2;
          color: #1a1c1c;
          margin: 0 0 8px 0;
        }
        .ar-lot-artist {
          font-size: 16px;
          color: #1a1c1c;
          margin: 0 0 16px 0;
        }
        .ar-lot-specs {
          border-top: 1px solid #c4c7c7;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ar-lot-spec {
          font-size: 16px;
          color: #5d5f5f;
        }

        .ar-info-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ar-info-title {
          font-weight: 400;
          font-size: 32px;
          color: #1a1c1c;
          margin: 0;
        }
        .ar-info-artist {
          font-size: 16px;
          color: #5d5f5f;
          margin: 0;
        }

        .ar-winning-box {
          background: #000;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ar-winning-label {
          font-size: 12px;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: #858383;
          margin: 0;
        }
        .ar-winning-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ar-winner-name {
          font-size: 56px;
          letter-spacing: -1px;
          color: #fff;
          margin: 0;
        }
        .ar-final-bid-label {
          font-size: 14px;
          letter-spacing: 1.2px;
          color: #858383;
          margin: 0 0 4px 0;
          text-align: right;
        }
        .ar-final-bid-value {
          font-size: 28px;
          color: #fff;
          margin: 0;
          text-align: right;
        }
        .ar-pay-deadline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #444748;
          padding-top: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ar-pay-deadline-label {
          font-size: 13px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #858383;
          margin: 0;
        }
        .ar-pay-deadline-time {
          font-size: 20px;
          letter-spacing: 1px;
          color: #ba1a1a;
          margin: 0;
        }
        .ar-paid-note {
          font-size: 13px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #4caf50;
          margin: 0;
        }

        .ar-details-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ar-detail-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #c4c7c7;
          padding-bottom: 16px;
        }
        .ar-detail-label {
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #5d5f5f;
        }
        .ar-detail-value {
          font-size: 16px;
          color: #1a1c1c;
        }

        .ar-purchase-btn {
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 20px 32px;
          font-size: 20px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        /* Thank you section */
        .ar-thankyou {
          max-width: 640px;
          margin: 96px auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          text-align: center;
        }
        .ar-thankyou-heading {
          font-weight: 400;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0;
        }
        .ar-thankyou-text {
          font-size: 16px;
          line-height: 1.8;
          color: #5d5f5f;
          margin: 0;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .ar-header-inner { padding: 10px 48px; }
          .ar-nav-desktop { display: flex; }
          .ar-menu-btn { display: none; }
          .ar-main { padding: 64px 48px 128px; }
          .ar-announcement { flex-direction: row; align-items: flex-end; justify-content: space-between; }
          .ar-close-label, .ar-close-date { text-align: right; }
          .ar-lot-grid { flex-direction: row; align-items: flex-start; gap: 48px; }
          .ar-image-col { flex: 1 1 55%; min-width: 0; }
          .ar-info-col { flex: 1 1 40%; min-width: 320px; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .ar-header-inner { padding: 10px 64px; }
          .ar-main { padding: 64px 64px 128px; }
          .ar-title { font-size: 48px; }
        }
      `}</style>

      {/* Header */}
      <header className="ar-header">
        <div className="ar-header-inner">
          <img src={logoImage} alt="Snadai" className="ar-logo" />

          <nav className="ar-nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`ar-nav-link ${link.label === "Auction" ? "active" : ""}`}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="ar-icons">
            <button type="button" className="ar-icon-btn" aria-label="Search">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ar-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ar-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ar-icon-btn ar-menu-btn"
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
          <nav className="ar-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`ar-nav-link ${link.label === "Auction" ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="ar-main">
        {/* Announcement */}
        <div className="ar-announcement">
          <div>
            <p className="ar-eyebrow ar-serif">AUCTION CONCLUDED</p>
            <h1 className="ar-title ar-serif">
              Art for Education:
              <br />
              Charity Event
            </h1>
          </div>
          <div>
            <p className="ar-close-label ar-serif">OFFICIAL CLOSE DATE</p>
            <p className="ar-close-date ar-serif">{closeDate}</p>
          </div>
        </div>

        {/* Lot detail + winning bid */}
        <div className="ar-lot-grid">
          <div className="ar-image-col">
            <div className="ar-lot-image-wrap">
              <img src={image} alt={title} className="ar-lot-image" />
            </div>
            <div>
              <p className="ar-lot-eyebrow ar-serif">Lot {lotNumber} / Sold</p>
              <h2 className="ar-lot-title ar-serif">{title}</h2>
              <p className="ar-lot-artist ar-serif">{artist}</p>
              <div className="ar-lot-specs">
                <span className="ar-lot-spec ar-serif">{medium}</span>
                <span className="ar-lot-spec ar-serif">{dimensions}</span>
              </div>
            </div>
          </div>

          <div className="ar-info-col">
            <div>
              <h2 className="ar-info-title ar-serif">{title}</h2>
              <p className="ar-info-artist ar-serif">{artist}</p>
            </div>

            <div className="ar-winning-box">
              <p className="ar-winning-label ar-serif">Acquired By</p>
              <div className="ar-winning-row">
                <p className="ar-winner-name ar-serif">{winnerName}</p>
                <div>
                  <p className="ar-final-bid-label ar-serif">FINAL BID</p>
                  <p className="ar-final-bid-value ar-serif">
                    {currencyFormatter.format(finalBid)}
                  </p>
                </div>
              </div>

              {paid ? (
                <p className="ar-paid-note ar-serif">Payment received</p>
              ) : (
                <div className="ar-pay-deadline">
                  <p className="ar-pay-deadline-label ar-serif">
                    Pay within
                  </p>
                  <p className="ar-pay-deadline-time ar-serif">
                    {secondsToPay === null ? "--:--" : formatTime(secondsToPay)}
                  </p>
                </div>
              )}
            </div>

            <div className="ar-details-list">
              <div className="ar-detail-row">
                <span className="ar-detail-label ar-serif">Medium</span>
                <span className="ar-detail-value ar-serif">{medium}</span>
              </div>
              <div className="ar-detail-row">
                <span className="ar-detail-label ar-serif">Dimensions</span>
                <span className="ar-detail-value ar-serif">{dimensions}</span>
              </div>
            </div>

            {!paid && (
              <button
                type="button"
                className="ar-purchase-btn ar-serif"
                onClick={handlePurchase}
              >
                Purchase
              </button>
            )}
          </div>
        </div>

        {/* Thank you note */}
        <div className="ar-thankyou">
          <h2 className="ar-thankyou-heading ar-serif">
            Thank you to our patrons.
          </h2>
          <p className="ar-thankyou-text ar-serif">
            We extend our deepest gratitude to Elena Rossi for her generous
            donation, and to all our participants who recognize that the
            preservation of art starts with the education of its future
            creators. Your support ensures the continuity of the creative
            dialogue.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}