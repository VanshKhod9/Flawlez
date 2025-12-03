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

    // Check subscription status when user logs in
    const checkSubscription = async () => {
      // Only proceed if user is logged in
      if (!isLoggedIn) {
        console.log("🔔 EmailPopup: User not logged in, not showing popup");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("🔔 EmailPopup: No token found, not showing popup");
        return;
      }

      try {
        console.log("🔔 EmailPopup: User is logged in, checking subscription status...");
        
        const status = await getSubscriptionStatus(token);
        console.log("🔔 EmailPopup: Subscription status:", status);
        
        // Only show popup if user is logged in AND never subscribed
        if (status.subscribed === false) {
          console.log("🔔 EmailPopup: User is logged in and NOT subscribed - will show popup");
          
          // Pre-fill email from account if available
          try {
            const { getAccount } = await import("../api");
            const accountData = await getAccount(token);
            if (accountData.user?.username) {
              // Use username as email if it looks like an email
              const username = accountData.user.username;
              if (username.includes("@")) {
                setEmail(username);
                console.log("🔔 EmailPopup: Pre-filled email:", username);
              }
            }
          } catch (err) {
            // Ignore error, just don't pre-fill
            console.log("🔔 EmailPopup: Could not pre-fill email:", err);
          }
          
          // Show popup after 2 seconds
          const timer = setTimeout(() => {
            // Double-check user is still logged in before showing
            const currentToken = localStorage.getItem("token");
            const stillLoggedIn = !!currentToken;
            
            if (stillLoggedIn) {
              console.log("🔔 EmailPopup: Opening popup now!");
              setIsOpen(true);
            } else {
              console.log("🔔 EmailPopup: User logged out, not showing popup");
            }
          }, 2000);
          
          return () => clearTimeout(timer);
        } else {
          // User is already subscribed, don't show popup
          console.log("🔔 EmailPopup: User already subscribed:", status.email, "- NOT showing popup");
          setIsOpen(false);
        }
      } catch (error) {
        console.error("🔔 EmailPopup: Error checking subscription status:", error);
        // On error, don't show popup - safer approach
        // Only show if we're 100% sure user is not subscribed
        console.log("🔔 EmailPopup: Error occurred, NOT showing popup to be safe");
        setIsOpen(false);
      }
    };

    checkSubscription();
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
        console.log("Successfully subscribed:", email);
        
        setTimeout(() => {
          setIsOpen(false);
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

