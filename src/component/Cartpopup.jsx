import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import "./CartPopup.css";

export default function CartPopup() {
  const { cart, removeFromCart, isCartOpen, toggleCart, updateQuantity, isLoggedIn } = useContext(CartContext);
  const navigate = useNavigate();

  const parsePrice = (value) => {
    const numericPrice = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(numericPrice) ? 0 : numericPrice;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      alert("Please login to proceed to checkout");
      navigate("/login");
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }
    toggleCart();
    navigate("/checkout");
  };

  return (
    <div className={`cart-popup ${isCartOpen ? "open" : ""}`}>
      <div className="cart-header">
        <h3>Your Cart</h3>
        <button onClick={toggleCart}>×</button>
      </div>

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty ☕</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item, i) => (
              <div className="cart-item" key={i}>
                <img src={item.image} alt={item.name} />
                <div>
                  <h4>{item.name}</h4>

                  {/* ✅ Quantity Counter added here */}
                  <div className="cart-quantity">
                    <button onClick={() => updateQuantity(i, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(i, item.quantity + 1)}>+</button>
                  </div>

                  <p>{item.price}</p>
                </div>
                <button onClick={() => removeFromCart(i)}>
                  <img src="/close.png" alt="⤫" className="removelogo" />
                </button>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <div className="cart-total">
              <strong>Total: ₹{calculateTotal().toFixed(2)}</strong>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
