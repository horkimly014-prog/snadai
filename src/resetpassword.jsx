import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabaseClient";

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "transparent",
    display: "flex",
    justifyContent: "center",
    padding: "80px 24px",
    fontFamily: "'Times New Roman', Georgia, serif",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: "448px",
  },
  headingRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "40px",
  },
  heading: {
    margin: 0,
    fontFamily: "'Times New Roman', Georgia, serif",
    fontWeight: 400,
    fontSize: "48px",
    lineHeight: "56px",
    color: "#1a1c1c",
  },
  keyBox: {
    flexShrink: 0,
    width: "48px",
    height: "48px",
    border: "1px solid #c4c7c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "8px",
  },
  description: {
    margin: "0 0 40px 0",
    maxWidth: "384px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontWeight: 400,
    fontSize: "16px",
    lineHeight: "24px",
    color: "#444748",
  },
  field: {
    marginBottom: "31px",
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
    height: "48px",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "none",
    borderBottom: "1px solid #6b7280",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    color: "#1a1c1c",
    padding: "0 32px 0 0",
    outline: "none",
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#1a1c1c",
    opacity: 0.5,
  },
  button: {
    width: "100%",
    height: "56px",
    marginTop: "32px",
    background: "#000000",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    letterSpacing: "2.4px",
    textTransform: "uppercase",
  },
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("request");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Enter your email address.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setMessage("Check your email for a link to reset your password.");
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headingRow}>
          <h1 style={styles.heading}>
            {mode === "request" ? (
              <>
                Reset Your
                <br />
                Access Key.
              </>
            ) : (
              <>
                Set A New
                <br />
                Access Key.
              </>
            )}
          </h1>
          <div style={styles.keyBox}>
            <Key size={20} strokeWidth={1.5} color="#1a1c1c" />
          </div>
        </div>

        <p style={styles.description}>
          {mode === "request"
            ? "Enter the email tied to your account and we'll send you a secure link to reset your password."
            : "Ensure your account remains private. Please select a sophisticated and secure new password."}
        </p>

        {mode === "request" ? (
          <form onSubmit={handleRequestSubmit}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="reset-email">
                Email address
              </label>
              <div style={styles.inputWrap}>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {error && (
              <p style={{ color: "#993c1d", fontSize: "14px", margin: "-16px 0 16px" }}>
                {error}
              </p>
            )}
            {message && (
              <p style={{ color: "#1a1c1c", fontSize: "14px", margin: "-16px 0 16px" }}>
                {message}
              </p>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdateSubmit}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="new-password">
                New password
              </label>
              <div style={styles.inputWrap}>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter security sequence"
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
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="confirm-password">
                Confirm password
              </label>
              <div style={styles.inputWrap}>
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat security sequence"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff size={18} strokeWidth={1.5} />
                  ) : (
                    <Eye size={18} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: "#993c1d", fontSize: "14px", margin: "-16px 0 16px" }}>
                {error}
              </p>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Updating..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
