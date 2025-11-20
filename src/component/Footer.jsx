import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import { subscribeEmail } from "../api";
import "./Footer.css";

export default function Footer() {
  const { isLoggedIn } = useContext(CartContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setSubscribeMessage("Please enter a valid email address");
      return;
    }

    if (!isLoggedIn) {
      setSubscribeMessage("Please login to subscribe");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setSubscribeMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSubscribeMessage("Please login to subscribe");
        navigate("/login");
        return;
      }

      const response = await subscribeEmail(token, email);
      
      if (response.success) {
        setSubscribeMessage("Successfully subscribed! Thank you.");
        setEmail("");
      } else {
        setSubscribeMessage(response.message || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setSubscribeMessage(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img src="/Flawlez5.png" alt="Coffee Collective" className="footer-logo" />
        </div>

        <div className="footer-grid">
          <div className="footer-column footer-subscribe">
            <h5>Be the first to know!</h5>
            <p>Subscribers get early access to new releases, seasonal coffees, and special offers.</p>
            <form className="footer-form" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                aria-label="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {subscribeMessage && (
              <p className={`footer-message ${subscribeMessage.includes("Success") ? "success" : "error"}`}>
                {subscribeMessage}
              </p>
            )}
          </div>

          <div className="footer-column">
            <h5>Contact Us</h5>
            <ul>
              <li><span>Live Chat</span> M–F 9:00am – 5:00pm IST</li>
              <li><a href="mailto:Support@flawlez.com">Support@flawlez.com</a></li>
              <li><a href="tel:+919729755524">+91 97297 55524</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>Support</h5>
            <ul>
              <li><a href="mailto:Support@flawlez.com?subject=Contact">Contact Us</a></li>
              <li><a href="/shipping">Shipping & Returns</a></li>
              <li><a href="/orders">Order Status</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/subscriptions">Manage Subscriptions</a></li>
              <li><a href="/gift-cards">Gift Cards</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>About</h5>
            <ul>
              <li><a href="/jobs">Jobs</a></li>
              <li><a href="/story">Story</a></li>
              <li><a href="/bulk-order">Wholesale</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/locations">Locations</a></li>
              <li><a href="/farmlevel">Farmlevel</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>Follow Us</h5>
            <ul className="social-links">
              <li><a href="https://www.facebook.com/flawlezcoffee" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://www.instagram.com/flawlezcoffee" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://www.twitter.com/flawlezcoffee" target="_blank" rel="noopener noreferrer">Twitter</a></li>
              <li><a href="https://www.linkedin.com/company/flawlezcoffee" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <div className="footer-links">
            <a href="/terms">Terms of Use</a>
            <a href="/accessibility">Accessibility Statement</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/privacy-opt-out">Do Not Sell or Share My Personal Information</a>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Coffee Collective. All rights reserved.</p>
          <address className="footer-address">104 Bronson St, Suite 19, Santa Cruz, CA 95062</address>
        </div>
      </div>
    </footer>
  );
}
