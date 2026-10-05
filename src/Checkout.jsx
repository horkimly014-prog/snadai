import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";

import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";
import { artworks } from "./ArtworkData";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];


const sampleCartItems = [
  { id: 1, title: "Composition In Grey", price: "$18,400", image: artworks[5]?.image },
  { id: 2, title: "Ethereal Form", price: "$14,200", image: artworks[1]?.image },
  { id: 3, title: "Structured Silence", price: "$12,850", image: artworks[3]?.image },
];

const SHIPPING_COST = 1250;

function parsePrice(price) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const requireAuth = useRequireAuth();
  const cartItems = location.state?.cartItems || sampleCartItems;
  const [menuOpen, setMenuOpen] = useState(false);
  const [whiteGlove, setWhiteGlove] = useState(false);
  const [fullName, setFullName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parsePrice(item.price),
    0
  );
  const grandTotal = subtotal + SHIPPING_COST;

  const formatCurrency = (n) => `$${n.toLocaleString()}`;

  const handleCheckout = (e) => {
    e.preventDefault();
    requireAuth(() => {
      navigate("/payment", {
        state: {
          fullName,
          shippingAddress,
          city,
          country,
          whiteGlove,
          cartItems,
          subtotal,
          shippingCost: SHIPPING_COST,
          grandTotal,
        },
      });
    });
  };

  return (
    <div className="ck-page">
      <style>{`
        .ck-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .ck-page * {
          box-sizing: border-box;
        }
        .ck-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .ck-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .ck-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .ck-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .ck-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .ck-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .ck-nav-link.active {
          color: #000;
          border-bottom: 1px solid #ac834b;
          padding-bottom: 5px;
        }
        .ck-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ck-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .ck-menu-btn {
          display: flex;
        }
        .ck-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .ck-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 24px 96px;
        }
        .ck-heading-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 48px;
        }
        .ck-title {
          font-weight: 400;
          font-size: 40px;
          color: #1a1c1c;
          margin: 0;
        }
        .ck-eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #747878;
          margin: 0;
        }

        .ck-grid {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        /* Shipping form */
        .ck-form-heading {
          font-weight: 400;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0 0 32px 0;
        }
        .ck-field-row {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 24px;
        }
        .ck-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ck-field-label {
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #000;
        }
        .ck-input {
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
        .ck-two-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .ck-whiteglove {
          background: #f4f3f3;
          border: 1px solid #c4c7c7;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .ck-whiteglove-checkbox {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #000;
          cursor: pointer;
          flex-shrink: 0;
        }
        .ck-whiteglove-text {
          font-size: 16px;
          line-height: 1.5;
          color: #444748;
        }
        .ck-whiteglove-text strong {
          color: #1a1c1c;
        }

        /* Order summary */
        .ck-summary {
          background: #f9f9f9;
          border: 1px solid #c4c7c7;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .ck-summary-heading {
          font-weight: 400;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0;
        }
        .ck-item-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ck-item {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .ck-item-image-wrap {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
          overflow: hidden;
          background: #eee;
          border: 1px solid #c4c7c7;
        }
        .ck-item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(0.3);
        }
        .ck-item-title {
          flex: 1;
          font-size: 16px;
          color: #000;
        }
        .ck-item-price {
          font-size: 16px;
          color: #000;
        }
        .ck-summary-divider {
          border-top: 1px solid #c4c7c7;
          padding-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ck-summary-row {
          display: flex;
          justify-content: space-between;
        }
        .ck-summary-label {
          font-size: 16px;
          color: #444748;
        }
        .ck-summary-value {
          font-size: 16px;
          color: #000;
        }
        .ck-grand-total-row {
          border-top: 1px solid #000;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .ck-grand-total-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #000;
        }
        .ck-grand-total-value {
          font-family: 'Bodoni Moda', 'Times New Roman', serif;
          font-size: 32px;
          color: #000;
        }
        .ck-checkout-btn {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 20px 0;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 1.2px;
          margin-top: 32px;
        }
        .ck-checkout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .ck-header-inner { padding: 10px 48px; }
          .ck-nav-desktop { display: flex; }
          .ck-menu-btn { display: none; }
          .ck-main { padding: 64px 48px 128px; }
          .ck-grid { flex-direction: row; align-items: flex-start; gap: 64px; }
          .ck-grid > .ck-form-col { flex: 1 1 55%; min-width: 0; }
          .ck-grid > .ck-summary-col { flex: 1 1 40%; min-width: 320px; }
          .ck-two-col { grid-template-columns: 1fr 1fr; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .ck-header-inner { padding: 10px 64px; }
          .ck-main { padding: 64px 64px 128px; }
          .ck-title { font-size: 48px; }
        }
      `}</style>

      {/* Header */}
      <header className="ck-header">
        <div className="ck-header-inner">
          <img src={logoImage} alt="Snadai" className="ck-logo" />

          <nav className="ck-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="ck-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="ck-icons">
            <button type="button" className="ck-icon-btn" aria-label="Search">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ck-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ck-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="ck-icon-btn ck-menu-btn"
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
          <nav className="ck-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="ck-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="ck-main">
        <div className="ck-heading-block">
          <h1 className="ck-title ck-serif">Acquisition</h1>
          <p className="ck-eyebrow">ORDER REVIEW &amp; PAYMENT</p>
        </div>

        <form className="ck-grid" onSubmit={handleCheckout}>
          {/* Shipping form */}
          <div className="ck-form-col">
            <h2 className="ck-form-heading ck-serif">Shipping &amp; Delivery</h2>

            <div className="ck-field-row">
              <div className="ck-field">
                <label className="ck-field-label ck-serif" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="ck-input"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="ck-field">
                <label
                  className="ck-field-label ck-serif"
                  htmlFor="shippingAddress"
                >
                  Shipping Address
                </label>
                <input
                  id="shippingAddress"
                  type="text"
                  className="ck-input"
                  placeholder="Street address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
              </div>

              <div className="ck-two-col">
                <div className="ck-field">
                  <label className="ck-field-label ck-serif" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    className="ck-input"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="ck-field">
                  <label className="ck-field-label ck-serif" htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    className="ck-input"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <label className="ck-whiteglove">
              <input
                type="checkbox"
                className="ck-whiteglove-checkbox"
                checked={whiteGlove}
                onChange={(e) => setWhiteGlove(e.target.checked)}
              />
              <span className="ck-whiteglove-text ck-serif">
                <strong>White Glove Installation.</strong> Professional
                handling and curated placement in your space.
              </span>
            </label>
          </div>

          {/* Order summary */}
          <div className="ck-summary-col">
            <div className="ck-summary">
              <h2 className="ck-summary-heading ck-serif">Summary</h2>

              <div className="ck-item-list">
                {cartItems.map((item) => (
                  <div className="ck-item" key={item.id}>
                    <div className="ck-item-image-wrap">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="ck-item-image"
                      />
                    </div>
                    <span className="ck-item-title ck-serif">
                      {item.title}
                    </span>
                    <span className="ck-item-price">{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="ck-summary-divider">
                <div className="ck-summary-row">
                  <span className="ck-summary-label">Subtotal</span>
                  <span className="ck-summary-value">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="ck-summary-row">
                  <span className="ck-summary-label">
                    Shipping &amp; White Glove
                  </span>
                  <span className="ck-summary-value">
                    {formatCurrency(SHIPPING_COST)}
                  </span>
                </div>

                <div className="ck-grand-total-row">
                  <span className="ck-grand-total-label">GRAND TOTAL</span>
                  <span className="ck-grand-total-value ck-serif">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <button type="submit" className="ck-checkout-btn">
              Go to Checkout
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}