import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Heart, Truck } from "lucide-react";

import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";
import { artworks } from "./ArtworkData";
import { useAuth } from "./useAuth";
import { useAuthGate } from "./useAuthGate";
import { supabase } from "./supabaseClient";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

const artworkById = new Map(artworks.map((artwork) => [artwork.id, artwork]));

const accountSettings = [
  { label: "Email notifications", defaultChecked: true },
  { label: "Marketing communications", defaultChecked: false },
  { label: "Two-factor authentication", defaultChecked: true },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { requestAuth } = useAuthGate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [fieldNotice, setFieldNotice] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

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
        setPurchases([]);
        setPurchasesLoading(false);
        return;
      }
      setPurchasesLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("id, items, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      setPurchases(
        (data || []).flatMap((order) =>
          (order.items || []).map((item, index) => {
            // Orders store only id/title/price/image, and that stored image
            // is a raw "/src/assets/..." path that only resolves in dev.
            // Joining the catalog by id gets the bundled image plus the
            // medium/artist/year this layout shows.
            const meta = artworkById.get(item.id);
            return {
              key: `${order.id}-${index}`,
              orderId: order.id,
              title: item.title,
              price: item.price,
              image: meta?.image || item.image,
              medium: meta?.medium || "",
              artist: meta?.artist || "",
              year: meta?.year || "",
            };
          })
        )
      );
      setPurchasesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const shippingAddress = user?.user_metadata?.shipping_address || "";

  const startEditEmail = () => {
    setEmailDraft(user?.email || "");
    setFieldError("");
    setFieldNotice("");
    setEditingField("email");
  };

  const startEditAddress = () => {
    setAddressDraft(shippingAddress);
    setFieldError("");
    setFieldNotice("");
    setEditingField("address");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setFieldError("");
  };

  const saveEmail = async () => {
    if (!emailDraft || emailDraft === user?.email) {
      setEditingField(null);
      return;
    }
    setSavingField(true);
    setFieldError("");
    const { error } = await supabase.auth.updateUser({ email: emailDraft });
    setSavingField(false);
    if (error) {
      setFieldError(error.message);
      return;
    }
    setFieldNotice("Check your inbox to confirm your new email address.");
    setEditingField(null);
  };

  const saveAddress = async () => {
    setSavingField(true);
    setFieldError("");
    const { error } = await supabase.auth.updateUser({
      data: { shipping_address: addressDraft },
    });
    setSavingField(false);
    if (error) {
      setFieldError(error.message);
      return;
    }
    setEditingField(null);
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "";
  const memberSince = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : "";

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

        /* Profile overview */
        .cp-overview {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 64px;
        }
        .cp-member-since {
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          margin: 0;
        }
        .cp-name {
          font-weight: 400;
          font-size: 48px;
          line-height: 1.1;
          color: #1a1c1c;
          margin: 0;
        }
        .cp-bio {
          font-size: 16px;
          line-height: 1.6;
          color: #444748;
          margin: 0;
          max-width: 512px;
        }

        /* Personal data + settings */
        .cp-details-grid {
          display: flex;
          flex-direction: column;
          gap: 48px;
          padding-top: 48px;
          border-top: 1px solid #c4c7c7;
          margin-bottom: 64px;
        }
        .cp-section-heading {
          font-size: 16px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #1a1c1c;
          margin: 0 0 24px 0;
          padding-bottom: 17px;
          border-bottom: 1px solid #c4c7c7;
        }
        .cp-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cp-field-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #444748;
        }
        .cp-field-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #000;
          padding-bottom: 9px;
        }
        .cp-field-value {
          font-size: 16px;
          color: #747878;
        }
        .cp-field-edit {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #1a1c1c;
          padding: 0;
          white-space: nowrap;
        }
        .cp-field-edit:disabled {
          color: #c4c7c7;
          cursor: default;
        }
        .cp-field-cancel {
          color: #747878;
        }
        .cp-field-input {
          flex: 1;
          min-width: 0;
          border: none;
          background: none;
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 16px;
          color: #1a1c1c;
          outline: none;
          padding: 0;
        }
        .cp-field-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }
        .cp-field-message {
          font-size: 13px;
          margin: 0;
        }
        .cp-field-message.error {
          color: #ba1a1a;
        }
        .cp-field-message.notice {
          color: #444748;
        }
        .cp-personal-fields {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .cp-settings-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .cp-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .cp-settings-label {
          font-size: 16px;
          color: #1a1c1c;
        }
        .cp-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #000;
          cursor: pointer;
        }
        .cp-logout {
          margin-top: 32px;
          border: 1px solid rgba(186,26,26,0.2);
          background: none;
          cursor: pointer;
          padding: 13px 25px;
          font-size: 16px;
          letter-spacing: 1.2px;
          color: #ba1a1a;
          width: fit-content;
        }

        /* Purchased artworks */
        .cp-purchases {
          border-top: 1px solid #c4c7c7;
          padding: 32px 0 0;
        }
        .cp-purchases-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .cp-purchases-title {
          font-weight: 400;
          font-size: 28px;
          color: #1a1c1c;
          margin: 0;
        }
        .cp-purchases-count {
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #747878;
          white-space: nowrap;
        }
        .cp-purchases-empty {
          font-size: 14px;
          color: #747878;
          margin: 16px 0 0;
        }
        .cp-purchases-list {
          display: flex;
          flex-direction: column;
        }
        .cp-purchase {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          border-top: 1px solid #e3e5e5;
          padding: 24px 0;
        }
        .cp-purchase-image-wrap {
          width: 92px;
          height: 120px;
          flex-shrink: 0;
          background: #eee;
          overflow: hidden;
        }
        .cp-purchase-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .cp-purchase-info {
          flex: 1;
          min-width: 0;
        }
        .cp-purchase-medium {
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #747878;
          margin: 0 0 6px 0;
        }
        .cp-purchase-item-title {
          font-weight: 400;
          font-size: 22px;
          color: #1a1c1c;
          margin: 0 0 6px 0;
        }
        .cp-purchase-byline {
          font-size: 13px;
          color: #444748;
          margin: 0;
        }
        .cp-purchase-shipped {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          align-self: center;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .cp-header-inner { padding: 10px 48px; }
          .cp-nav-desktop { display: flex; }
          .cp-menu-btn { display: none; }
          .cp-main { padding: 64px 48px 128px; }
          .cp-name { font-size: 64px; }
          .cp-details-grid { flex-direction: row; }
          .cp-details-grid > div { flex: 1 1 0; min-width: 0; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .cp-header-inner { padding: 10px 64px; }
          .cp-main { padding: 64px 64px 128px; }
          .cp-name { font-size: 72px; }
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
            <button
              type="button"
              className="cp-icon-btn"
              aria-label="Favorites"
              onClick={() => navigate("/collector-profile")}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="cp-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
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
        {/* Profile overview */}
        <section className="cp-overview">
          <p className="cp-member-since cp-serif">
            {memberSince ? `Member since ${memberSince}` : ""}
          </p>
          <h1 className="cp-name cp-serif">{displayName}</h1>
          <p className="cp-bio cp-serif">
            Private Collector specializing in post-war minimalist sculpture
            and monochromatic contemporary photography. Curator of the
            "Obsidian" private foundation.
          </p>
        </section>

        {/* Personal data + Account settings */}
        <section className="cp-details-grid">
          <div>
            <h2 className="cp-section-heading cp-serif">Personal Data</h2>
            <div className="cp-personal-fields">
              <div className="cp-field">
                <label className="cp-field-label">Email Address</label>
                {editingField === "email" ? (
                  <div className="cp-field-row">
                    <input
                      type="email"
                      className="cp-field-input cp-serif"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      autoFocus
                    />
                    <div className="cp-field-actions">
                      <button
                        type="button"
                        className="cp-field-edit"
                        onClick={saveEmail}
                        disabled={savingField}
                      >
                        {savingField ? "SAVING..." : "SAVE"}
                      </button>
                      <button
                        type="button"
                        className="cp-field-edit cp-field-cancel"
                        onClick={cancelEdit}
                        disabled={savingField}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cp-field-row">
                    <span className="cp-field-value cp-serif">
                      {user?.email}
                    </span>
                    <button
                      type="button"
                      className="cp-field-edit"
                      onClick={startEditEmail}
                    >
                      EDIT
                    </button>
                  </div>
                )}
                {editingField === "email" && fieldError && (
                  <p className="cp-field-message error">{fieldError}</p>
                )}
                {editingField !== "email" && fieldNotice && (
                  <p className="cp-field-message notice">{fieldNotice}</p>
                )}
              </div>
              <div className="cp-field">
                <label className="cp-field-label">Shipping Residence</label>
                {editingField === "address" ? (
                  <div className="cp-field-row">
                    <input
                      type="text"
                      className="cp-field-input cp-serif"
                      placeholder="Street, City, Country"
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      autoFocus
                    />
                    <div className="cp-field-actions">
                      <button
                        type="button"
                        className="cp-field-edit"
                        onClick={saveAddress}
                        disabled={savingField}
                      >
                        {savingField ? "SAVING..." : "SAVE"}
                      </button>
                      <button
                        type="button"
                        className="cp-field-edit cp-field-cancel"
                        onClick={cancelEdit}
                        disabled={savingField}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cp-field-row">
                    <span className="cp-field-value cp-serif">
                      {shippingAddress || "No shipping address on file yet."}
                    </span>
                    <button
                      type="button"
                      className="cp-field-edit"
                      onClick={startEditAddress}
                    >
                      {shippingAddress ? "EDIT" : "ADD"}
                    </button>
                  </div>
                )}
                {editingField === "address" && fieldError && (
                  <p className="cp-field-message error">{fieldError}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="cp-section-heading cp-serif">Account Settings</h2>
            <div className="cp-settings-list">
              {accountSettings.map((setting) => (
                <label className="cp-settings-row" key={setting.label}>
                  <span className="cp-settings-label cp-serif">
                    {setting.label}
                  </span>
                  <input
                    type="checkbox"
                    className="cp-checkbox"
                    defaultChecked={setting.defaultChecked}
                  />
                </label>
              ))}
            </div>
            <button type="button" className="cp-logout cp-serif" onClick={handleLogout}>
              Logout Session
            </button>
          </div>
        </section>

        {/* Purchased artworks, with the two steps of the order shown as
            complete. */}
        <section className="cp-purchases">
          <div className="cp-purchases-header">
            <h2 className="cp-purchases-title cp-serif">Acquisition History</h2>
            {!purchasesLoading && purchases.length > 0 && (
              <span className="cp-purchases-count">
                {purchases.length} TOTAL {purchases.length === 1 ? "WORK" : "WORKS"}
              </span>
            )}
          </div>

          {purchasesLoading ? (
            <p className="cp-purchases-empty cp-serif">Loading your artworks...</p>
          ) : purchases.length === 0 ? (
            <p className="cp-purchases-empty cp-serif">
              No artworks yet. Pieces you purchase will appear here.
            </p>
          ) : (
            <div className="cp-purchases-list">
              {purchases.map((item) => (
                <div className="cp-purchase" key={item.key}>
                  <div className="cp-purchase-image-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="cp-purchase-image"
                    />
                  </div>

                  <div className="cp-purchase-info">
                    {item.medium && (
                      <p className="cp-purchase-medium">{item.medium}</p>
                    )}
                    <h3 className="cp-purchase-item-title cp-serif">
                      {item.title}
                    </h3>
                    <p className="cp-purchase-byline">
                      {[item.artist, item.year].filter(Boolean).join(", ")}
                      {item.price ? ` · ${item.price}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="cp-purchase-shipped"
                    title="Track delivery"
                    aria-label="Track delivery"
                    onClick={() => navigate(`/orders/${item.orderId}`)}
                  >
                    <Truck size={20} strokeWidth={1.75} />
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