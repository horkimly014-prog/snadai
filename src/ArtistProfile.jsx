import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { artworks, artists } from "./ArtworkData";
import { getFavoriteIds, toggleFavoriteId } from "./favorites";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";
import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

export default function ArtistProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const artistName = decodeURIComponent(name || "");
  const artistInfo = artists[artistName];
  const portfolio = artworks.filter((art) => art.artist === artistName);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [artistName]);

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

  return (
    <div className="arp-page">
      <style>{`
        .arp-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .arp-page * {
          box-sizing: border-box;
        }
        .arp-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .arp-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .arp-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .arp-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .arp-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .arp-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .arp-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .arp-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .arp-menu-btn {
          display: flex;
        }
        .arp-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Hero */
        .arp-hero {
          max-width: 1440px;
          margin: 0 auto;
          padding: 64px 24px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }
        .arp-avatar {
          width: 140px;
          height: 140px;
          border-radius: 9999px;
          object-fit: cover;
        }
        .arp-name {
          font-weight: 400;
          font-size: 40px;
          color: #1a1c1c;
          margin: 0;
        }
        .arp-location {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #ac834b;
          margin: 0;
        }
        .arp-bio {
          max-width: 640px;
          font-size: 16px;
          line-height: 26px;
          color: #444748;
          margin: 8px 0 0;
        }

        /* Portfolio */
        .arp-portfolio {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px 64px;
        }
        .arp-portfolio-heading {
          font-weight: 700;
          font-size: 24px;
          color: #000;
          margin: 0 0 24px 0;
        }
        .arp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .arp-card {
          border: 1px solid rgba(196,199,199,0.3);
          display: flex;
          flex-direction: column;
          background: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .arp-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }
        .arp-card-image-wrap {
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #eeeeee;
          position: relative;
        }
        .arp-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .arp-favorite-btn {
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
        .arp-card-body {
          background: #f9f9f9;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .arp-card-title {
          font-weight: 700;
          font-size: 20px;
          color: #000;
          margin: 0;
        }
        .arp-card-medium {
          font-size: 14px;
          color: #747878;
          margin: 0;
        }
        .arp-card-price {
          display: inline-block;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 1px;
          color: #ac834b;
          margin-top: 8px;
        }
        .arp-empty {
          color: #747878;
          font-size: 16px;
        }

        @media (min-width: 480px) {
          .arp-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 768px) {
          .arp-header-inner { padding: 10px 48px; }
          .arp-nav-desktop { display: flex; }
          .arp-menu-btn { display: none; }
          .arp-hero { padding: 96px 48px 64px; }
          .arp-portfolio { padding: 0 48px 96px; }
        }
        @media (min-width: 1100px) {
          .arp-header-inner { padding: 10px 64px; }
          .arp-hero { padding: 96px 64px 64px; }
          .arp-portfolio { padding: 0 64px 128px; }
          .arp-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <header className="arp-header">
        <div className="arp-header-inner">
          <img src={logoImage} alt="Snadai" className="arp-logo" />

          <nav className="arp-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="arp-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="arp-icons">
            <button
              type="button"
              className="arp-icon-btn"
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="arp-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="arp-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="arp-icon-btn arp-menu-btn"
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
          <nav className="arp-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="arp-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {artistInfo ? (
        <>
          <section className="arp-hero">
            <img src={artistInfo.avatar} alt={artistName} className="arp-avatar" />
            <h1 className="arp-name arp-serif">{artistName}</h1>
            <p className="arp-location">{artistInfo.location}</p>
            <p className="arp-bio arp-serif">{artistInfo.bio}</p>
          </section>

          <section className="arp-portfolio">
            <h2 className="arp-portfolio-heading arp-serif">Portfolio</h2>
            <div className="arp-grid">
              {portfolio.length === 0 && (
                <p className="arp-empty arp-serif">
                  No artworks from {artistName} yet.
                </p>
              )}
              {portfolio.map((art) => (
                <button
                  type="button"
                  key={art.id}
                  className="arp-card"
                  onClick={() => navigate(`/artwork/${art.id}`)}
                >
                  <div className="arp-card-image-wrap">
                    <button
                      type="button"
                      className="arp-favorite-btn"
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
                    <img
                      src={art.image}
                      alt={art.title}
                      className="arp-card-image"
                    />
                  </div>
                  <div className="arp-card-body">
                    <p className="arp-card-title arp-serif">{art.title}</p>
                    <p className="arp-card-medium arp-serif">
                      {art.medium}, {art.year}
                    </p>
                    <span className="arp-card-price arp-serif">
                      {art.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="arp-hero">
          <h1 className="arp-name arp-serif">Artist not found</h1>
          <p className="arp-bio arp-serif">
            We couldn't find an artist by that name.{" "}
            <Link to="/catalog">Back to the Catalog</Link>
          </p>
        </section>
      )}

      <Footer />
    </div>
  );
}
