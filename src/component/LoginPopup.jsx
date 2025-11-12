import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import "./LoginPopup.css";

export default function LoginPopup() {
  const { isLoginPopupOpen, setIsLoginPopupOpen } = useContext(CartContext);
  const navigate = useNavigate();

  if (!isLoginPopupOpen) return null;

  return (
    <div className="login-popup-overlay">
      <div className="login-popup">
        <button className="close-btn" onClick={() => setIsLoginPopupOpen(false)}>×</button>
        <h2>Login Required</h2>
        <p>Please log in to add items to your cart</p>
        <div className="login-popup-buttons">
          <button 
            className="login-btn"
            onClick={() => {
              setIsLoginPopupOpen(false);
              navigate("/login");
            }}
          >
            Login
          </button>
          <button 
            className="signup-btn"
            onClick={() => {
              setIsLoginPopupOpen(false);
              navigate("/signup");
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
