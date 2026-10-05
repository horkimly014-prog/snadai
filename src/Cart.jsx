import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";
import { getCartItems, removeFromCart } from "./cartStorage";

import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

const SHIPPING_COST = 1250;

function parsePrice(price) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

export default function Cart() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => getCartItems());

  const removeItem = (id) => {
    setCartItems(removeFromCart(id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parsePrice(item.price),
    0
  );
  const grandTotal = subtotal + SHIPPING_COST;

  const formatCurrency = (n) => `$${n.toLocaleString()}`;

  const handleCheckout = () => {
    requireAuth(() => {
      navigate("/checkout", { state: { cartItems } });
    });
  };

  return (
    <div className="cart-page">
      <style>{`
        .cart-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .cart-page * {
          box-sizing: border-box;
        }
        .cart-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .cart-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .cart-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .cart-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .cart-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .cart-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .cart-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cart-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .cart-menu-btn {
          display: flex;
        }
        .cart-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Main */
        .cart-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 48px 24px 96px;
        }
        .cart-title {
          font-weight: 400;
          font-size: 40px;
          color: #1a1c1c;
          margin: 0 0 32px 0;
        }

        /* Summary */
        .cart-summary {
          background: #f9f9f9;
          border: 1px solid #c4c7c7;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .cart-summary-heading {
          font-weight: 400;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0;
        }
        .cart-item-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cart-item {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .cart-item-image-wrap {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
          overflow: hidden;
          background: #eee;
          border: 1px solid #c4c7c7;
        }
        .cart-item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .cart-item-title {
          flex: 1;
          font-size: 16px;
          color: #000;
        }
        .cart-item-price {
          font-size: 16px;
          color: #000;
        }
        .cart-item-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #747878;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .cart-summary-divider {
          border-top: 1px solid #c4c7c7;
          padding-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
        }
        .cart-summary-label {
          font-size: 16px;
          color: #444748;
        }
        .cart-summary-value {
          font-size: 16px;
          color: #000;
        }
        .cart-grand-total-row {
          border-top: 1px solid #000;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .cart-grand-total-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #000;
        }
        .cart-grand-total-value {
          font-family: 'Bodoni Moda', 'Times New Roman', serif;
          font-size: 32px;
          color: #000;
        }
        .cart-checkout-btn {
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
        .cart-empty {
          font-size: 16px;
          color: #747878;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .cart-header-inner { padding: 10px 48px; }
          .cart-nav-desktop { display: flex; }
          .cart-menu-btn { display: none; }
          .cart-main { padding: 64px 48px 128px; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .cart-header-inner { padding: 10px 64px; }
          .cart-main { padding: 64px 64px 128px; }
          .cart-title { font-size: 48px; }
        }
      `}</style>

      {/* Header */}
      <header className="cart-header">
        <div className="cart-header-inner">
          <img src={logoImage} alt="Snadai" className="cart-logo" />

          <nav className="cart-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="cart-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="cart-icons">
            <button type="button" className="cart-icon-btn" aria-label="Search">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <Link to="/cart" className="cart-icon-btn" aria-label="Cart">
              <ShoppingBag size={18} strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              className="cart-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="cart-icon-btn cart-menu-btn"
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
          <nav className="cart-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="cart-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="cart-main">
        <h1 className="cart-title cart-serif">Cart</h1>

        <div className="cart-summary">
          <h2 className="cart-summary-heading cart-serif">Summary</h2>

          {cartItems.length === 0 ? (
            <p className="cart-empty cart-serif">
              Your cart is empty. Add a piece from its detail page to see it
              here.
            </p>
          ) : (
            <>
              <div className="cart-item-list">
                {cartItems.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-image-wrap">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="cart-item-image"
                      />
                    </div>
                    <span className="cart-item-title cart-serif">
                      {item.title}
                    </span>
                    <span className="cart-item-price">{item.price}</span>
                    <button
                      type="button"
                      className="cart-item-remove"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeItem(item.id)}
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary-divider">
                <div className="cart-summary-row">
                  <span className="cart-summary-label">Subtotal</span>
                  <span className="cart-summary-value">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="cart-summary-row">
                  <span className="cart-summary-label">
                    Shipping &amp; White Glove
                  </span>
                  <span className="cart-summary-value">
                    {formatCurrency(SHIPPING_COST)}
                  </span>
                </div>

                <div className="cart-grand-total-row">
                  <span className="cart-grand-total-label">GRAND TOTAL</span>
                  <span className="cart-grand-total-value cart-serif">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            className="cart-checkout-btn"
            onClick={handleCheckout}
          >
            Go to Checkout
          </button>
        )}
      </main>

      <Footer />
    </div>
  );
}
