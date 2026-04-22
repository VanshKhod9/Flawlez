import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import "./Navbar.css";

export default function Navbar() {
  const { cart, toggleCart, isLoggedIn, setIsSearchOpen, currentUser } = useContext(CartContext);
  const navigate = useNavigate();

  const handleAccountClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      // Show account dropdown or navigate to account page
      navigate("/account");
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen((prev) => !prev);
  };

  return (
    <nav className="navbar-container">
      <Link to="/home" className="navbar-logo" aria-label="Go to home">
        <img src="/Flawlez5.png" alt="Flawlez Coffee" className="Login-logo" />
      </Link>

      <div className="navbar-icons">
        {currentUser?.isAdmin ? (
          <button className="navbar-admin-btn" onClick={() => navigate("/admin")}>
            Admin
          </button>
        ) : null}
        <button className="navbar-icon-btn" onClick={handleSearchClick} aria-label="Search products">
          <img src="/loupe.png" alt="" className="logoo" />
        </button>
        <button className="navbar-icon-btn" onClick={handleAccountClick} aria-label="Open account">
          <img src="/person.png" alt="" className="logoo" />
        </button>
        <button className="cart-icon-wrapper navbar-icon-btn" onClick={toggleCart} aria-label="Open cart">
          <img src="/online-shopping.png" alt="" className="logoo" />
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </button>
      </div>
    </nav>
  );
}
