/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from "react";
import { getStoredSession, parseJwt } from "../utils/session";

export const CartContext = createContext();

const CART_STORAGE_KEY = "flawlez-cart";

export const CartProvider = ({ children }) => {
  const initialSession = typeof window !== "undefined" ? getStoredSession() : { token: null, user: null };
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentUser, setCurrentUser] = useState(initialSession.user);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialSession.token));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);

  const getItemKey = (item) => {
    if (!item) return null;

    const key =
      item.id ??
      item.productId ??
      item.slug ??
      item.sku ??
      item.variantId ??
      (typeof item.name === "string" && item.name.trim() ? item.name : null);

    return key != null ? String(key) : null;
  };

  const setSessionFromToken = (token) => {
    if (!token) {
      localStorage.removeItem("token");
      setCurrentUser(null);
      setIsLoggedIn(false);
      return;
    }

    localStorage.setItem("token", token);
    setCurrentUser(parseJwt(token));
    setIsLoggedIn(true);
  };

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const productKey = getItemKey(product);
      const index = prev.findIndex((item) => getItemKey(item) === productKey);

      if (index >= 0) {
        return prev.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                quantity: Number(item.quantity) > 0 ? Number(item.quantity) + 1 : 1,
              }
            : item
        );
      }

      return [...prev, { ...product, quantity: Number(product.quantity) > 0 ? Number(product.quantity) : 1 }];
    });
  };

  const removeFromCart = (itemKey) => {
    if (!itemKey) return;

    setCart((prev) => prev.filter((item) => getItemKey(item) !== itemKey));
  };

  const updateQuantity = (itemKey, newQty) => {
    const normalizedQty = Number(newQty);
    if (Number.isNaN(normalizedQty)) return;

    setCart((prevCart) => {
      if (normalizedQty <= 0) {
        return prevCart.filter((item) => getItemKey(item) !== itemKey);
      }

      return prevCart.map((item) =>
        getItemKey(item) === itemKey ? { ...item, quantity: normalizedQty } : item
      );
    });
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsLoggedIn(false);
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
        currentUser,
        setSessionFromToken,
        logout,
        isSearchOpen,
        setIsSearchOpen,
        clearCart,
        isLoginPopupOpen,
        setIsLoginPopupOpen,
        getItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
