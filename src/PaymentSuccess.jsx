import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "./supabaseClient";
import logoImage from "./assets/image/Logo.png";
import Footer from "./Footer";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 10;

const COPY = {
  checking: {
    title: "Confirming Your Payment",
    text: "We're finalizing your payment. This only takes a moment.",
  },
  paid: {
    title: "Payment Received",
    text: "Thank you — your acquisition is confirmed. You'll find it in your Purchase History.",
  },
  pending: {
    title: "Almost There",
    text: "Your payment is still processing. It will appear in your Purchase History shortly.",
  },
  error: {
    title: "We Couldn't Confirm That",
    text: "We couldn't verify this payment automatically. If you were charged, it will still appear in your Purchase History once processing finishes.",
  },
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const isDemo = searchParams.get("demo") === "1";
  const [status, setStatus] = useState(() => (orderId ? "checking" : "error"));

  useEffect(() => {
    if (!orderId) return undefined;

    let cancelled = false;
    let attempts = 0;
    let timer;

    const poll = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }

      if (data.status === "paid") {
        setStatus("paid");
        return;
      }

      attempts += 1;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setStatus("pending");
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  const { title, text } = COPY[status];

  return (
    <div className="ps-page">
      <style>{`
        .ps-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f9f9f9;
          color: #1a1c1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .ps-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }
        .ps-header {
          display: flex;
          justify-content: center;
          padding: 32px 24px 0;
        }
        .ps-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        .ps-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px 96px;
        }
        .ps-card {
          max-width: 480px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .ps-icon {
          color: #ac834b;
        }
        .ps-title {
          font-weight: 400;
          font-size: 32px;
          margin: 0;
        }
        .ps-text {
          font-size: 16px;
          color: #444748;
          line-height: 1.6;
          margin: 0;
        }
        .ps-demo {
          margin: 0;
          padding: 10px 16px;
          border: 1px solid #ac834b;
          background: #fbf7f0;
          color: #7a5a28;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 5px;
        }
        .ps-link {
          margin-top: 16px;
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 16px 32px;
          font-size: 14px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          text-decoration: none;
        }
      `}</style>

      <header className="ps-header">
        <Link to="/home-page">
          <img src={logoImage} alt="Snadai" className="ps-logo" />
        </Link>
      </header>

      <main className="ps-main">
        <div className="ps-card">
          <CheckCircle2 size={48} strokeWidth={1.5} className="ps-icon" />
          <h1 className="ps-title ps-serif">{title}</h1>
          <p className="ps-text ps-serif">{text}</p>
          {isDemo && (
            <p className="ps-demo">
              Demo mode — no payment was actually taken. Turn this off before
              going live.
            </p>
          )}
          <Link to="/orders" className="ps-link ps-serif">
            View Purchase History
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
