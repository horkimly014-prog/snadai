import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabaseClient";
import GoogleMark from "./GoogleMark";
import logoImage from "./assets/image/Logo.png";
import collageImage from "./assets/image/12.png";

const serifRegular = { fontFamily: '"Times New Roman", Times, serif' };
const serifBold = {
  fontFamily: '"Times New Roman", Times, serif',
  fontWeight: 700,
};

function Field({ label, placeholder, type = "text", value, onChange, trailing }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <label
        style={{
          ...serifBold,
          fontSize: 16,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "#000",
        }}
      >
        {label}
      </label>
      <div
        style={{
          position: "relative",
          width: "100%",
          borderBottom: "1px solid #6b7280",
          background: "#fff",
          paddingTop: 14,
          paddingBottom: 15,
        }}
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            ...serifRegular,
            fontSize: 16,
            color: "#111",
            width: "100%",
            boxSizing: "border-box",
            border: "none",
            outline: "none",
            background: "transparent",
            paddingLeft: 12,
            paddingRight: trailing ? 44 : 12,
          }}
        />
        {trailing}
      </div>
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleGoogleSignUp = async () => {
    setError("");
    setSuccessMessage("");
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
    if (!fullName || !email || !password) {
      setError("Fill in your name, email, and password to continue.");
      return;
    }
    setError("");
    setSuccessMessage("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required, Supabase won't return a session yet.
    if (!data.session) {
      setSuccessMessage(
        "Account created! Check your email to confirm your address before logging in."
      );
      return;
    }

    navigate("/home-page");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        background: "transparent",
      }}
    >
      <style>{`
        .auth-visual-col { display: none; }
        .auth-form-col { flex: 1 1 100%; padding: 40px 24px; }
        @media (min-width: 768px) {
          .auth-visual-col { display: block; flex: 1 1 42%; }
          .auth-form-col { flex: 1 1 58%; padding: 64px 24px; }
        }
      `}</style>
      {/* Visual column */}
      <div
        style={{
          minWidth: 0,
          background: "#f4f3f3",
          position: "relative",
          overflow: "hidden",
        }}
        className="auth-visual-col"
      >
        <img
          src={collageImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        className="auth-form-col"
        style={{
          minWidth: 0,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 492 }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <img src={logoImage} style={{ width: "150px", height: "150px" }} alt="Logo" />
          </div>

          {/* Heading */}
          <h1
            style={{
              ...serifRegular,
              fontSize: 48,
              lineHeight: "56px",
              color: "#000",
              margin: 0,
              textAlign: "center",
            }}
          >
            Create Account
          </h1>

          {/* Subtext */}
          <p
            style={{
              ...serifBold,
              fontSize: 16,
              lineHeight: "24px",
              color: "#444748",
              textAlign: "center",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Enter your details to begin your collection journey.
          </p>

          {/* Form */}
          <form
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 40,
              marginTop: 44,
            }}
            onSubmit={handleSubmit}
          >
            <Field
              label="Full Name"
              placeholder="Meng long"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Field
              label="Email "
              placeholder="name@gmail.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              }
            />

            {error && (
              <p style={{ ...serifRegular, color: "#993c1d", fontSize: 14, margin: 0 }}>
                {error}
              </p>
            )}

            {successMessage && (
              <p style={{ ...serifRegular, color: "#1a1c1c", fontSize: 14, margin: 0 }}>
                {successMessage}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 8 }}>
              <button
                type="submit"
                disabled={loading || googleLoading}
                style={{
                  ...serifBold,
                  background: "#000",
                  color: "#fff",
                  fontSize: 12,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  padding: "16px 32px",
                  border: "none",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  width: "100%",
                }}
              >
                <span style={{ flex: 1, height: 1, background: "#c4c7c7" }} />
                <span
                  style={{
                    ...serifRegular,
                    fontSize: 14,
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                    color: "#444748",
                  }}
                >
                  or
                </span>
                <span style={{ flex: 1, height: 1, background: "#c4c7c7" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading || googleLoading}
                style={{
                  ...serifBold,
                  background: "#fff",
                  color: "#000",
                  fontSize: 12,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  // 1px less than the submit button's 16px/32px so the
                  // bordered box matches its height.
                  padding: "15px 31px",
                  border: "1px solid #000",
                  cursor: loading || googleLoading ? "default" : "pointer",
                  width: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <GoogleMark />
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span style={{ ...serifRegular, fontSize: 16, color: "#444748" }}>
                  Already have an account?
                </span>
                <Link
                  to="/"
                  style={{
                    ...serifBold,
                    fontSize: 16,
                    color: "#000",
                    textDecoration: "none",
                    borderBottom: "1px solid #000",
                    paddingBottom: 3,
                  }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </form>

          <div style={{ borderTop: "1px solid #c4c7c7", marginTop: 40, paddingTop: 24 }}>
            <p
              style={{
                ...serifRegular,
                fontSize: 16,
                lineHeight: "21.13px",
                color: "#444748",
                margin: 0,
              }}
            >
              By creating an account, you agree to our Terms of Service. Curated
              Contemporary ensures your data is archived with the same rigor as our
              physical collections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}