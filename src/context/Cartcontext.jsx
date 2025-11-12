import React, { createContext, useState, useEffect, useCallback } from "react";
import { saveCart, getCart } from "../api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);

  const getItemKey = useCallback((item) => item?.id || item?.name, []);

  const loadCartFromServer = useCallback(async (token) => {
    try {
      const response = await getCart(token);
      if (response.cart && Array.isArray(response.cart)) {
        const cleanedCart = response.cart.map((item) => ({
          ...item,
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        }));
        setCart(cleanedCart);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }, []);

  const saveCartToServer = useCallback(async (token, cartItems) => {
    try {
      await saveCart(token, cartItems);
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  }, []);

  const syncCartFromServer = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await loadCartFromServer(token);
    }
  }, [loadCartFromServer]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (token && loggedIn) {
      loadCartFromServer(token);
    } else {
      setCart([]);
    }
  }, [loadCartFromServer]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const timeoutId = setTimeout(() => {
      saveCartToServer(token, cart);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cart, isLoggedIn, saveCartToServer]);

  // ✅ Add to cart — handles duplicates by increasing quantity
  const addToCart = (product) => {
    if (!isLoggedIn) {
      setIsLoginPopupOpen(true);
      return;
    }
    setCart((prev) => {
      const productKey = getItemKey(product);
      const exists = prev.some((item) => getItemKey(item) === productKey);
      if (exists) {
        return prev.map((item) =>
          getItemKey(item) === productKey
            ? {
                ...item,
                quantity: Number(item.quantity) > 0 ? Number(item.quantity) + 1 : 1,
              }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ✅ Remove item entirely
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Update quantity function for +/–
  const updateQuantity = (index, newQty) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      if (newQty <= 0) {
        updated.splice(index, 1); // remove item if quantity hits 0
      } else {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setCart([]); // Clear cart on logout
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        isCartOpen,
        toggleCart,
        isLoggedIn,
        setIsLoggedIn,
        logout,
        isSearchOpen,
        setIsSearchOpen,
        clearCart,
        syncCartFromServer,
        isLoginPopupOpen,
        setIsLoginPopupOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
