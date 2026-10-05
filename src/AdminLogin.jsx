import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import logoImage from "./assets/image/Logo.png";

// Single dedicated admin account for now. The ID is just a friendly label
// shown at login — Supabase auth still runs on a real email under the hood.
const ADMIN_LOGINS = {
  ID168168: "horkimly014+id168168@gmail.com",
};

const styles = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
    fontFamily: "'Times New Roman', Georgia, serif",
    background: "#1a1c1c",
    padding: "24px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#ffffff",
    padding: "40px 32px",
    boxSizing: "border-box",
  },
  logo: {
    width: "90px",
    height: "90px",
    objectFit: "contain",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: "16px",
  },
  heading: {
    margin: "0 0 32px 0",
    textAlign: "center",
    fontWeight: 400,
    fontSize: "28px",
    color: "#1a1c1c",
  },
  field: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#444748",
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
    padding: "12px 4px",
    outline: "none",
  },
  submitButton: {
    width: "100%",
    background: "#000000",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    padding: "16px 32px",
    marginTop: "12px",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "16px",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  error: {
    color: "#993c1d",
    fontSize: "14px",
    margin: "20px 0 0",
  },
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = ADMIN_LOGINS[id.trim().toUpperCase()];
    if (!email || !password) {
      setError("Invalid ID or password.");
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data?.user) {
      setLoading(false);
      setError("Invalid ID or password.");
      return;
    }

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    setLoading(false);

    if (!adminRow) {
      await supabase.auth.signOut();
      setError("This account is not authorized as admin.");
      return;
    }

    navigate("/admin/submissions");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={logoImage} alt="Snadai" style={styles.logo} />
        <h1 style={styles.heading}>Admin Login</h1>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="admin-id">
              Admin ID
            </label>
            <input
              id="admin-id"
              type="text"
              autoComplete="username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
