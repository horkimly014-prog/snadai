import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import logoImage from "./assets/image/Logo.png";
import { AuthGateContext } from "./authContexts";

export function AuthGateProvider({ children }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const requestAuth = useCallback(() => setOpen(true), []);

  return (
    <AuthGateContext.Provider value={{ requestAuth }}>
      {children}

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "400px",
              background: "#f9f9f9",
              padding: "40px 32px",
              textAlign: "center",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#1a1c1c",
                display: "flex",
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <img
              src={logoImage}
              alt="Snadai"
              style={{
                width: "56px",
                height: "56px",
                objectFit: "contain",
                margin: "0 auto 16px",
                display: "block",
              }}
            />

            <h2
              style={{
                fontFamily: "'Times New Roman', Georgia, serif",
                fontWeight: 400,
                fontSize: "28px",
                color: "#1a1c1c",
                margin: "0 0 12px 0",
              }}
            >
              Join the Collection
            </h2>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#444748",
                margin: "0 0 28px 0",
              }}
            >
              Log in or create a free account to save favorites, place bids,
              and manage your collection.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link
                to="/"
                onClick={close}
                style={{
                  background: "#000",
                  color: "#fff",
                  padding: "14px 24px",
                  fontSize: "14px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Log In
              </Link>
              <Link
                to="/sign-up"
                onClick={close}
                style={{
                  border: "1px solid #1a1c1c",
                  color: "#1a1c1c",
                  padding: "14px 24px",
                  fontSize: "14px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}
