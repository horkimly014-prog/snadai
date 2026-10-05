import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Upload, FileText, Heart } from "lucide-react";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";

import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";

const navLinks = [
  { label: "Home", to: "/home-page" },
  { label: "Artists&Artwork", to: "/catalog" },
  { label: "Submit&Art", to: "/exhibitions" },
  { label: "Auction", to: "/auction" },
  { label: "About&Contact", to: "/about" },
];

const initialForm = {
  fullName: "",
  email: "",
  statement: "",
  artworkTitle: "",
  medium: "",
  dimensions: "",
  year: "",
};

export default function Submissions() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filePreviews = useMemo(
    () =>
      files.map((f) => ({
        file: f,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [filePreviews]);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addFiles = (list) => {
    const selected = Array.from(list || []);
    if (selected.length) {
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => (e) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    requireAuth(async () => {
      if (!form.fullName || !form.email || !form.artworkTitle) {
        setError("Please fill in your name, email, and artwork title.");
        setSuccess("");
        return;
      }
      setError("");
      setSuccess("");
      setSubmitting(true);

      const filePaths = [];
      for (const f of files) {
        const path = `${user.id}/${Date.now()}-${f.name}`;
        const { error: uploadError } = await supabase.storage
          .from("submissions")
          .upload(path, f);
        if (uploadError) {
          setSubmitting(false);
          setError(uploadError.message);
          return;
        }
        filePaths.push(path);
      }

      const { data: inserted, error: insertError } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          full_name: form.fullName,
          email: form.email,
          statement: form.statement,
          artwork_title: form.artworkTitle,
          medium: form.medium,
          dimensions: form.dimensions,
          year: form.year,
          file_path: filePaths.join(","),
        })
        .select("id")
        .single();

      setSubmitting(false);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      supabase.functions
        .invoke("send-submission-confirmation-email", {
          body: { submissionId: inserted.id },
        })
        .catch((err) => console.error("Failed to send confirmation email:", err));

      setSuccess("Thank you! Your submission has been received.");
      setForm(initialForm);
      setFiles([]);
    });
  };

  return (
    <div className="sub-page">
      <style>{`
        .sub-page {
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .sub-page * {
          box-sizing: border-box;
        }
        .sub-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }

        /* Header */
        .sub-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(249,249,249,0.95);
          border-bottom: 1px solid rgba(196,199,199,0.3);
          backdrop-filter: blur(6px);
        }
        .sub-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
        }
        .sub-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .sub-nav-desktop {
          display: none;
          align-items: center;
          gap: 28px;
        }
        .sub-nav-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }
        .sub-nav-link.active {
          color: #000;
          border-bottom: 1px solid #ac834b;
          padding-bottom: 5px;
        }
        .sub-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sub-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1c1c;
          display: flex;
          align-items: center;
        }
        .sub-menu-btn {
          display: flex;
        }
        .sub-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          border-top: 1px solid rgba(196,199,199,0.3);
        }

        /* Hero */
        .sub-hero {
          max-width: 1440px;
          margin: 0 auto;
          padding: 48px 24px 0;
        }
        .sub-hero-title {
          font-weight: 400;
          font-size: 40px;
          line-height: 1.15;
          color: #1a1c1c;
          margin: 0 0 24px 0;
        }
        .sub-hero-desc {
          font-size: 18px;
          line-height: 1.6;
          color: #444748;
          margin: 0;
          max-width: 672px;
        }

        /* Main grid */
        .sub-main {
          max-width: 1440px;
          margin: 0 auto;
          padding: 48px 24px 96px;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        /* Sidebar */
        .sub-sidebar {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .sub-side-heading {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #000;
          margin: 0 0 12px 0;
        }
        .sub-side-text {
          font-size: 16px;
          color: #444748;
          margin: 0;
          line-height: 1.5;
        }
        .sub-side-divider {
          border-top: 1px solid #c4c7c7;
          padding-top: 24px;
        }
        .sub-side-note {
          font-size: 13px;
          color: #747878;
          font-style: italic;
          line-height: 1.4;
          margin: 0;
        }

        /* Form */
        .sub-form {
          display: flex;
          flex-direction: column;
        }
        .sub-form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .sub-field {
          display: flex;
          flex-direction: column;
        }
        .sub-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #444748;
          margin-bottom: 8px;
        }
        .sub-input {
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          border: none;
          border-bottom: 1px solid #6b7280;
          padding: 10px 12px 11px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          color: #1a1c1c;
          outline: none;
        }
        .sub-textarea {
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          border: none;
          border-bottom: 1px solid #6b7280;
          padding: 10px 12px 11px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          color: #1a1c1c;
          outline: none;
          resize: vertical;
          min-height: 100px;
        }
        .sub-section-divider {
          border-top: 1px solid #c4c7c7;
          margin-top: 32px;
          padding-top: 32px;
        }
        .sub-section-heading {
          font-weight: 400;
          font-size: 24px;
          color: #474646;
          margin: 0 0 32px 0;
        }
        .sub-work-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        /* File upload */
        .sub-upload-wrap {
          margin-top: 32px;
        }
        .sub-dropzone {
          border: 1px dashed #c4c7c7;
          padding: 96px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          background: none;
          width: 100%;
          text-align: center;
        }
        .sub-dropzone-text {
          font-size: 16px;
          color: #444748;
          margin: 8px 0 0 0;
        }
        .sub-dropzone-sub {
          font-size: 13px;
          color: #747878;
          margin: 0;
        }
        .sub-filename {
          margin-top: 8px;
          font-size: 13px;
          color: #1a1c1c;
        }
        .sub-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .sub-preview-item {
          position: relative;
          border: 1px solid rgba(196,199,199,0.6);
          background: #fff;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .sub-preview-thumb {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          display: block;
          background: #eee;
        }
        .sub-preview-file-icon {
          width: 100%;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f2f2f2;
        }
        .sub-preview-name {
          font-size: 11px;
          color: #444748;
          margin: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sub-preview-remove {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: #1a1c1c;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sub-preview-remove:hover {
          background: #993c1d;
        }

        /* Submit */
        .sub-submit-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 32px;
        }
        .sub-submit-btn {
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 16px 48px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .sub-header-inner { padding: 10px 48px; }
          .sub-nav-desktop { display: flex; }
          .sub-menu-btn { display: none; }
          .sub-hero { padding: 64px 48px 0; }
          .sub-hero-title { font-size: 48px; }
          .sub-main { padding: 64px 48px 128px; flex-direction: row; align-items: flex-start; }
          .sub-sidebar { width: 264px; flex-shrink: 0; }
          .sub-form { flex: 1; min-width: 0; }
          .sub-form-row { grid-template-columns: 1fr 1fr; }
          .sub-work-grid { grid-template-columns: 1fr 1fr; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .sub-header-inner { padding: 10px 64px; }
          .sub-hero { padding: 96px 64px 0; }
          .sub-main { padding: 96px 64px 128px; }
        }
      `}</style>

      {/* Header */}
      <header className="sub-header">
        <div className="sub-header-inner">
          <img src={logoImage} alt="Snadai" className="sub-logo" />

          <nav className="sub-nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`sub-nav-link ${
                  link.label === "Submit&Art" ? "active" : ""
                }`}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="sub-icons">
            <button
              type="button"
              className="sub-icon-btn"
              aria-label="Favorites"
              onClick={() => requireAuth(() => navigate("/collector-profile"))}
            >
              <Heart size={18} strokeWidth={1.5} fill="none" color="#1a1c1c" />
            </button>
            <button
              type="button"
              className="sub-icon-btn"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="sub-icon-btn"
              aria-label="Account"
              onClick={() => requireAuth(() => navigate("/Profile"))}
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="sub-icon-btn sub-menu-btn"
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
          <nav className="sub-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`sub-nav-link ${
                  link.label === "Submit&Art" ? "active" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="sub-hero">
        <h1 className="sub-hero-title sub-serif">Artist Submissions</h1>
        <p className="sub-hero-desc">
          Curated Contemporary is committed to the discovery and
          representation of exceptional artists whose work challenges
          boundaries and redefines the contemporary landscape. We invite
          serious practitioners to submit their portfolios for review by our
          curatorial committee.
        </p>
      </section>

      <main className="sub-main">
        {/* Sidebar */}
        <aside className="sub-sidebar">
          <div>
            <h3 className="sub-side-heading">Inquiries</h3>
            <p className="sub-side-text">Snadai@gmail.com</p>
            <p className="sub-side-text">+855 68784704</p>
          </div>

          <div>
            <h3 className="sub-side-heading">Telegram</h3>
            <p className="sub-side-text">+855 973467402</p>
          </div>

          <div>
            <h3 className="sub-side-heading">Location</h3>
            <p className="sub-side-text">
              79 Kampuchea Krom Blvd (128), Phnom Penh 12251
            </p>
          </div>

          <div>
            <h3 className="sub-side-heading">Visiting Hours</h3>
            <p className="sub-side-text">Monday — Friday</p>
            <p className="sub-side-text">10:00 AM — 6:00 PM</p>
          </div>

          <div className="sub-side-divider">
            <p className="sub-side-note">
              *Due to high volume, please allow 4–6 weeks for our curators to
              review your submission.
            </p>
          </div>
        </aside>

        {/* Form */}
        <form className="sub-form" onSubmit={handleSubmit}>
          <div className="sub-form-row">
            <div className="sub-field">
              <label className="sub-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="sub-input"
                placeholder="Hor kimly"
                value={form.fullName}
                onChange={updateField("fullName")}
              />
            </div>
            <div className="sub-field">
              <label className="sub-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="sub-input"
                placeholder="name@gmail.com"
                value={form.email}
                onChange={updateField("email")}
              />
            </div>
          </div>

          <div className="sub-field" style={{ marginTop: "24px" }}>
            <label className="sub-label" htmlFor="statement">
              Artist Statement
            </label>
            <textarea
              id="statement"
              className="sub-textarea"
              placeholder="Describe the conceptual framework of your practice..."
              value={form.statement}
              onChange={updateField("statement")}
            />
          </div>

          <div className="sub-section-divider">
            <h2 className="sub-section-heading sub-serif">
              Primary Work Details
            </h2>

            <div className="sub-work-grid">
              <div className="sub-field">
                <label className="sub-label" htmlFor="artworkTitle">
                  Artwork Title
                </label>
                <input
                  id="artworkTitle"
                  type="text"
                  className="sub-input"
                  placeholder="Untitled No. 1"
                  value={form.artworkTitle}
                  onChange={updateField("artworkTitle")}
                />
              </div>
              <div className="sub-field">
                <label className="sub-label" htmlFor="medium">
                  Medium
                </label>
                <input
                  id="medium"
                  type="text"
                  className="sub-input"
                  placeholder="Oil on Canvas, Mixed Media, etc."
                  value={form.medium}
                  onChange={updateField("medium")}
                />
              </div>
              <div className="sub-field">
                <label className="sub-label" htmlFor="dimensions">
                  Dimensions
                </label>
                <input
                  id="dimensions"
                  type="text"
                  className="sub-input"
                  placeholder="H x W x D (cm/in)"
                  value={form.dimensions}
                  onChange={updateField("dimensions")}
                />
              </div>
              <div className="sub-field">
                <label className="sub-label" htmlFor="year">
                  Year of Creation
                </label>
                <input
                  id="year"
                  type="text"
                  className="sub-input"
                  placeholder="2026"
                  value={form.year}
                  onChange={updateField("year")}
                />
              </div>
            </div>
          </div>

          <div className="sub-upload-wrap">
            <label className="sub-label">File Upload</label>

            {filePreviews.length > 0 && (
              <div className="sub-preview-grid">
                {filePreviews.map((p, i) => (
                  <div className="sub-preview-item" key={`${p.file.name}-${i}`}>
                    {p.url ? (
                      <img
                        src={p.url}
                        alt={p.file.name}
                        className="sub-preview-thumb"
                      />
                    ) : (
                      <div className="sub-preview-file-icon">
                        <FileText size={28} strokeWidth={1.5} color="#444748" />
                      </div>
                    )}
                    <p className="sub-preview-name">{p.file.name}</p>
                    <button
                      type="button"
                      className="sub-preview-remove"
                      aria-label={`Remove ${p.file.name}`}
                      onClick={removeFile(i)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="sub-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload size={22} strokeWidth={1.5} color="#444748" />
              <p className="sub-dropzone-text">
                Drag and drop high-resolution images or click to browse.
              </p>
              <p className="sub-dropzone-sub">
                PDF, JPG, PNG, or TIFF. Maximum file size 25MB per upload.
                You can select multiple files.
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <p style={{ color: "#993c1d", fontSize: "14px", marginTop: "24px" }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: "#1a1c1c", fontSize: "14px", marginTop: "24px" }}>
              {success}
            </p>
          )}

          <div className="sub-submit-row">
            <button type="submit" className="sub-submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}