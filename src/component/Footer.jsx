import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import { subscribeEmail } from "../api";
import "./Footer.css";

const exploreLinks = [
  { label: "Shop", to: "/home" },
  { label: "Story", to: "/story" },
  { label: "Bulk Orders", to: "/bulk-order" },
  { label: "Coffee Quiz", to: "/quiz" },
];

const accountLinks = [
  { label: "My Account", to: "/account" },
  { label: "Log In", to: "/login" },
  { label: "Create Account", to: "/signup" },
  { label: "FAQ", to: "/faq" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/flawlezcoffee" },
  { label: "Facebook", href: "https://www.facebook.com/flawlezcoffee" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/flawlezcoffee" },
];

export default function Footer() {
  const { isLoggedIn } = useContext(CartContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState("");
  const [subscribeState, setSubscribeState] = useState("");

  const handleSubscribe = async (event) => {
    event.preventDefault();

    if (!email || !email.includes("@")) {
      setSubscribeState("error");
      setSubscribeMessage("Please enter a valid email address.");
      return;
    }

    if (!isLoggedIn) {
      setSubscribeState("error");
      setSubscribeMessage("Please log in to subscribe.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setSubscribeMessage("");
    setSubscribeState("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSubscribeState("error");
        setSubscribeMessage("Please log in to subscribe.");
        navigate("/login");
        return;
      }

      const response = await subscribeEmail(token, email);

      if (response.success) {
        setSubscribeState("success");
        setSubscribeMessage("You’re on the list for new drops and offers.");
        setEmail("");
      } else {
        setSubscribeState("error");
        setSubscribeMessage(response.message || "Subscription failed. Please try again.");
      }
    } catch (error) {
      setSubscribeState("error");
      setSubscribeMessage(error.message || "Subscription failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/home" className="footer-brand-mark" aria-label="Go to home">
              <img src="/Flawlez5.png" alt="Flawlez Coffee" className="footer-logo" />
            </Link>
            <div className="footer-brand-copy">
              <span className="footer-kicker">Flawlez Coffee</span>
              <h2>Minimal, premium coffee buying built for modern routines.</h2>
              <p>
                Better product clarity, calmer browsing, and a faster checkout flow for people who
                know exactly how they want their coffee to feel.
              </p>
            </div>
          </div>

          <div className="footer-newsletter">
            <span className="footer-kicker">Newsletter</span>
            <h3>Get early access to offers and new roasts.</h3>
            <p>Join the list for first looks at launches, restocks, and limited drops.</p>

            <form className="footer-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Joining..." : "Join the list"}
              </button>
            </form>

            {subscribeMessage ? (
              <p className={`footer-message ${subscribeState}`}>{subscribeMessage}</p>
            ) : null}
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-column">
            <h4>Explore</h4>
            <ul>
              {exploreLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4>Account</h4>
            <ul>
              {accountLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <ul>
              <li>Support Monday to Friday, 9:00 AM to 5:00 PM IST</li>
              <li>
                <a href="mailto:support@flawlez.com">support@flawlez.com</a>
              </li>
              <li>
                <a href="tel:+919729755524">+91 97297 55524</a>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Follow</h4>
            <ul>
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Flawlez Coffee. Designed for calmer coffee shopping.</p>
          <p>Secure checkout, live order tracking, and premium roasts without the usual ecommerce noise.</p>
        </div>
      </div>
    </footer>
  );
}
