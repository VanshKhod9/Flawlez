import React, { createContext, useState, useEffect, useCallback } from "react";

export const CartContext = createContext(); 

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);


  const getItemKey = useCallback((item) => {
    if (!item) return null;
    const key =
      item.id ??
      item.productId ??
      item.sku ??
      item.variantId ??
      (typeof item.name === "string" && item.name.trim() ? item.name : null);
    return key != null ? String(key) : null;
  }, []);

  const findItemIndexByKey = useCallback(
    (itemKey, items) => {
      if (!itemKey) return -1;
      return items.findIndex((item) => getItemKey(item) === itemKey);
    },
    [getItemKey]
  );

  

  const syncCartFromServer = useCallback(async () => {}, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {}, [isLoggedIn]);

  

  

  // ✅ Add to cart — handles duplicates by increasing quantity
  const addToCart = (product) => {
    setCart((prev) => {
      const productKey = getItemKey(product);
      const index = productKey ? findItemIndexByKey(productKey, prev) : -1;
      let newCart;
      if (index >= 0) {
        newCart = prev.map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: Number(item.quantity) > 0 ? Number(item.quantity) + 1 : 1,
              }
            : item
        );
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      
      return newCart;
    });
  };

  // ✅ Remove item entirely
  const removeFromCart = (itemKey) => {
    if (!itemKey) return;
    setCart((prev) => {
      const index = findItemIndexByKey(itemKey, prev);
      if (index === -1) return prev;
      const newCart = [...prev.slice(0, index), ...prev.slice(index + 1)];
      return newCart;
    });
  };

  // ✅ Update quantity function for +/–
  const updateQuantity = (itemKey, newQty) => {
    const normalizedQty = Number(newQty);
    if (Number.isNaN(normalizedQty)) return;
    setCart((prevCart) => {
      const index = findItemIndexByKey(itemKey, prevCart);
      if (index === -1) return prevCart;
      if (normalizedQty <= 0) {
        return [...prevCart.slice(0, index), ...prevCart.slice(index + 1)];
      }

      const updatedCart = [...prevCart];
      updatedCart[index] = { ...updatedCart[index], quantity: normalizedQty };
      return updatedCart;
    });
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const logout = async () => {
    localStorage.removeItem("token");
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
        logout,
        isSearchOpen,
        setIsSearchOpen,
        clearCart,
        syncCartFromServer,
        isLoginPopupOpen,
        setIsLoginPopupOpen,
        getItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
