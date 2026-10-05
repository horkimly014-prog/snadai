import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ShoppingBag, User } from "lucide-react";
import { artworks, artists } from "./ArtworkData";
import { useRequireAuth } from "./useRequireAuth";
import { getCartItems, addToCart } from "./cartStorage";

import logoImage from "./assets/image/Logo.png";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

export default function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const artwork = artworks.find((a) => a.id === Number(id));
  const artistInfo = artwork ? artists[artwork.artist] : undefined;
  const [cartItems, setCartItems] = useState(() => getCartItems());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const inCart = artwork
    ? cartItems.some((item) => item.id === artwork.id)
    : false;

  const handleAddToCart = () => {
    requireAuth(() => {
      setCartItems(
        addToCart({
          id: artwork.id,
          title: artwork.title,
          price: artwork.price,
          image: artwork.image,
        })
      );
      navigate("/cart");
    });
  };

  const relatedWorks = artwork
    ? artworks.filter((a) => a.id !== artwork.id).slice(0, 4)
    : [];

  return (
    <div className="ad-page">
      <style>{`
        .ad-page {
          background: #f9f9f9;
          color: #121212;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .ad-page * {
          box-sizing: border-box;
        }
        .ad-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .ad-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .ad-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .ad-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .ad-nav {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .ad-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .ad-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ad-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #121212;
          display: flex;
          align-items: center;
        }

        /* Main */
        .ad-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .ad-not-found {
          padding: 96px 24px;
          text-align: center;
          font-size: 24px;
          color: #444748;
        }

        .ad-detail-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .ad-image-col {
          width: 100%;
        }
        .ad-image-wrap {
          background: #f4f3f3;
          border: 1px solid #e5e5e5;
          aspect-ratio: 1 / 1;
          overflow: hidden;
        }
        .ad-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ad-info-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ad-title {
          font-weight: 400;
          font-size: 36px;
          line-height: 1.15;
          color: #121212;
          margin: 0;
        }
        .ad-byline {
          font-size: 16px;
          line-height: 24px;
          color: #121212;
          margin: 0;
        }
        .ad-price {
          font-size: 28px;
          color: #ac834b;
          margin: 8px 0 0;
        }
        .ad-specs-row {
          display: flex;
          gap: 16px;
          border-top: 1px solid #c4c7c7;
          padding-top: 24px;
          margin-top: 8px;
        }
        .ad-spec-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ad-spec-label {
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #747878;
          margin: 0;
        }
        .ad-spec-value {
          font-size: 16px;
          color: #121212;
          margin: 0;
        }
        .ad-dimensions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ad-note-block {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 8px;
        }
        .ad-note-text {
          font-size: 16px;
          line-height: 26px;
          color: #444748;
          margin: 0;
        }
        .ad-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        .ad-purchase {
          background: #000;
          color: #fff;
          border: 1px solid #000;
          cursor: pointer;
          padding: 18px 32px;
          font-size: 18px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          flex: 1;
        }
        .ad-add-to-cart {
          background: #fff;
          color: #000;
          border: 1px solid #000;
          cursor: pointer;
          padding: 18px 32px;
          font-size: 18px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          flex: 1;
        }
        .ad-add-to-cart.in-cart {
          background: #ac834b;
          border-color: #ac834b;
          color: #fff;
        }

        /* About artist */
        .ad-section-divider {
          border-top: 1px solid #c4c7c7;
          margin-top: 56px;
          padding-top: 40px;
        }
        .ad-section-heading {
          font-size: 26px;
          color: #121212;
          margin: 0 0 24px 0;
        }
        .ad-artist-card {
          border: 1px solid #e5e5e5;
          background: #fff;
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
          width: 100%;
          cursor: pointer;
          transition: box-shadow 0.25s ease;
        }
        .ad-artist-card:hover {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }
        .ad-artist-avatar {
          width: 96px;
          height: 96px;
          border-radius: 9999px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .ad-artist-name {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #000;
          margin: 0;
        }
        .ad-artist-location {
          font-size: 14px;
          color: #747878;
          margin: 4px 0 0 0;
        }
        .ad-artist-bio {
          font-size: 15px;
          line-height: 1.6;
          color: #444748;
          margin: 8px 0 0 0;
          max-width: 640px;
        }

        /* Related */
        .ad-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .ad-related-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
          font: inherit;
          color: inherit;
          text-decoration: none;
        }
        .ad-related-image-wrap {
          background: #eee;
          border: 1px solid #e5e5e5;
          aspect-ratio: 1 / 1;
          overflow: hidden;
        }
        .ad-related-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ad-related-title {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #000;
          margin: 0;
        }
        .ad-related-medium {
          font-size: 14px;
          color: #747878;
          margin: 0;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .ad-header-inner { padding: 10px 48px; }
          .ad-nav { display: flex; }
          .ad-main { padding: 48px 48px 96px; }
          .ad-detail-grid { flex-direction: row; align-items: flex-start; gap: 48px; }
          .ad-image-col { flex: 1 1 55%; min-width: 0; }
          .ad-info-col { flex: 1 1 40%; min-width: 280px; }
          .ad-title { font-size: 44px; }
          .ad-price { font-size: 32px; }
          .ad-artist-card { flex-direction: row; text-align: left; align-items: flex-start; }
          .ad-related-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .ad-header-inner { padding: 10px 64px; }
          .ad-main { padding: 64px 64px 128px; }
          .ad-title { font-size: 48px; }
        }
      `}</style>

      {/* Header */}
      <header className="ad-header">
        <div className="ad-header-inner">
          <img src={logoImage} alt="Snadai" className="ad-logo" />
          <nav className="ad-nav">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="ad-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
          <div className="ad-icons">
            <button
              type="button"
              className="ad-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ad-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {!artwork ? (
        <p className="ad-not-found ad-serif">
          We couldn't find that artwork.{" "}
          <Link to="/catalog" style={{ color: "#000" }}>
            Back to the catalog
          </Link>
        </p>
      ) : (
        <main className="ad-main">
          <div className="ad-detail-grid">
            <div className="ad-image-col">
              <div className="ad-image-wrap">
                <img src={artwork.image} alt={artwork.title} className="ad-image" />
              </div>
            </div>

            <div className="ad-info-col">
              <h1 className="ad-title ad-serif">{artwork.title}</h1>
              <p className="ad-byline ad-serif">
                By <strong>{artwork.artist}</strong>
                <br />
                From <strong>{artwork.artistLocation}</strong>
              </p>
              <p className="ad-price ad-serif">{artwork.price}</p>

              <div className="ad-specs-row">
                <div className="ad-spec-col">
                  <p className="ad-spec-label ad-serif">Medium</p>
                  <p className="ad-spec-value ad-serif">{artwork.medium}</p>
                </div>
                <div className="ad-spec-col">
                  <p className="ad-spec-label ad-serif">Year</p>
                  <p className="ad-spec-value ad-serif">{artwork.year}</p>
                </div>
              </div>

              <div className="ad-dimensions">
                <p className="ad-spec-label ad-serif">Dimensions</p>
                <p className="ad-spec-value ad-serif">{artwork.dimensions}</p>
              </div>

              <div className="ad-note-block">
                <p className="ad-spec-label ad-serif">Curatorial Note</p>
                <p className="ad-note-text ad-serif">{artwork.note}</p>
              </div>

              <div className="ad-actions">
                <button
                  type="button"
                  className="ad-purchase ad-serif"
                  onClick={() =>
                    requireAuth(() =>
                      navigate("/checkout", {
                        state: {
                          cartItems: [
                            {
                              id: artwork.id,
                              title: artwork.title,
                              price: artwork.price,
                              image: artwork.image,
                            },
                          ],
                        },
                      })
                    )
                  }
                >
                  Purchase
                </button>
                <button
                  type="button"
                  className={`ad-add-to-cart ad-serif ${inCart ? "in-cart" : ""}`}
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* About Artist */}
          <div className="ad-section-divider">
            <h2 className="ad-section-heading ad-serif">
              About Artist: {artwork.artist}
            </h2>

            <button
              type="button"
              className="ad-artist-card"
              onClick={() =>
                navigate(`/artist/${encodeURIComponent(artwork.artist)}`)
              }
            >
              <img
                src={artistInfo?.avatar}
                alt={artwork.artist}
                className="ad-artist-avatar"
              />
              <div>
                <p className="ad-artist-name ad-serif">{artwork.artist}</p>
                <p className="ad-artist-location ad-serif">
                  {artwork.artistLocation}
                </p>
                <p className="ad-artist-bio ad-serif">{artistInfo?.bio}</p>
              </div>
            </button>
          </div>

          {/* More by */}
          {relatedWorks.length > 0 && (
            <div className="ad-section-divider">
              <h2 className="ad-section-heading ad-serif">
                More by: <strong>{artwork.artist}</strong>
              </h2>

              <div className="ad-related-grid">
                {relatedWorks.map((work) => (
                  <button
                    type="button"
                    className="ad-related-card"
                    key={work.id}
                    onClick={() => navigate(`/artwork/${work.id}`)}
                  >
                    <div className="ad-related-image-wrap">
                      <img
                        src={work.image}
                        alt={work.title}
                        className="ad-related-image"
                      />
                    </div>
                    <div>
                      <p className="ad-related-title ad-serif">{work.title}</p>
                      <p className="ad-related-medium ad-serif">
                        {work.medium}, {work.year}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}