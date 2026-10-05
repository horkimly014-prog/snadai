import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Heart, MapPin, Mail, Phone } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";

import logoImage from "./assets/image/Logo.png";
import missionImage from "./assets/image/03.jpg";
import storyImage from "./assets/image/28.JPG";
import founderImage from "./assets/image/168.png";
import Footer from "./Footer";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

export default function About() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ab-page">
      <style>{`
        .ab-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .ab-page * {
          box-sizing: border-box;
        }
        .ab-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .ab-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .ab-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .ab-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .ab-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .ab-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .ab-nav-link.active {
          color: #000;
          border-bottom: 1px solid #ac834b;
          padding-bottom: 5px;
        }
        .ab-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ab-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .ab-menu-btn {
          display: flex;
        }
        .ab-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Brand mark hero */
        .ab-brand-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px 24px;
        }
        .ab-brand-logo {
          width: 240px;
          max-width: 70vw;
          height: auto;
          object-fit: contain;
        }

        /* Mission statement */
        .ab-mission {
          background: #f9f9f9;
          padding: 64px 24px;
        }
        .ab-mission-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .ab-section-label {
          font-weight: 400;
          font-size: 32px;
          line-height: 40px;
          color: #000;
          margin: 0 0 24px 0;
        }
        .ab-rule {
          background: #000;
          height: 1px;
          width: 48px;
          border: none;
          margin: 0;
        }
        .ab-lead {
          font-size: 18px;
          line-height: 29.25px;
          color: #1a1c1c;
          margin: 0 0 32px 0;
        }
        .ab-body {
          font-size: 16px;
          line-height: 26px;
          color: #444748;
          margin: 0;
        }

        /* Our Mission (image + text) */
        .ab-split {
          border-top: 1px solid #c4c7c7;
          padding: 64px 24px;
        }
        .ab-split-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center;
        }
        .ab-split-image-wrap {
          border: 1px solid #c4c7c7;
          padding: 8px;
          background: #fff;
        }
        .ab-split-image {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          display: block;
        }
        .ab-split-heading {
          font-weight: 700;
          font-size: 32px;
          line-height: 1.2;
          color: #000;
          margin: 0 0 24px 0;
        }
        .ab-split-body {
          font-size: 16px;
          line-height: 26px;
          color: #1a1c1c;
          margin: 0 0 24px 0;
        }
        .ab-split-body.muted {
          color: #444748;
          margin-bottom: 0;
        }

        /* Our Story */
        .ab-story-image {
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          display: block;
        }

        /* Meet the Founder */
        .ab-founder-photo-wrap {
          border: 1px solid #c4c7c7;
          padding: 8px;
          background: #fff;
        }
        .ab-founder-photo {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          display: block;
          background: #eae4d9;
        }
        .ab-founder-photo-placeholder {
          width: 100%;
          aspect-ratio: 4 / 5;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eae4d9;
          color: #444748;
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .ab-founder-name {
          font-weight: 700;
          font-size: 24px;
          color: #000;
          margin: 0 0 4px 0;
        }
        .ab-founder-title {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #ac834b;
          margin: 0 0 24px 0;
        }

        /* Contact CTA */
        .ab-cta-wrap {
          display: flex;
          justify-content: center;
          padding: 0 24px 48px;
        }
        .ab-cta {
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 20px 32px;
          font-family: 'Times New Roman', Georgia, serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        /* Where to find us */
        .ab-find {
          padding: 0 24px 96px;
        }
        .ab-find-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        .ab-map-wrap {
          border: 1px solid #000;
          border-radius: 5px;
          overflow: hidden;
        }
        .ab-map-image {
          width: 100%;
          aspect-ratio: 1 / 1;
          display: block;
          border: none;
        }
        .ab-find-heading {
          font-size: 28px;
          color: #000;
          margin: 0 0 32px 0;
        }
        .ab-find-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .ab-find-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          color: #000;
        }
        .ab-find-text {
          font-size: 18px;
          color: #000;
          margin: 0;
          line-height: 1.4;
        }
        .ab-find-link {
          color: #000;
          text-decoration: underline;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .ab-header-inner { padding: 10px 48px; }
          .ab-nav-desktop { display: flex; }
          .ab-menu-btn { display: none; }
          .ab-brand-hero { padding: 64px 48px 32px; }
          .ab-brand-logo { width: 320px; }
          .ab-mission { padding: 96px 48px; }
          .ab-mission-inner { grid-template-columns: 4fr 8fr; gap: 48px; }
          .ab-split { padding: 96px 48px; }
          .ab-split-inner { grid-template-columns: 1fr 1fr; gap: 64px; }
          .ab-split-heading { font-size: 40px; }
          .ab-find { padding: 0 48px 128px; }
          .ab-find-inner { grid-template-columns: 1fr 1fr; gap: 64px; }
          .ab-find-heading { font-size: 30px; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .ab-header-inner { padding: 10px 64px; }
          .ab-brand-logo { width: 400px; }
          .ab-mission { padding: 128px 64px; }
          .ab-split { padding: 128px 64px; }
          .ab-split-heading { font-size: 48px; line-height: 56px; }
          .ab-find { padding: 0 64px 128px; }
        }
      `}</style>

      {/* Header */}
      <header className="ab-header">
        <div className="ab-header-inner">
          <img src={logoImage} alt="Snadai" className="ab-logo" />

          <nav className="ab-nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`ab-nav-link ${
                  link.label === "About&Contact" ? "active" : ""
                }`}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="ab-icons">
            <button
              type="button"
              className="ab-icon-btn"
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="ab-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ab-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ab-icon-btn ab-menu-btn"
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
          <nav className="ab-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`ab-nav-link ${
                  link.label === "About&Contact" ? "active" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Brand mark */}
      <section className="ab-brand-hero">
        <img src={logoImage} alt="Snadai" className="ab-brand-logo" />
      </section>

      {/* Mission statement */}
      <section className="ab-mission">
        <div className="ab-mission-inner">
          <div>
            <h1 className="ab-section-label ab-serif">About Us</h1>
            <hr className="ab-rule" />
          </div>
          <div>
            <p className="ab-lead ab-serif">
              Snadai is a home for contemporary Cambodian art. We built it so
              collectors can discover real work from real artists, all in one
              place.
            </p>
            <p className="ab-body ab-serif">
              Every artwork on Snadai is organised in one catalogue, with
              clear prices, artist details and a live auction, instead of
              being scattered across social media pages and private messages.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="ab-split">
        <div className="ab-split-inner">
          <div className="ab-split-image-wrap">
            <img src={missionImage} alt="" className="ab-split-image" />
          </div>
          <div>
            <h2 className="ab-split-heading ab-serif">OUR MISSION</h2>
            <p className="ab-split-body ab-serif">
              Snadai exists to make it easier for collectors, in Cambodia and
              beyond, to find and support contemporary Cambodian art. Artists
              submit their work for review, and once approved, it goes into a
              catalogue anyone can browse, save and buy from.
            </p>
            <p className="ab-split-body muted ab-serif">
              We also run a live auction so collectors can bid on featured
              pieces in real time, with every bid checked and recorded
              securely.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="ab-split" style={{ borderTop: "none" }}>
        <div className="ab-split-inner">
          <div>
            <h2 className="ab-split-heading ab-serif">OUR STORY</h2>
            <p className="ab-split-body ab-serif">
              Snadai started from a simple problem: Cambodian artists often
              struggle to reach buyers, and buyers often struggle to find
              trustworthy places to discover and purchase Cambodian art.
            </p>
            <p className="ab-split-body muted ab-serif">
              We built Snadai to close that gap — a straightforward platform
              where artists can submit their work and collectors can browse,
              bid and buy with confidence.
            </p>
            <hr className="ab-rule" style={{ marginTop: "32px", width: "40px" }} />
          </div>
          <div>
            <img src={storyImage} alt="" className="ab-story-image" />
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="ab-split" style={{ borderTop: "none" }}>
        <div className="ab-split-inner">
          <div className="ab-founder-photo-wrap">
            <img src={founderImage} alt="Hor Kimly" className="ab-founder-photo" />
          </div>
          <div>
            <h2 className="ab-split-heading ab-serif">FOUNDER</h2>
            <p className="ab-founder-name ab-serif">Hor Kimly</p>
            <p className="ab-founder-title">Founder, Snadai</p>
            <p className="ab-split-body muted ab-serif">
              Snadai was founded to give Cambodian artists one trusted place to
              reach collectors, and to give collectors a clear, honest way to
              discover and support contemporary Cambodian art.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <div className="ab-cta-wrap">
        <Link to="/contact" style={{ textDecoration: "none" }}>
          <button type="button" className="ab-cta">
            Contact us
          </button>
        </Link>
      </div>

      {/* Where to find us */}
      <section className="ab-find">
        <div className="ab-find-inner">
          <div className="ab-map-wrap">
            <iframe
              title="Our location"
              className="ab-map-image"
              src="https://www.google.com/maps?q=79+Kampuchea+Krom+Blvd,+Phnom+Penh,+Cambodia&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div>
            <h2 className="ab-find-heading ab-serif">Where to find us?</h2>

            <div className="ab-find-row">
              <MapPin className="ab-find-icon" strokeWidth={1.5} />
              <p className="ab-find-text ab-serif">
                79 Kampuchea Krom Blvd (128), Phnom Penh 12251
              </p>
            </div>

            <div className="ab-find-row">
              <Mail className="ab-find-icon" strokeWidth={1.5} />
              <p className="ab-find-text ab-serif">
                <a href="mailto:snadai@gmail.com" className="ab-find-link">
                  snadai@gmail.com
                </a>
              </p>
            </div>

            <div className="ab-find-row">
              <Phone className="ab-find-icon" strokeWidth={1.5} />
              <p className="ab-find-text ab-serif">+855 68784704</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}