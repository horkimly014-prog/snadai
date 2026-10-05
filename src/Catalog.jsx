import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Heart, X, MapPin, Mail, Phone } from "lucide-react";
import { artworks, artists } from "./ArtworkData";
import { getFavoriteIds, toggleFavoriteId } from "./favorites";
import { artworkMatchesQuery } from "./searchArtworks";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";

import logoImage from "./assets/image/Logo.png";

import facebookIcon from "./assets/image/16.svg";
import instagramIcon from "./assets/image/18.svg";
import twitterIcon from "./assets/image/22.svg";
import tiktokIcon from "./assets/image/21.svg";

const serif = "'Times New Roman', Georgia, serif";
const sans = "'Helvetica Neue', Arial, sans-serif";

const styles = {
  page: {
    background: "transparent",
    color: "#1a1c1c",
    fontFamily: sans,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(249,249,249,0.95)",
    borderBottom: "1px solid rgba(196,199,199,0.3)",
    backdropFilter: "blur(6px)",
  },
  headerInner: {
    maxWidth: "1440px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 64px",
    flexWrap: "wrap",
    gap: "16px",
  },
  logo: {
    width: "60px",
    height: "60px",
    objectFit: "contain",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    flexWrap: "wrap",
  },
  navLink: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#444748",
    textDecoration: "none",
  },
  navLinkActive: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#000000",
    textDecoration: "none",
    borderBottom: "1px solid #ac834b",
    paddingBottom: "5px",
  },
  headerIcons: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#1a1c1c",
    display: "flex",
    alignItems: "center",
  },
  searchBar: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "16px 64px",
    borderTop: "1px solid rgba(196,199,199,0.3)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  searchInput: {
    flex: 1,
    border: "none",
    borderBottom: "1px solid #1a1c1c",
    background: "none",
    padding: "8px 0",
    fontSize: "16px",
    fontFamily: serif,
    color: "#1a1c1c",
    outline: "none",
  },
  searchClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#1a1c1c",
    display: "flex",
    alignItems: "center",
  },
  noResults: {
    color: "#747878",
    fontSize: "16px",
    fontFamily: serif,
    gridColumn: "1 / -1",
  },
  hero: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "64px 64px 0",
  },
  heroTitle: {
    fontFamily: serif,
    fontWeight: 400,
    fontSize: "48px",
    lineHeight: "56px",
    color: "#1a1c1c",
    margin: "0 0 16px 0",
  },
  heroSubtitle: {
    fontFamily: serif,
    fontSize: "18px",
    lineHeight: "28px",
    color: "#444748",
    margin: 0,
    maxWidth: "672px",
  },
  artistsSection: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "40px 64px 48px",
  },
  artistsTitle: {
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#000000",
    margin: "0 0 24px 0",
  },
  artistsRow: {
    display: "flex",
    gap: "24px",
    overflowX: "auto",
    paddingBottom: "8px",
  },
  artistCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
    width: "92px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  artistAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "9999px",
    objectFit: "cover",
  },
  artistName: {
    fontFamily: serif,
    fontSize: "13px",
    textAlign: "center",
    color: "#444748",
    lineHeight: "1.3",
  },
  main: {
    maxWidth: "1440px",
    margin: "0 auto",
    display: "flex",
    gap: "40px",
    alignItems: "flex-start",
  },
  sidebar: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "40px",
    maxHeight: "calc(100vh - 112px)",
    overflowY: "auto",
  },
  sidebarSectionTitle: {
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#000000",
    margin: "0 0 24px 0",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    cursor: "pointer",
  },
  checkboxInput: {
    width: "16px",
    height: "16px",
    accentColor: "#000000",
    cursor: "pointer",
  },
  checkboxLabel: {
    fontFamily: serif,
    fontSize: "16px",
    color: "#444748",
  },
  grid: {
    flex: 1,
    display: "grid",
    gap: "24px",
    width: "100%",
    minWidth: 0,
  },
  card: {
    border: "1px solid rgba(196,199,199,0.3)",
    display: "flex",
    flexDirection: "column",
  },
  cardImageWrap: {
    width: "100%",
    aspectRatio: "4 / 5",
    overflow: "hidden",
    background: "#eeeeee",
    position: "relative",
  },
  favoriteButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "36px",
    height: "36px",
    borderRadius: "9999px",
    background: "rgba(255,255,255,0.9)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    background: "#f9f9f9",
    padding: "24px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  cardTitleRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  cardTitle: {
    fontFamily: serif,
    fontWeight: 700,
    fontSize: "24px",
    color: "#000000",
    margin: 0,
  },
  cardMedium: {
    fontFamily: serif,
    fontSize: "16px",
    color: "#747878",
    margin: 0,
  },
  cardPrice: {
    display: "inline-block",
    fontFamily: '"Times New Roman", Times, serif',
    fontWeight: 600,
    fontSize: "18px",
    letterSpacing: "1.2px",
    color: "#ac834b",
    borderBottom: "1px solid #ac834b",
    paddingBottom: "5px",
    width: "fit-content",
    background: "none",
    cursor: "pointer",
  },
  purchaseButton: {
    background: "#000000",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    padding: "12px 24px",
    fontFamily: '"Times New Roman", Times, serif',
    fontWeight: 600,
    fontSize: "12px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  footer: {
    borderTop: "1px solid #c4c7c7",
    background: "transparent",
    padding: "64px",
  },
  footerInner: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "48px",
  },
  footerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  contactBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    minWidth: "260px",
  },
  contactHeading: {
    fontFamily: serif,
    fontWeight: 400,
    fontSize: "18px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#000000",
    margin: "0 0 16px 0",
    textAlign: "center",
  },
  contactRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  contactIcon: {
    width: "20px",
    height: "20px",
    marginTop: "2px",
    flexShrink: 0,
    color: "#000",
  },
  contactText: {
    fontFamily: serif,
    fontSize: "18px",
    color: "#000000",
    margin: 0,
  },
  footerLinks: {
    display: "flex",
    gap: "32px",
    flexWrap: "wrap",
  },
  footerLink: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    color: "#444748",
    textDecoration: "none",
  },
  socialRow: {
    display: "flex",
    gap: "20px",
    marginTop: "8px",
  },
  socialIcon: {
    width: "22px",
    height: "22px",
  },
  footerLogo: {
    width: "96px",
    height: "96px",
    objectFit: "contain",
  },
};

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

const priceSortOptions = ["High to Low", "Low to High"];

// Pieces below this price lead the grid in the default (unsorted) view.
const AFFORDABLE_MAX = 1000;

// Prices are stored as display strings like "$10,000" - strip everything
// that is not a digit or decimal point so they can be compared as numbers.
const parsePrice = (price) => {
  const value = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isNaN(value) ? 0 : value;
};

export default function Catalog() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const [priceSort, setPriceSort] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const togglePriceSort = (value) => {
    setPriceSort((prev) => (prev === value ? null : value));
  };

  const toggleFavorite = (id) => {
    requireAuth(() => {
      toggleFavoriteId(id).then(setFavorites);
    });
  };

  const filteredArtworks = artworks
    .filter((art) => artworkMatchesQuery(art, searchQuery))
    .slice()
    .sort((a, b) => {
      if (!priceSort) return 0;
      const diff = parsePrice(a.price) - parsePrice(b.price);
      return priceSort === "Low to High" ? diff : -diff;
    });

  
  const orderedArtworks = priceSort
    ? filteredArtworks
    : [
        ...filteredArtworks.filter(
          (art) => parsePrice(art.price) < AFFORDABLE_MAX
        ),
        ...filteredArtworks.filter(
          (art) => parsePrice(art.price) >= AFFORDABLE_MAX
        ),
      ];

  const renderCard = (art) => (
    <div
      style={{ ...styles.card, cursor: "pointer" }}
      className="catalog-card"
      key={art.id}
      onClick={() => navigate(`/artwork/${art.id}`)}
    >
      <div style={styles.cardImageWrap}>
        <button
          type="button"
          style={styles.favoriteButton}
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
        <img src={art.image} alt={art.title} style={styles.cardImage} />
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardTitleRow}>
          <p style={styles.cardTitle}>{art.title}</p>
          <p style={styles.cardMedium}>{art.medium}, {art.year}</p>
          <span style={styles.cardPrice}>{art.price}</span>
        </div>
        <button
          type="button"
          style={styles.purchaseButton}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/artwork/${art.id}`);
          }}
        >
          Purchase
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        .catalog-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .catalog-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }
        .catalog-main {
          flex-direction: column;
          padding: 32px 24px 64px;
        }
        .catalog-sidebar {
          width: 100%;
          position: static;
        }
        .catalog-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 480px) {
          .catalog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 768px) {
          .catalog-main {
            flex-direction: row;
            padding: 48px 64px 96px;
          }
          .catalog-sidebar {
            width: 220px;
            position: sticky;
            top: 96px;
          }
        }
        @media (min-width: 1100px) {
          .catalog-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <img src={logoImage} alt="Snadai" style={styles.logo} />
          <nav style={styles.nav}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                style={
                  link.label === "Artists&Artwork"
                    ? styles.navLinkActive
                    : styles.navLink
                }
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
          <div style={styles.headerIcons}>
            <button
              type="button"
              style={styles.iconButton}
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              style={styles.iconButton}
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              style={styles.iconButton}
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              style={styles.iconButton}
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div style={styles.searchBar}>
            <Search size={18} strokeWidth={1.5} />
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search artworks, artists, mediums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              style={styles.searchClose}
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

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>The Catalog</h1>
        <p style={styles.heroSubtitle}>
          A curated selection of contemporary masterpieces from around the
          globe, organized for the discerning collector.
        </p>
      </section>

      <section style={styles.artistsSection}>
        <h3 style={styles.artistsTitle}>Our Artists</h3>
        <div style={styles.artistsRow}>
          {Object.entries(artists).map(([name, info]) => (
            <button
              type="button"
              key={name}
              style={styles.artistCard}
              onClick={() => navigate(`/artist/${encodeURIComponent(name)}`)}
            >
              <img src={info.avatar} alt={name} style={styles.artistAvatar} />
              <span style={styles.artistName}>{name}</span>
            </button>
          ))}
        </div>
      </section>

      <div style={styles.main} className="catalog-main">
        <aside style={styles.sidebar} className="catalog-sidebar">
          <div>
            <h3 style={styles.sidebarSectionTitle}>Price</h3>
            {priceSortOptions.map((option) => (
              <label style={styles.checkboxRow} key={option}>
                <input
                  type="checkbox"
                  style={styles.checkboxInput}
                  checked={priceSort === option}
                  onChange={() => togglePriceSort(option)}
                />
                <span style={styles.checkboxLabel}>{option}</span>
              </label>
            ))}
          </div>
        </aside>

        <div style={styles.grid} className="catalog-grid">
          {orderedArtworks.length === 0 && (
            <p style={styles.noResults}>
              {searchQuery
                ? `No artworks match "${searchQuery}".`
                : "No artworks found."}
            </p>
          )}
          {orderedArtworks.map(renderCard)}
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <img src={logoImage} alt="Snadai" style={styles.footerLogo} />
            <div style={styles.socialRow}>
              <img src={facebookIcon} alt="Facebook" style={styles.socialIcon} />
              <img src={instagramIcon} alt="Instagram" style={styles.socialIcon} />
              <img src={twitterIcon} alt="Twitter" style={styles.socialIcon} />
              <img src={tiktokIcon} alt="TikTok" style={styles.socialIcon} />
            </div>
          </div>

          <div style={styles.contactBlock}>
            <h3 style={styles.contactHeading}>Contact us</h3>

            <div style={styles.contactRow}>
              <MapPin style={styles.contactIcon} strokeWidth={1.5} />
              <p style={styles.contactText}>
                79 Kampuchea Krom Blvd (128),
                <br />
                Phnom Penh 12251
              </p>
            </div>

            <div style={styles.contactRow}>
              <Mail style={styles.contactIcon} strokeWidth={1.5} />
              <p style={styles.contactText}>snadai@gmail.com</p>
            </div>

            <div style={styles.contactRow}>
              <Phone style={styles.contactIcon} strokeWidth={1.5} />
              <p style={styles.contactText}>+855 68784704</p>
            </div>
          </div>

          <div style={styles.footerLinks}>
            <Link to="/privacy-policy" style={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link to="/terms" style={styles.footerLink}>
              Terms of Service
            </Link>
            <Link to="/acquisitions" style={styles.footerLink}>
              Acquisitions
            </Link>
            <Link to="/contact" style={styles.footerLink}>
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}