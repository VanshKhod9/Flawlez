import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import "./Navbar.css";

export default function Navbar() {
  const { cart, toggleCart, isLoggedIn, setIsSearchOpen } = useContext(CartContext);
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
      <div className="navbar-logo">
        <img src="/Flawlez5.png" alt="Logo" className="Login-logo" />
      </div>

      <div className="navbar-icons">
        <img src="/loupe.png" alt="search" className="logoo" onClick={handleSearchClick} />
        <img src="/person.png" alt="account" className="logoo" onClick={handleAccountClick} />
        <div className="cart-icon-wrapper" onClick={toggleCart}>
          <img src="/online-shopping.png" alt="cart" className="logoo" />
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </div>
      </div>
    </nav>
  );
}
