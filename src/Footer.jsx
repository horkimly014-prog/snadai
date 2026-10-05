import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";

import logoImage from "./assets/image/Logo.png";
import facebookIcon from "./assets/image/16.svg";
import instagramIcon from "./assets/image/18.svg";
import twitterIcon from "./assets/image/22.svg";
import tiktokIcon from "./assets/image/21.svg";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src={logoImage} alt="Snadai" className="site-footer-logo" />
          <div className="site-footer-social">
            <a href="#" aria-label="Facebook">
              <img src={facebookIcon} alt="Facebook" />
            </a>
            <a href="#" aria-label="Instagram">
              <img src={instagramIcon} alt="Instagram" />
            </a>
            <a href="#" aria-label="Twitter">
              <img src={twitterIcon} alt="Twitter" />
            </a>
            <a href="#" aria-label="TikTok">
              <img src={tiktokIcon} alt="TikTok" />
            </a>
          </div>
        </div>

        <div className="site-footer-contact">
          <h3 className="site-footer-contact-heading">Contact us</h3>

          <div className="site-footer-contact-rows">
            <div className="site-footer-row">
              <MapPin className="site-footer-icon" strokeWidth={1.5} />
              <p className="site-footer-text">
                79 Kampuchea Krom Blvd (128),
                <br />
                Phnom Penh 12251
              </p>
            </div>

            <div className="site-footer-row">
              <Mail className="site-footer-icon" strokeWidth={1.5} />
              <p className="site-footer-text">snadai@gmail.com</p>
            </div>

            <div className="site-footer-row">
              <Phone className="site-footer-icon" strokeWidth={1.5} />
              <p className="site-footer-text">+855 68784704</p>
            </div>
          </div>
        </div>

        <div className="site-footer-links">
          <Link to="/privacy-policy" className="site-footer-link">
            Privacy Policy
          </Link>
          <Link to="/terms" className="site-footer-link">
            Terms of Service
          </Link>
          <Link to="/acquisitions" className="site-footer-link">
            Acquisitions
          </Link>
          <Link to="/contact" className="site-footer-link">
            Contact
          </Link>
        </div>
      </div>

      <style>{`
        .site-footer {
          background: #f9f9f9;
          border-top: 1px solid #c4c7c7;
          padding: 48px 24px;
        }
        .site-footer-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .site-footer-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .site-footer-logo {
          width: 96px;
          height: 96px;
          object-fit: contain;
        }
        .site-footer-social {
          display: flex;
          gap: 20px;
        }
        .site-footer-social img {
          width: 25px;
          height: 25px;
          display: block;
        }
        .site-footer-contact {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .site-footer-contact-heading {
          font-family: 'Times New Roman', Georgia, serif;
          font-weight: 400;
          font-size: 24px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #000;
          margin: 0 0 20px 0;
        }
        /* inline-flex so this block shrinks to its widest row (the
           address), keeping it centered on the page as a unit while every
           row inside lines up against the same left edge instead of each
           one centering on its own width. */
        .site-footer-contact-rows {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .site-footer-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }
        .site-footer-row:last-child {
          margin-bottom: 0;
        }
        .site-footer-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          color: #000;
        }
        .site-footer-text {
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 18px;
          color: #000;
          margin: 0;
          line-height: 1.4;
        }
        .site-footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
        }
        .site-footer-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #444748;
          text-decoration: none;
          white-space: nowrap;
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .site-footer { padding: 64px 48px; }
          .site-footer-inner { flex-direction: row; justify-content: space-between; align-items: center; }
          .site-footer-contact { align-items: flex-start; }
          .site-footer-links { justify-content: flex-end; }
        }

        /* Desktop */
        @media (min-width: 1100px) {
          .site-footer { padding: 64px 64px; }
        }
      `}</style>
    </footer>
  );
}
