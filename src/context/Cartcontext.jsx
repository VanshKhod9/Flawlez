import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { saveCart, getCart } from "../api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const justLoadedCartRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedCartRef = useRef("");

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

  const loadCartFromServer = useCallback(async (token) => {
    if (!token) {
      console.warn("⚠️ No token provided to loadCartFromServer");
      return;
    }
    
    // Prevent multiple simultaneous loads
    if (isLoadingCart) {
      console.log("⏳ Cart is already loading, skipping...");
      return;
    }
    
    try {
      setIsLoadingCart(true);
      console.log("🔄 Loading cart from server with token:", token.substring(0, 20) + "...");
      const response = await getCart(token);
      console.log("📦 Full cart response:", JSON.stringify(response, null, 2));
      
      // Handle the response - check if cart exists and is an array
      if (response && response.cart !== undefined && response.cart !== null) {
        if (Array.isArray(response.cart)) {
          if (response.cart.length > 0) {
            // Clean and validate cart items
            const cleanedCart = response.cart
              .filter((item) => item && (item.name || item.id)) // Filter out invalid items
              .map((item) => ({
                ...item,
                quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
                // Ensure all required fields exist
                name: item.name || item.id || "Unknown Item",
                price: item.price || "$0.00",
                image: item.image || "/placeholder.png",
              }));
            
            console.log("✅ Cart loaded successfully:", cleanedCart.length, "items");
            console.log("📦 Cart items:", JSON.stringify(cleanedCart, null, 2));
            
            if (cleanedCart.length > 0) {
              justLoadedCartRef.current = true;
              
              // Force state update with a function to ensure it works
              setCart((prevCart) => {
                console.log("🔄 Setting cart state. Previous cart length:", prevCart.length);
                console.log("🔄 New cart length:", cleanedCart.length);
                console.log("🔄 New cart items:", cleanedCart);
                return cleanedCart;
              });
              lastSavedCartRef.current = JSON.stringify(cleanedCart);
              
              // Verify the cart was set after a short delay
              setTimeout(() => {
                console.log("🔍 Verifying cart was set - checking state...");
              }, 200);
              
              // Reset flag after a delay
              setTimeout(() => {
                justLoadedCartRef.current = false;
              }, 2000);
            } else {
              console.warn("⚠️ All cart items were filtered out - cart is empty");
              setCart([]);
              lastSavedCartRef.current = JSON.stringify([]);
            }
          } else {
            console.log("ℹ️ Cart is empty array in database");
            setCart([]);
            lastSavedCartRef.current = JSON.stringify([]);
          }
        } else {
          console.warn("⚠️ Cart is not an array:", typeof response.cart, response.cart);
          setCart([]);
          lastSavedCartRef.current = JSON.stringify([]);
        }
      } else {
        console.warn("⚠️ No cart in response or cart is null. Response:", response);
        setCart([]);
        lastSavedCartRef.current = JSON.stringify([]);
      }
    } catch (error) {
      console.error("❌ Error loading cart:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      // Don't clear cart on error, keep what we have
    } finally {
      setIsLoadingCart(false);
    }
  }, [isLoadingCart]);

  const saveCartToServer = useCallback(async (token, cartItems) => {
    try {
      console.log("💾 Saving cart to server:", cartItems.length, "items");
      await saveCart(token, cartItems);
      console.log("✅ Cart saved successfully");
    } catch (error) {
      console.error("❌ Error saving cart:", error);
    }
  }, []);

  const syncCartFromServer = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("🔄 Syncing cart from server...");
      await loadCartFromServer(token);
    } else {
      console.warn("⚠️ No token available for cart sync");
    }
  }, [loadCartFromServer]);

  // Check login status and load cart on mount and when token changes
  useEffect(() => {
    const checkAuthAndLoadCart = () => {
      const token = localStorage.getItem("token");
      const loggedIn = !!token;
      
      // Update login state
      setIsLoggedIn(loggedIn);
      
      if (token && loggedIn) {
        // User is logged in - load cart from server
        console.log("🚀 Loading cart for logged in user");
        loadCartFromServer(token);
      } else {
        // User is not logged in - clear cart locally only
        console.log("🚀 No token - clearing local cart");
        setCart([]);
        lastSavedCartRef.current = JSON.stringify([]);
      }
    };
    
    // Check immediately
    checkAuthAndLoadCart();
    
    // Also listen for storage changes (when token is set/removed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuthAndLoadCart();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Reload cart when login state changes from false to true
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem("token");
      if (token) {
        console.log("🔐 Login state changed to true - loading cart...");
        // Small delay to ensure state is updated
        const timer = setTimeout(() => {
          loadCartFromServer(token);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      // User logged out - clear cart
      console.log("🔐 Login state changed to false - clearing cart");
      setCart([]);
      lastSavedCartRef.current = JSON.stringify([]);
    }
  }, [isLoggedIn, loadCartFromServer]);

  useEffect(() => {
    if (!isLoggedIn || isLoadingCart) return; // Don't save while loading
    if (justLoadedCartRef.current) return; // Don't save right after loading
    const token = localStorage.getItem("token");
    if (!token) return;

    const serializedCart = JSON.stringify(cart);
    if (lastSavedCartRef.current === serializedCart) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const activeToken = localStorage.getItem("token");
      if (!activeToken || !isLoggedIn || justLoadedCartRef.current) return;

      saveCartToServer(activeToken, cart)
        .then(() => {
          lastSavedCartRef.current = serializedCart;
        })
        .catch((error) => {
          console.error("❌ Delayed cart save error:", error);
        })
        .finally(() => {
          saveTimeoutRef.current = null;
        });
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [cart, isLoggedIn, isLoadingCart, saveCartToServer]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Add to cart — handles duplicates by increasing quantity
  const addToCart = (product) => {
    if (!isLoggedIn) {
      setIsLoginPopupOpen(true);
      return;
    }
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
    // Save cart to server before logging out (if logged in and cart has items)
    const token = localStorage.getItem("token");
    if (token && cart.length > 0) {
      try {
        console.log("💾 Saving cart before logout...");
        await saveCartToServer(token, cart);
        console.log("✅ Cart saved before logout");
      } catch (error) {
        console.error("❌ Error saving cart before logout:", error);
      }
    } else {
      console.log("ℹ️ No cart to save before logout (empty or no token)");
    }
    
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setCart([]); // Clear cart locally for UI, but it's saved in database
  lastSavedCartRef.current = JSON.stringify([]);
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
