import React, { useState, useContext, useEffect } from "react";
import { CartContext } from "../context/Cartcontext";
import { getSubscriptionStatus, subscribeEmail } from "../api";
import "./EmailSubscriptionPopup.css";

export default function EmailSubscriptionPopup() {
  const { isLoggedIn } = useContext(CartContext);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsOpen(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const checkAndShowPopup = async () => {
      try {
        const status = await getSubscriptionStatus(token);
        
        // Only show if NOT subscribed
        if (!status.isSubscribed) {
          // Pre-fill email from username if it's an email
          try {
            const accountData = await getAccount(token);
            if (accountData.username?.includes("@")) {
              setEmail(accountData.username);
            }
          } catch (err) {
            // Ignore error
          }
          
          // Show popup after 2 seconds
          setTimeout(() => {
            if (localStorage.getItem("token")) {
              setIsOpen(true);
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Subscription check failed:", error);
      }
    };

    checkAndShowPopup();
  }, [isLoggedIn]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to subscribe");
        return;
      }

      const response = await subscribeEmail(token, email);
      
      if (response.success) {
        setSubmitted(true);
        
        // Close popup after showing success
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false); // Reset for next time
        }, 2000);
      } else {
        alert(response.message || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render if user is logged in and popup should be open
  if (!isLoggedIn || !isOpen) return null;

  return (
    <div className="email-popup-overlay" onClick={handleClose}>
      <div className="email-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="email-popup-close" onClick={handleClose}>×</button>
        
        {!submitted ? (
          <>
            <div className="email-popup-icon">☕</div>
            <h2>Stay Updated!</h2>
            <p>Get exclusive offers, new arrivals, and coffee tips delivered to your inbox.</p>
            <form onSubmit={handleSubmit} className="email-popup-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="email-popup-input"
              />
              <button type="submit" className="email-popup-submit" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            <p className="email-popup-note">We respect your privacy. Unsubscribe anytime.</p>
          </>
        ) : (
          <div className="email-popup-success">
            <div className="email-popup-icon">✓</div>
            <h2>Thank You!</h2>
            <p>You're all set! Check your inbox for our welcome email.</p>
          </div>
        )}
      </div>
    </div>
  );
}

