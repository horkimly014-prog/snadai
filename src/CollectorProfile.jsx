import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Heart } from "lucide-react";

import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";
import { artworks } from "./ArtworkData";
import { getFavoriteIds, toggleFavoriteId } from "./favorites";
import { useAuth } from "./useAuth";
import { useAuthGate } from "./useAuthGate";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];


export default function CollectorProfile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { requestAuth } = useAuthGate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = user ? await getFavoriteIds() : [];
      if (!cancelled) setFavoriteIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      requestAuth();
      navigate("/home-page");
    }
  }, [loading, user, requestAuth, navigate]);

  const savedArtworks = artworks.filter((art) => favoriteIds.includes(art.id));

  const removeSaved = (id) => {
    toggleFavoriteId(id).then(setFavoriteIds);
  };

  return (
    <div className="cp-page">
      <style>{`
        .cp-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .cp-page * {
          box-sizing: border-box;
        }
        .cp-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .cp-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .cp-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .cp-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .cp-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .cp-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .cp-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cp-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .cp-menu-btn {
          display: flex;
        }
        .cp-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .cp-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 24px 96px;
        }

        /* Acquisition history */
        .cp-acquisitions {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }
        .cp-acq-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cp-acq-title {
          font-weight: 400;
          font-size: 36px;
          color: #1a1c1c;
          margin: 0;
        }
        .cp-acq-count {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #444748;
        }
        .cp-acq-list {
          display: flex;
          flex-direction: column;
        }
        .cp-acq-item {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 32px 16px 0 0;
          margin-top: 32px;
          border-top: 1px solid #c4c7c7;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .cp-acq-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }
        .cp-acq-item:first-child {
          margin-top: 0;
        }
        .cp-acq-image-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #eee;
        }
        .cp-acq-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .cp-acq-category {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          margin: 0 0 4px 0;
        }
        .cp-acq-title-text {
          font-size: 24px;
          color: #1a1c1c;
          margin: 0 0 4px 0;
        }
        .cp-acq-artist {
          font-size: 14px;
          color: #444748;
          margin: 0;
        }
        .cp-acq-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cp-acq-meta-label {
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
        }
        .cp-acq-meta-value {
          font-size: 14px;
          color: #1a1c1c;
        }
        .cp-heart-btn {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          margin-left: 40px;
          border-radius: 9999px;
          background: rgba(0,0,0,0.04);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cp-saved-empty {
          font-size: 16px;
          color: #747878;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .cp-header-inner { padding: 10px 48px; }
          .cp-nav-desktop { display: flex; }
          .cp-menu-btn { display: none; }
          .cp-main { padding: 64px 48px 128px; }
          .cp-acq-item { flex-direction: row; align-items: center; }
          .cp-acq-image-wrap { width: 160px; flex-shrink: 0; aspect-ratio: 4 / 3; }
          .cp-acq-info { flex: 1 1 260px; }
          .cp-acq-meta { flex: 1 1 140px; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .cp-header-inner { padding: 10px 64px; }
          .cp-main { padding: 64px 64px 128px; }
          .cp-acq-title { font-size: 48px; }
        }
      `}</style>

      {/* Header */}
      <header className="cp-header">
        <div className="cp-header-inner">
          <img src={logoImage} alt="Snadai" className="cp-logo" />

          <nav className="cp-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="cp-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="cp-icons">
            <Link to="/cart" className="cp-icon-btn" aria-label="Cart">
              <ShoppingBag size={18} strokeWidth={1.5} />
            </Link>
            <Link to="/Profile" className="cp-icon-btn" aria-label="Account">
              <User size={18} strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              className="cp-icon-btn cp-menu-btn"
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
          <nav className="cp-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="cp-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="cp-main">
        {/* Saved Artworks */}
        <section className="cp-acquisitions">
          <div className="cp-acq-header">
            <h2 className="cp-acq-title cp-serif">Saved Artworks</h2>
            <span className="cp-acq-count">
              {savedArtworks.length} SAVED
            </span>
          </div>

          {savedArtworks.length === 0 ? (
            <p className="cp-saved-empty cp-serif">
              No saved artworks yet. Tap the heart icon on any piece in the
              catalog to save it here.
            </p>
          ) : (
            <div className="cp-acq-list">
              {savedArtworks.map((art) => (
                <div
                  className="cp-acq-item"
                  key={art.id}
                  onClick={() => navigate(`/artwork/${art.id}`)}
                >
                  <div className="cp-acq-image-wrap">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="cp-acq-image"
                    />
                  </div>
                  <div className="cp-acq-info">
                    <p className="cp-acq-category cp-serif">{art.medium}</p>
                    <h3 className="cp-acq-title-text cp-serif">{art.title}</h3>
                    <p className="cp-acq-artist cp-serif">
                      {art.artist}, {art.year}
                    </p>
                  </div>
                  <div className="cp-acq-meta">
                    <span className="cp-acq-meta-label">Price</span>
                    <span className="cp-acq-meta-value cp-serif">
                      {art.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cp-heart-btn"
                    aria-label={`Remove ${art.title} from favorites`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSaved(art.id);
                    }}
                  >
                    <Heart size={18} strokeWidth={1.5} color="#ac834b" fill="#ac834b" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}