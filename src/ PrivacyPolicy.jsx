import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";
import { useRequireAuth } from "./useRequireAuth";

const serif = "'Times New Roman', Georgia, serif";
const sans = "'Helvetica Neue', Arial, sans-serif";

const styles = {
  page: {
    background: "transparent",
    color: "#1a1c1c",
    fontFamily: sans,
  },
  // Hero
  hero: {
    borderBottom: "1px solid #c4c7c7",
    padding: "96px 64px 64px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  heroTitle: {
    fontFamily: serif,
    fontWeight: 400,
    fontSize: "64px",
    lineHeight: "1.15",
    color: "#1a1c1c",
    margin: 0,
    letterSpacing: "-1px",
  },
  // Content
  main: {
    maxWidth: "1160px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "64px",
  },
  section: {
    display: "grid",
    gap: "16px",
  },
  sectionHeading: {
    fontFamily: serif,
    fontWeight: 700,
    fontSize: "32px",
    lineHeight: "1.25",
    color: "#1a1c1c",
    margin: 0,
  },
  blocks: {
    display: "flex",
    flexDirection: "column",
    gap: "48px",
  },
  block: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  blockTitle: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#000000",
    borderBottom: "1px solid #000000",
    paddingBottom: "5px",
    width: "fit-content",
  },
  blockText: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#444748",
    margin: 0,
  },
  // Data protection card
  cardWrap: {
    background: "#eeeeee",
    border: "1px solid #c4c7c7",
    padding: "33px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  cardText: {
    fontSize: "16px",
    lineHeight: "1.5",
    color: "#000000",
    margin: 0,
  },
  cardQuote: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#444748",
    fontStyle: "italic",
    margin: 0,
  },
  // Third-party sharing columns
  columnsRow: {
    display: "flex",
    gap: "32px",
    flexWrap: "wrap",
  },
  column: {
    flex: "1 1 280px",
    borderLeft: "1px solid #c4c7c7",
    paddingLeft: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  columnTitle: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#000000",
    margin: 0,
  },
  columnText: {
    fontSize: "13px",
    lineHeight: "1.4",
    color: "#444748",
    margin: 0,
  },
};

const infoCollectionBlocks = [
  {
    title: "Personal Data",
    text: "In our capacity as a bespoke intermediary, we collect identity data including full legal names, contact information, and physical addresses necessary for the curated acquisition of fine art. All data is handled with extreme discretion.",
  },
  {
    title: "Acquisition History",
    text: "Records of your previous inquiries, gallery visits, and successful acquisitions are maintained to personalize our advisory services. This data forms the basis of your private profile within the Curated Contemporary ecosystem.",
  },
  {
    title: "Device Data",
    text: "To ensure the integrity of our high-value digital platform, we collect technical data such as IP addresses and browsing behaviors. This helps us optimize our interface for your specific hardware and prevents unauthorized access to private catalogs.",
  },
];

const useOfInfoBlocks = [
  {
    title: "Processing Acquisitions",
    text: "Your data is utilized to facilitate the legal transfer of ownership, artist royalties, and financial clearing. We ensure that every transaction complies with international AML and KYC regulations while maintaining collector anonymity where requested.",
  },
  {
    title: "White Glove Services",
    text: "We use your location and contact details to coordinate specialized handling, climate-controlled transport, and professional installation services for your acquired pieces.",
  },
];

const thirdPartyColumns = [
  {
    title: "Logistics Partners",
    text: "Data shared exclusively for the physical delivery of artwork via specialist fine-art couriers.",
  },
  {
    title: "Insurance Providers",
    text: "Documentation provided to underwriters to ensure your collection is fully protected against transit and storage risks.",
  },
];

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={styles.page}>
      <style>{`
        .pp-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .pp-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .pp-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .pp-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .pp-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .pp-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pp-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .pp-menu-btn {
          display: flex;
        }
        .pp-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        .privacy-main {
          padding: 48px 24px;
        }
        .privacy-section {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .pp-header-inner { padding: 10px 48px; }
          .pp-nav-desktop { display: flex; }
          .pp-menu-btn { display: none; }
          .privacy-main {
            padding: 80px 64px;
            gap: 96px;
          }
          .privacy-section {
            grid-template-columns: minmax(200px, 280px) 1fr;
            gap: 32px;
          }
        }
        @media (min-width: 1100px) {
          .pp-header-inner { padding: 10px 64px; }
        }
      `}</style>
      <header className="pp-header">
        <div className="pp-header-inner">
          <img src={logoImage} alt="Snadai" className="pp-logo" />

          <nav className="pp-nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="pp-nav-link">
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="pp-icons">
            <button
              type="button"
              className="pp-icon-btn"
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="pp-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="pp-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="pp-icon-btn pp-menu-btn"
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
          <nav className="pp-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="pp-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Privacy Policy</h1>
      </section>

      <main style={styles.main} className="privacy-main">
        <div style={styles.section} className="privacy-section">
          <h2 style={styles.sectionHeading}>Information Collection</h2>
          <div style={styles.blocks}>
            {infoCollectionBlocks.map((block) => (
              <div style={styles.block} key={block.title}>
                <span style={styles.blockTitle}>{block.title}</span>
                <p style={styles.blockText}>{block.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section} className="privacy-section">
          <h2 style={styles.sectionHeading}>Use of Information</h2>
          <div style={styles.blocks}>
            {useOfInfoBlocks.map((block) => (
              <div style={styles.block} key={block.title}>
                <span style={styles.blockTitle}>{block.title}</span>
                <p style={styles.blockText}>{block.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section} className="privacy-section">
          <h2 style={styles.sectionHeading}>Data Protection & Provenance</h2>
          <div style={styles.cardWrap}>
            <p style={styles.cardText}>
              Provenance is the bedrock of contemporary art valuation. We
              treat digital certificates and collection records as physical
              assets.
            </p>
            <p style={styles.cardQuote}>
              "How we secure digital certificates and collection records: All
              provenance documentation is encrypted using AES-256 standards
              and stored across redundant, highly secure servers. Access is
              strictly audited and limited to the head registrar and the
              assigned art advisor."
            </p>
          </div>
        </div>

        <div style={styles.section} className="privacy-section">
          <h2 style={styles.sectionHeading}>Third-Party Sharing</h2>
          <div style={styles.columnsRow}>
            {thirdPartyColumns.map((col) => (
              <div style={styles.column} key={col.title}>
                <p style={styles.columnTitle}>{col.title}</p>
                <p style={styles.columnText}>{col.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
