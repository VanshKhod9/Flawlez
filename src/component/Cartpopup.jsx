import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import "./CartPopup.css";

export default function CartPopup() {
  const {
    cart,
    removeFromCart,
    isCartOpen,
    toggleCart,
    updateQuantity,
    isLoggedIn,
    getItemKey,
    setIsLoginPopupOpen,
  } = useContext(CartContext);
  const navigate = useNavigate();

  const getCartImage = (item) => {
    const image = typeof item?.image === "string" ? item.image.trim() : "";
    return image || "/Flawlez5.png";
  };

  const parsePrice = (value) => {
    const numericPrice = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(numericPrice) ? 0 : numericPrice;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  };

  const cartItems = useMemo(() => {
    return cart.map((item, index) => {
      const key = getItemKey ? getItemKey(item) : null;
      const fallbackKey = `cart-item-${index}`;
      return {
        ...item,
        __key: key ?? fallbackKey,
      };
    });
  }, [cart, getItemKey]);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      toggleCart();
      setIsLoginPopupOpen(true);
      return;
    }
    if (cart.length === 0) {
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
            {cartItems.map((item, index) => (
              <div className="cart-item" key={item.__key ?? `cart-item-${index}`}>
                <img src={getCartImage(item)} alt={item.name} loading="lazy" />
                <div>
                  <h4>{item.name}</h4>

                  {/* ✅ Quantity Counter added here */}
                  <div className="cart-quantity">
                    <button onClick={() => updateQuantity(item.__key, Number(item.quantity) - 1)}>-</button>
                    <span>{Number(item.quantity)}</span>
                    <button onClick={() => updateQuantity(item.__key, Number(item.quantity) + 1)}>+</button>
                  </div>

                  <p>{item.price}</p>
                </div>
                <button onClick={() => removeFromCart(item.__key)}>
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
