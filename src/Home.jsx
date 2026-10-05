import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X, ArrowRight, Heart } from "lucide-react";

import heroImage from "./assets/image/28.svg";
import exhibitionImage from "./assets/image/08.jpeg";
import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";
import { artworks } from "./ArtworkData";
import { artworkMatchesQuery } from "./searchArtworks";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";
import { getFavoriteIds, toggleFavoriteId } from "./favorites";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

export default function Home() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = user ? await getFavoriteIds() : [];
      if (!cancelled) setFavorites(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleFavorite = (id) => {
    requireAuth(() => {
      toggleFavoriteId(id).then(setFavorites);
    });
  };

  const [auctionLinkFilled, setAuctionLinkFilled] = useState(false);

  const handleViewPreview = (e) => {
    e.preventDefault();
    setAuctionLinkFilled(true);
    setTimeout(() => navigate("/auction"), 300);
  };

  const filteredArtworks = artworks.filter((art) =>
    artworkMatchesQuery(art, searchQuery)
  );

  return (
    <div className="snadai-home">
      <style>{`
        .snadai-home {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .snadai-home * {
          box-sizing: border-box;
        }
        .sh-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .sh-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .sh-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 24px;
        }
        .sh-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .sh-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .sh-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .sh-nav-link.active {
          color: #000;
          border-bottom: 1px solid #ac834b;
          padding-bottom: 5px;
        }
        .sh-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sh-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .sh-menu-btn {
          display: flex;
        }
        .sh-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }
        .sh-search-bar {
          max-width: 1440px;
          margin: 0 auto;
          padding: 16px 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sh-search-input {
          flex: 1;
          border: none;
          border-bottom: 1px solid #1a1c1c;
          background: none;
          padding: 8px 0;
          font-size: 16px;
          font-family: 'Times New Roman', Georgia, serif;
          color: #1a1c1c;
          outline: none;
        }
        .sh-search-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .sh-no-results {
          color: #747878;
          font-size: 16px;
          grid-column: 1 / -1;
        }

        /* Hero */
        .sh-hero {
          position: relative;
          min-height: auto;
          aspect-ratio: 4 / 5;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          background: #f9f9f9;
        }
        .sh-hero-image {
          position: absolute;
          top: -1px;
          right: -1px;
          bottom: -1px;
          left: -1px;
          width: calc(100% + 2px);
          height: calc(100% + 2px);
          object-fit: contain;
        }
        .sh-hero-overlay {
          display: none;
        }
        .sh-hero-content {
          position: relative;
          z-index: 1;
          padding: 24px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
        }
        .sh-hero-title {
          font-weight: 400;
          font-size: 32px;
          line-height: 1.1;
          color: #1a1c1c;
          margin: 0;
          max-width: 640px;
        }

        /* Auction banner */
        .sh-auction {
          background: #eeeeee;
          border-top: 1px solid rgba(196,199,199,0.3);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          padding: 32px 24px;
        }
        .sh-auction-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }
        .sh-auction-title {
          font-weight: 400;
          font-size: 22px;
          margin: 0 0 8px 0;
          letter-spacing: -0.4px;
        }
        .sh-auction-text {
          color: #444748;
          font-size: 15px;
          margin: 0;
        }
        .sh-auction-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 1.2px;
          color: #000;
          background: transparent;
          border: none;
          border-bottom: 1px solid #000;
          padding: 8px 4px 5px;
          text-decoration: none;
          width: fit-content;
          cursor: pointer;
          transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        .sh-auction-link.filled {
          background: #ac834b;
          border-color: #ac834b;
          color: #fff;
        }

        /* Collections */
        .sh-collections {
          padding: 64px 24px;
          max-width: 1440px;
          margin: 0 auto;
        }
        .sh-collections-heading {
          font-weight: 700;
          font-size: 32px;
          color: #1a1c1c;
          margin: 0 0 16px 0;
        }
        .sh-divider {
          background: #ac834b;
          height: 1px;
          width: 200px;
          border: none;
          margin: 0 0 32px 0;
        }
        .sh-bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .sh-card {
          border: 1px solid rgba(196,199,199,0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: pointer;
        }
          .sh-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }
        .sh-card-image-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #eee;
        }
        .sh-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .sh-card-favorite-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .sh-card-body {
          background: #f9f9f9;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .sh-card-title {
          font-weight: 700;
          font-size: 24px;
          color: #1a1c1c;
          margin: 0;
        }
        .sh-card-desc {
          color: #444748;
          font-size: 15px;
          margin: 0;
        }
        .sh-card-link {
          display: inline-flex;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-weight: 600;
          font-size: 18px;
          letter-spacing: 1.2px;
          text-decoration: none;
          width: fit-content;
          padding-bottom: 5px;
          margin-top: auto;
        }
        .sh-card-link.price {
          color: #ac834b;
          border-bottom: 1px solid #ac834b;
        }

        /* Exhibition teaser */
        .sh-exhibition {
          background: #1c1b1b;
          padding: 64px 24px;
        }
        .sh-exhibition-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .sh-exhibition-eyebrow {
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 3.6px;
          color: #858383;
          margin: 0 0 16px 0;
        }
        .sh-exhibition-title {
          font-weight: 400;
          font-size: 40px;
          line-height: 1.15;
          color: #fff;
          margin: 0 0 16px 0;
        }
        .sh-exhibition-desc {
          color: #858383;
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 24px 0;
          max-width: 480px;
        }
        .sh-exhibition-meta {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .sh-exhibition-meta-item {
          border-left: 1px solid #c4c7c7;
          padding-left: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sh-exhibition-meta-label {
          font-size: 11px;
          letter-spacing: 1.2px;
          color: #858383;
          margin: 0;
        }
        .sh-exhibition-meta-value {
          font-size: 15px;
          color: #fff;
          margin: 0;
        }
        .sh-exhibition-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          color: #fff;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          letter-spacing: 1.2px;
          cursor: pointer;
          padding: 0;
        }
        .sh-exhibition-image-wrap {
          position: relative;
          display: block;
          border: 1px solid rgba(116,120,120,0.3);
          overflow: hidden;
          aspect-ratio: 4 / 3;
          cursor: pointer;
        }
        .sh-exhibition-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .sh-exhibition-image-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0);
          transition: background 0.3s ease;
        }
        .sh-exhibition-image-wrap:hover .sh-exhibition-image-overlay {
          background: rgba(0,0,0,0.55);
        }
        .sh-exhibition-image-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 1.2px;
          padding: 12px 20px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .sh-exhibition-image-wrap:hover .sh-exhibition-image-btn {
          opacity: 1;
          transform: translateY(0);
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .sh-header-inner { padding: 10px 48px; }
          .sh-hero { min-height: 100vh; aspect-ratio: auto; }
          .sh-hero-image { object-fit: cover; }
          .sh-hero-overlay {
            display: block;
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%);
          }
          .sh-hero-content { padding: 64px 48px; }
          .sh-hero-title { font-size: 56px; color: #fff; }
          .sh-auction { padding: 40px 48px; }
          .sh-auction-inner { flex-direction: row; justify-content: space-between; align-items: center; }
          .sh-collections { padding: 96px 48px; }
          .sh-exhibition { padding: 96px 48px; }
          .sh-exhibition-inner { flex-direction: row; align-items: center; }
          .sh-exhibition-inner > div { flex: 1 1 0; min-width: 0; }
        }

        /* Nav needs more room than the tablet breakpoint gives it (logo +
           5 links + 4 icons), so it switches over a bit later than the
           rest of the tablet layout to avoid crowding on iPad portrait. */
        @media (min-width: 900px) {
          .sh-nav-desktop { display: flex; }
          .sh-menu-btn { display: none; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .sh-header-inner { padding: 10px 64px; }
          .sh-hero-title { font-size: 72px; }
          .sh-collections { padding: 96px 64px; }
          .sh-exhibition { padding: 128px 64px; }
          .sh-exhibition-title { font-size: 56px; }
        }
      `}</style>

      {/* Header */}
      <header className="sh-header">
        <div className="sh-header-inner">
          <img src={logoImage} alt="Snadai" className="sh-logo" />

          <nav className="sh-nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`sh-nav-link ${link.label === "Home" ? "active" : ""}`}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="sh-icons">
            <button
              type="button"
              className="sh-icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="sh-icon-btn"
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="sh-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="sh-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="sh-icon-btn sh-menu-btn"
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
          <nav className="sh-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`sh-nav-link ${link.label === "Home" ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}

        {searchOpen && (
          <div className="sh-search-bar">
            <Search size={18} strokeWidth={1.5} />
            <input
              type="text"
              className="sh-search-input"
              placeholder="Search artworks, artists, mediums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="sh-search-close"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="sh-hero">
        <img src={heroImage} alt="" className="sh-hero-image" />
        <div className="sh-hero-overlay" />
        <div className="sh-hero-content">
          <h1 className="sh-hero-title sh-serif">The Silence of Form</h1>
        </div>
      </section>

      {/* Auction banner */}
      <section className="sh-auction">
        <div className="sh-auction-inner">
          <div>
            <h2 className="sh-auction-title sh-serif">
              Upcoming Auction: The Inaugural Series
            </h2>
            <p className="sh-auction-text sh-serif">
              A curated collection of contemporary sculpture and digital
              media. Starting November 15.
            </p>
          </div>
          <button
            type="button"
            className={`sh-auction-link ${auctionLinkFilled ? "filled" : ""}`}
            onClick={handleViewPreview}
          >
            VIEW PREVIEW <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* Curated Collections */}
      <section className="sh-collections">
        <h2 className="sh-collections-heading sh-serif">
          Curated Collections
        </h2>
        <hr className="sh-divider" />

        <div className="sh-bento-grid">
          {filteredArtworks.length === 0 && (
            <p className="sh-no-results sh-serif">
              No artworks match "{searchQuery}".
            </p>
          )}
          {filteredArtworks.map((art) => (
            <div
              className="sh-card"
              key={art.id}
              onClick={() => navigate(`/artwork/${art.id}`)}
            >
              <div
                className="sh-card-image-wrap"
                style={{ aspectRatio: "4 / 5" }}
              >
                <button
                  type="button"
                  className="sh-card-favorite-btn"
                  aria-label={
                    favorites.includes(art.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(art.id);
                  }}
                >
                  <Heart
                    size={18}
                    strokeWidth={1.5}
                    color="#1a1c1c"
                    fill={favorites.includes(art.id) ? "#ac834b" : "none"}
                  />
                </button>
                <img src={art.image} alt={art.title} className="sh-card-image" />
              </div>
              <div className="sh-card-body">
                <h3
                  className="sh-card-title"
                  style={{ fontFamily: "'Bodoni Moda', 'Times New Roman', serif" }}
                >
                  {art.title}
                </h3>
                <p className="sh-card-desc">
                  {art.medium}, {art.year}
                </p>
                <a
                  href="#"
                  className="sh-card-link price"
                  onClick={(e) => e.preventDefault()}
                >
                  {art.price}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Exhibition Teaser */}
      <section className="sh-exhibition">
        <div className="sh-exhibition-inner">
          <div>
            <p className="sh-exhibition-eyebrow">OPENING OCTOBER 2026</p>
            <h2 className="sh-exhibition-title sh-serif">Echoes of Light</h2>
            <p className="sh-exhibition-desc sh-serif">
              An immersive exhibition by Elena Vance exploring the duality of
              permanence and transience through light-refractive glass
              installations.
            </p>

            <div className="sh-exhibition-meta">
              <div className="sh-exhibition-meta-item">
                <p className="sh-exhibition-meta-label sh-serif">DATE</p>
                <p className="sh-exhibition-meta-value sh-serif">
                  12.10 - 24.11
                </p>
              </div>
              <div className="sh-exhibition-meta-item">
                <p className="sh-exhibition-meta-label sh-serif">LOCATION</p>
                <p className="sh-exhibition-meta-value">WWW.DOMNER.COM</p>
              </div>
            </div>

            <button type="button" className="sh-exhibition-cta sh-serif">
              REQUEST INVITATION <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>

          <div>
            <Link to="/auction" className="sh-exhibition-image-wrap">
              <img
                src={exhibitionImage}
                alt="Echoes of Light"
                className="sh-exhibition-image"
              />
              <div className="sh-exhibition-image-overlay">
                <span className="sh-exhibition-image-btn">
                  VIEW AUCTION <ArrowRight size={14} strokeWidth={2} />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}