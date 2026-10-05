import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Heart, Trophy } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";
import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";


import lotImage from "./assets/image/07.jpg";


const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

const LOT_ID = "lot-042";
const PAYMENT_WINDOW_MS = 5 * 60 * 1000;
const STARTING_BID = 15000;
const RESERVE_PRICE = 15000;
const MAX_BID = 99000000;
const LOT_TITLE = "The Silence of Form";
const LOT_ARTIST = "Elena Rossi, 2026";
const LOT_MEDIUM = "Hand-carved Carrara Marble";
const LOT_DIMENSIONS = "110 x 85 x 60 cm";

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
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function secondsUntil(closesAt) {
  return Math.max(0, Math.round((new Date(closesAt).getTime() - Date.now()) / 1000));
}

export default function Auction() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [bidError, setBidError] = useState("");
  const [closesAt, setClosesAt] = useState(null);
  const [round, setRound] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const hasEmailedRef = useRef(false);

  const currentBid = bids[0]?.amount ?? STARTING_BID;
  const displayName = user?.user_metadata?.full_name || user?.email || "";
  const hasEnded = secondsLeft === 0;
  const winningBid = bids[0];
  const isWinner = hasEnded && Boolean(winningBid) && Boolean(user) && winningBid.user_id === user.id;

  const goToResults = () => {
    navigate("/AuctionResults", {
      state: {
        lotNumber: "042",
        round,
        title: LOT_TITLE,
        artist: LOT_ARTIST,
        medium: LOT_MEDIUM,
        dimensions: LOT_DIMENSIONS,
        image: lotImage,
        winnerName: displayName,
        finalBid: winningBid.amount,
        closeDate: dateFormatter.format(new Date(closesAt)),
        payBy: new Date(new Date(closesAt).getTime() + PAYMENT_WINDOW_MS).toISOString(),
      },
    });
  };

  // Fetches the lot's real, shared closing time + round once, so the
  // countdown below is one fixed deadline for every visitor instead of a
  // per-browser timer that restarts on refresh. Also subscribes to updates
  // on this row: if nobody pays in time, get_lot_winner (called from
  // AuctionResults.jsx) reopens the lot with a new round + closes_at, and
  // without this subscription a tab left open past the original close time
  // would stay stuck showing "AUCTION ENDED" instead of picking up the
  // fresh round.
  useEffect(() => {
    let cancelled = false;

    supabase
      .from("lots")
      .select("closes_at, round")
      .eq("id", LOT_ID)
      .single()
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          setClosesAt(data.closes_at);
          setRound(data.round);
          setSecondsLeft(secondsUntil(data.closes_at));
        }
      });

    const channel = supabase
      .channel(`lot-${LOT_ID}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lots", filter: `id=eq.${LOT_ID}` },
        (payload) => {
          setClosesAt(payload.new.closes_at);
          setRound(payload.new.round);
          setSecondsLeft(secondsUntil(payload.new.closes_at));
          hasEmailedRef.current = false;
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Recomputes the remaining time from the real deadline on every tick
  // (rather than just decrementing a counter), so it stays correct even if
  // the tab was backgrounded/throttled for a while.
  useEffect(() => {
    if (!closesAt) return;

    const timer = setInterval(() => {
      setSecondsLeft(secondsUntil(closesAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [closesAt]);

  // Once the clock hits zero, email the highest bidder that they won. They
  // stay on this page and see a "You Won!" banner with a button to head to
  // the results page on their own terms, rather than being redirected away
  // out from under them.
  useEffect(() => {
    if (!isWinner || hasEmailedRef.current) return;
    hasEmailedRef.current = true;

    supabase.functions
      .invoke("send-auction-win-email", {
        body: { lotId: LOT_ID, lotTitle: LOT_TITLE },
      })
      .catch((err) => console.error("Failed to send win email:", err));
  }, [isWinner]);

  // Scoped to the current round: a restarted auction keeps the old round's
  // bids in the table for history, but they shouldn't count toward the
  // live current bid or recent activity.
  useEffect(() => {
    if (round === null) return;
    let cancelled = false;

    supabase
      .from("bids")
      .select("id, user_id, bidder_name, amount, created_at")
      .eq("lot_id", LOT_ID)
      .eq("round", round)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          setBids(data);
        }
      });

    const channel = supabase
      .channel(`bids-${LOT_ID}-${round}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `lot_id=eq.${LOT_ID}` },
        (payload) => {
          if (payload.new.round !== round) return;
          setBids((prev) => {
            if (prev.some((b) => b.id === payload.new.id)) return prev;
            return [payload.new, ...prev].slice(0, 10);
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [round]);

  const handlePlaceBid = () => {
    requireAuth(async () => {
      if (bidAmount.trim() === "") {
        setBidError("Enter a bid amount.");
        return;
      }

      const amount = Number(bidAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setBidError("Enter a valid bid amount.");
        return;
      }

      if (amount <= currentBid) {
        setBidError(
          `Enter a bid higher than ${currencyFormatter.format(currentBid)}.`
        );
        return;
      }

      if (amount > MAX_BID) {
        setBidError(
          `Bids are capped at ${currencyFormatter.format(MAX_BID)}.`
        );
        return;
      }

      if (round === null) {
        setBidError("Still loading auction details, try again in a moment.");
        return;
      }

      setBidError("");
      setPlacingBid(true);

      const { data, error } = await supabase
        .from("bids")
        .insert({
          lot_id: LOT_ID,
          round,
          user_id: user.id,
          bidder_name: displayName,
          amount,
        })
        .select("id, user_id, bidder_name, amount, created_at")
        .single();

      setPlacingBid(false);

      if (error) {
        setBidError(error.message);
        return;
      }

      setBids((prev) => {
        if (prev.some((b) => b.id === data.id)) return prev;
        return [data, ...prev].slice(0, 10);
      });
      setBidAmount("");
    });
  };

  return (
    <div className="au-page">
      <style>{`
        .au-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .au-page * {
          box-sizing: border-box;
        }
        .au-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .au-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .au-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .au-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .au-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .au-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .au-nav-link.active {
          color: #000;
          border-bottom: 1px solid #ac834b;
          padding-bottom: 5px;
        }
        .au-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .au-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .au-menu-btn {
          display: flex;
        }
        .au-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .au-main {
          max-width: 1312px;
          margin: 0 auto;
          padding: 48px 24px 96px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 80px;
        }

        /* Featured lot */
        .au-lot-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          width: 100%;
        }

        .au-image-col {
          background: #fff;
          border: 1px solid #e2e2e2;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .au-lot-image-wrap {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #eee;
        }
        .au-lot-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .au-lot-eyebrow {
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #5d5f5f;
          margin: 0 0 8px 0;
        }
        .au-lot-title {
          font-weight: 400;
          font-size: 40px;
          line-height: 1.15;
          color: #1a1c1c;
          margin: 0 0 8px 0;
        }
        .au-lot-artist {
          font-size: 16px;
          color: #1a1c1c;
          margin: 0 0 16px 0;
        }
        .au-lot-specs {
          border-top: 1px solid #c4c7c7;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .au-lot-spec {
          font-size: 16px;
          color: #5d5f5f;
        }

        .au-bidding-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .au-countdown {
          background: #1b1c1c;
          padding: 24px;
          text-align: center;
        }
        .au-countdown-label {
          font-size: 14px;
          letter-spacing: 1.2px;
          color: #fff;
          opacity: 0.8;
          margin: 0 0 8px 0;
        }
        .au-countdown-time {
          font-size: 28px;
          letter-spacing: 2px;
          color: #fff;
          margin: 0;
        }

        .au-winner-banner {
          background: #1b1c1c;
          border: 1px solid #ac834b;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .au-winner-heading {
          font-size: 22px;
          color: #fff;
          margin: 8px 0 0 0;
        }
        .au-winner-text {
          font-size: 14px;
          color: #c4c7c7;
          margin: 0 0 12px 0;
        }
        .au-view-result-btn {
          width: 100%;
          background: #ac834b;
          color: #000;
          border: none;
          cursor: pointer;
          padding: 16px 0;
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
        .au-ended-text {
          font-size: 15px;
          color: #5d5f5f;
        }

        .au-bid-status {
          background: #f9f9f9;
          border: 1px solid #c4c7c7;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .au-bid-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .au-bid-label {
          font-size: 14px;
          letter-spacing: 1.2px;
          color: #5d5f5f;
          margin: 0 0 4px 0;
        }
        .au-bid-amount {
          font-size: 48px;
          letter-spacing: -1px;
          color: #ac834b;
          margin: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .au-live-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .au-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #ba1a1a;
        }
        .au-live-text {
          font-size: 12px;
          letter-spacing: 1.2px;
          color: #ba1a1a;
        }
        .au-bid-meta {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .au-bid-meta-row {
          display: flex;
          justify-content: space-between;
        }
        .au-bid-meta-label {
          font-size: 15px;
          color: #5d5f5f;
        }
        .au-bid-meta-value {
          font-size: 13px;
          color: #1a1c1c;
        }
        .au-bid-form-label {
          font-size: 14px;
          letter-spacing: 1.2px;
          color: #1a1c1c;
          margin: 0 0 8px 0;
          display: block;
        }
        .au-bid-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #000;
          padding: 16px 12px;
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 16px;
          color: #1a1c1c;
          outline: none;
        }
        .au-place-bid {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 16px 0;
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
        .au-place-bid:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .au-bid-error {
          font-size: 13px;
          color: #ba1a1a;
          margin: 8px 0 0 0;
        }
        .au-recent-empty {
          font-size: 14px;
          color: #5d5f5f;
          padding: 8px 0;
        }

        .au-recent {
          border: 1px solid #c4c7c7;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .au-recent-heading {
          font-size: 12px;
          letter-spacing: 1.2px;
          color: #1a1c1c;
          margin: 0;
        }
        .au-recent-list {
          display: flex;
          flex-direction: column;
        }
        .au-recent-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e2e2;
          font-size: 16px;
          color: #1a1c1c;
        }
        .au-recent-item:last-child {
          border-bottom: none;
        }

        /* Charity section */
        .au-charity {
          border-top: 1px solid #c4c7c7;
          padding-top: 64px;
          max-width: 640px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          text-align: center;
        }
        .au-charity-heading {
          font-weight: 400;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0;
        }
        .au-charity-text {
          font-size: 16px;
          line-height: 1.8;
          color: #5d5f5f;
          margin: 0;
        }
        .au-charity-link {
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #1a1c1c;
          text-decoration: underline;
          background: none;
          border: none;
          cursor: pointer;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .au-header-inner { padding: 10px 48px; }
          .au-nav-desktop { display: flex; }
          .au-menu-btn { display: none; }
          .au-main { padding: 64px 48px 128px; }
          .au-lot-grid { grid-template-columns: 7fr 5fr; align-items: start; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .au-header-inner { padding: 10px 64px; }
          .au-main { padding: 96px 64px; }
          .au-lot-title { font-size: 48px; }
          .au-bid-amount { font-size: 64px; }
        }
      `}</style>

      {/* Header */}
      <header className="au-header">
        <div className="au-header-inner">
          <img src={logoImage} alt="Snadai" className="au-logo" />

          <nav className="au-nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`au-nav-link ${link.label === "Auction" ? "active" : ""}`}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="au-icons">
            <button
              type="button"
              className="au-icon-btn"
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="au-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="au-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="au-icon-btn au-menu-btn"
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
          <nav className="au-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`au-nav-link ${link.label === "Auction" ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="au-main">
        {/* Featured Lot */}
        <div className="au-lot-grid">
          <div className="au-image-col">
            <div className="au-lot-image-wrap">
              <img src={lotImage} alt="The Silence of Form" className="au-lot-image" />
            </div>
            <div>
              <p className="au-lot-eyebrow au-serif">Lot 042 / Current Lead</p>
              <h1 className="au-lot-title au-serif">The Silence of Form</h1>
              <p className="au-lot-artist au-serif">Elena Rossi, 2026</p>
              <div className="au-lot-specs">
                <span className="au-lot-spec au-serif">
                  Hand-carved Carrara Marble
                </span>
                <span className="au-lot-spec au-serif">110 x 85 x 60 cm</span>
              </div>
            </div>
          </div>

          <div className="au-bidding-col">
            <div className="au-countdown">
              <p className="au-countdown-label au-serif">
                {hasEnded ? "AUCTION ENDED" : "AUCTION ENDS IN"}
              </p>
              <p className="au-countdown-time au-serif">
                {secondsLeft === null ? "--:--:--" : formatTime(secondsLeft)}
              </p>
            </div>

            {isWinner && (
              <div className="au-winner-banner">
                <Trophy size={28} strokeWidth={1.5} color="#ac834b" />
                <p className="au-winner-heading au-serif">You won this lot!</p>
                <p className="au-winner-text au-serif">
                  Your winning bid was {currencyFormatter.format(winningBid.amount)}.
                </p>
                <button
                  type="button"
                  className="au-view-result-btn au-serif"
                  onClick={goToResults}
                >
                  View Your Result
                </button>
              </div>
            )}

            <div className="au-bid-status">
              <div className="au-bid-top">
                <div>
                  <p className="au-bid-label au-serif">CURRENT BID</p>
                  <p className="au-bid-amount au-serif">
                    {currencyFormatter.format(currentBid)}
                  </p>
                </div>
                <div className="au-live-row">
                  <span className="au-live-dot" />
                  <span className="au-live-text au-serif">LIVE</span>
                </div>
              </div>

              <div className="au-bid-meta">
                <div className="au-bid-meta-row">
                  <span className="au-bid-meta-label au-serif">
                    Reserve Price
                  </span>
                  <span className="au-bid-meta-value au-serif">
                    {currentBid >= RESERVE_PRICE ? "Met" : "Not met"}
                  </span>
                </div>
              </div>

              {hasEnded ? (
                <p className="au-ended-text au-serif">
                  {isWinner
                    ? "Head to your results to complete the purchase."
                    : winningBid
                    ? `Sold to ${winningBid.bidder_name}.`
                    : "This lot received no bids."}
                </p>
              ) : (
                <>
                  <div>
                    <label className="au-bid-form-label au-serif" htmlFor="bid-amount">
                      Bid amount (USD)
                    </label>
                    <input
                      id="bid-amount"
                      type="number"
                      min={1}
                      placeholder="Enter your bid"
                      className="au-bid-input"
                      value={bidAmount}
                      onChange={(e) => {
                        setBidAmount(e.target.value);
                        setBidError("");
                      }}
                    />
                    {bidError && (
                      <p className="au-bid-error au-serif">{bidError}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="au-place-bid"
                    onClick={handlePlaceBid}
                    disabled={placingBid}
                  >
                    {placingBid ? "Placing bid…" : "Place bid"}
                  </button>
                </>
              )}
            </div>

            <div className="au-recent">
              <p className="au-recent-heading au-serif">RECENT ACTIVITY</p>
              <div className="au-recent-list">
                {bids.length === 0 && (
                  <p className="au-recent-empty au-serif">
                    No bids yet. Be the first to bid.
                  </p>
                )}
                {bids.map((bid, i) => (
                  <div
                    className="au-recent-item au-serif"
                    style={{ opacity: Math.max(1 - i * 0.2, 0.2) }}
                    key={bid.id}
                  >
                    <span>{bid.bidder_name}</span>
                    <span>{currencyFormatter.format(bid.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charity cause */}
        <div className="au-charity">
          <h2 className="au-charity-heading au-serif">Art for Education</h2>
          <p className="au-charity-text au-serif">
            100% of the hammer price from this lot will be donated to the
            Artisan Curated Foundation's "Art for Education" initiative.
            These funds directly support archival studies and restoration
            scholarships for emerging art historians in underserved
            communities, ensuring the preservation of contemporary culture
            for generations to come.
          </p>
          <button
            type="button"
            className="au-charity-link au-serif"
            onClick={() => navigate("/AuctionResults?demo=1")}
          >
            VIEW THE WINNERS
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}