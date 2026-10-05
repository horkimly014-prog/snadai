import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabaseClient";
import GoogleMark from "./GoogleMark";
import logoImage from "./assets/image/Logo.png";
import roomImage from "./assets/image/13.png";

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    fontFamily: "'Times New Roman', Georgia, serif",
    background: "transparent",
  },
  visualColumn: {
    minWidth: 0,
    background: "#f4f3f3",
    overflow: "hidden",
    position: "relative",
  },
  visualImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  formColumn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    boxSizing: "border-box",
  },
  formInner: {
    width: "100%",
    maxWidth: "492px",
  },
  logo: {
    width: "150px",
    height: "150px",
    objectFit: "contain",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: "28px",
  },
  heading: {
    margin: "0 0 32px 0",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontWeight: 400,
    fontSize: "48px",
    lineHeight: "56px",
    color: "#1a1c1c",
  },
  field: {
    marginBottom: "28px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#444748",
  },
  inputWrap: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "none",
    borderBottom: "1px solid #6b7280",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    color: "#1a1c1c",
    padding: "14px 44px 15px 12px",
    outline: "none",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#1a1c1c",
  },
  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  forgotLink: {
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#444748",
    borderBottom: "1px solid #000000",
    paddingBottom: "3px",
    background: "none",
    cursor: "pointer",
    textDecoration: "none",
  },
  submitButton: {
    width: "100%",
    background: "#000000",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    padding: "16px 32px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    width: "100%",
    marginTop: "24px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#c4c7c7",
  },
  dividerLabel: {
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "14px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#444748",
  },
  googleButton: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#000000",
    // 1px less than the submit button's 16px/32px so the bordered box
    // matches its height.
    border: "1px solid #000000",
    padding: "15px 31px",
    marginTop: "24px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  legal: {
    marginTop: "40px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    lineHeight: "21.13px",
    color: "#444748",
  },
  legalLink: {
    color: "#444748",
    textDecoration: "underline",
  },
  registerRow: {
    marginTop: "56px",
    textAlign: "center",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    color: "#5d5f5f",
  },
  registerLink: {
    color: "#000000",
    borderBottom: "1px solid #000000",
    paddingBottom: "3px",
    background: "none",
    cursor: "pointer",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    textDecoration: "none",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home-page`,
      },
    });

    // On success the browser leaves for Google, so only failures land here.
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to log in.");
      return;
    }
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    navigate("/home-page");
  };

  return (
    <div style={styles.page}>
      <style>{`
        .auth-visual-col { display: none; }
        .auth-form-col { flex: 1 1 100%; }
        @media (min-width: 768px) {
          .auth-visual-col { display: block; flex: 1 1 42%; }
          .auth-form-col { flex: 1 1 58%; padding: 64px 24px; }
        }
      `}</style>
      <div style={styles.visualColumn} className="auth-visual-col">
        <img src={roomImage} alt="" style={styles.visualImage} />
      </div>

      <div style={styles.formColumn} className="auth-form-col">
        <div style={styles.formInner}>
          <img src={logoImage} alt="Snadai" style={styles.logo} />

          <h1 style={styles.heading}>
            Sign in to your
            <br />
            archival collection.
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="email">
                Email address
              </label>
              <div style={styles.inputWrap}>
                <input
                  id="email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ ...styles.field, marginBottom: 0 }}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
              <div style={styles.inputWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.5} />
                  ) : (
                    <Eye size={18} strokeWidth={1.5} />
                  )}
                </button>
              </div>

              <div style={styles.forgotRow}>
                <Link to="/reset-password" style={styles.forgotLink}>
                  Forgot password
                </Link>
              </div>
            </div>

            {error && (
              <p
                style={{
                  color: "#993c1d",
                  fontSize: "14px",
                  margin: "24px 0 0",
                }}
              >
                {error}
              </p>
            )}

            <div style={{ marginTop: "32px" }}>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={loading || googleLoading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerLabel}>or</span>
                <span style={styles.dividerLine} />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                style={{
                  ...styles.googleButton,
                  cursor: loading || googleLoading ? "default" : "pointer",
                }}
              >
                <GoogleMark />
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </button>
            </div>
          </form>

          <p style={styles.legal}>
            By clicking Sign Up or Continue with Email, Apple, Google, or
            Facebook, you agree to Artsy's{" "}
            <a
              style={styles.legalLink}
              href="https://www.artsy.net/terms"
              target="_blank"
              rel="noreferrer"
            >
              Terms and Conditions
            </a>{" "}
            and{" "}
            <Link style={styles.legalLink} to="/privacy-policy">
              Privacy Policy
            </Link>{" "}
            and to receiving emails from Artsy.
          </p>

          <p style={styles.registerRow}>
            Don't have an account?{" "}
            <Link to="/sign-up" style={styles.registerLink}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}