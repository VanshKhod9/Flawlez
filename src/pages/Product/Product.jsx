import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import { CartContext } from "../../context/Cartcontext";
import { useProducts } from "../../context/ProductContext";
import { getProduct } from "../../api";
import "./Product.css";

const trustPoints = ["Secure payment", "Fresh roast dispatch", "Support from your account"];

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, getItemKey } = useContext(CartContext);
  const { products, loading, refreshProducts } = useProducts();
  const [product, setProduct] = useState(null);
  const [productError, setProductError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [grind, setGrind] = useState("Whole Bean");
  const [activeImage, setActiveImage] = useState("");
  const [pendingBuyNowKey, setPendingBuyNowKey] = useState("");
  const lastSelectionKeyRef = useRef("");

  const fallbackProduct = useMemo(
    () => products.find((item) => item.slug === id || String(item.id) === String(id)),
    [id, products]
  );

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      if (fallbackProduct) {
        setProduct(fallbackProduct);
      }

      try {
        const data = await getProduct(id);
        if (!active) return;
        setProduct(data.product);
        setProductError("");
      } catch (error) {
        if (!active) return;
        setProductError(error.message || "Unable to load product.");
      }
    };

    loadProduct();
    return () => {
      active = false;
    };
  }, [fallbackProduct, id]);

  useEffect(() => {
    if (products.length === 0 && !loading) {
      refreshProducts();
    }
  }, [loading, products.length, refreshProducts]);

  const currentProduct = product || fallbackProduct;
  const relatedProducts = useMemo(
    () => products.filter((item) => item.slug !== currentProduct?.slug).slice(0, 3),
    [currentProduct?.slug, products]
  );

  const currentProductId = currentProduct?.id ?? null;
  const currentProductStock = Number(currentProduct?.stock ?? 0);
  const grindKey = grind.replace(/\s+/g, "-").toLowerCase();
  const cartItemKey = currentProductId ? `${currentProductId}-${grindKey}` : null;
  const cartItem = cartItemKey ? cart.find((item) => getItemKey(item) === cartItemKey) || null : null;

  useEffect(() => {
    if (currentProduct) {
      setActiveImage(currentProduct.image);
    }
  }, [currentProduct]);

  useEffect(() => {
    if (!cartItemKey) {
      lastSelectionKeyRef.current = "";
      return;
    }

    if (lastSelectionKeyRef.current === cartItemKey) {
      return;
    }

    lastSelectionKeyRef.current = cartItemKey;
    const matchingItem = cart.find((item) => getItemKey(item) === cartItemKey);
    const initialQuantity = Number(matchingItem?.quantity || 0);
    setQuantity(initialQuantity > 0 ? initialQuantity : 1);
  }, [cart, cartItemKey, getItemKey]);

  useEffect(() => {
    if (!pendingBuyNowKey) {
      return;
    }

    const matchingItem = cart.find((item) => getItemKey(item) === pendingBuyNowKey);
    if (!matchingItem) {
      return;
    }

    setPendingBuyNowKey("");
    navigate("/checkout");
  }, [cart, getItemKey, navigate, pendingBuyNowKey]);

  const parsePrice = (value) => {
    const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  if (!currentProduct && loading) {
    return (
      <>
        <Navbar />
        <SubNavbar />
        <div className="product-page">
          <div className="product-container">
            <h2>Loading product...</h2>
          </div>
        </div>
      </>
    );
  }

  if (!currentProduct) {
    return (
      <>
        <Navbar />
        <SubNavbar />
        <div className="product-page">
          <div className="product-container">
            <h2>{productError || "Product not found"}</h2>
            <button className="product-back" onClick={() => navigate("/home")}>
              Back to shop
            </button>
          </div>
        </div>
      </>
    );
  }

  const base = parsePrice(currentProduct.priceValue ?? currentProduct.price);
  const displayWeight = currentProduct.weight || "";
  const unitPrice = base.toFixed(2);
  const gallery = currentProduct.gallery?.length ? currentProduct.gallery : [currentProduct.image];
  const isSoldOut = currentProduct.stock <= 0;
  const productDescription = currentProduct.shortDescription || currentProduct.description;
  const total = (base * quantity).toFixed(2);

  const buildItem = (nextQuantity = quantity) => ({
    id: cartItemKey,
    productId: currentProduct.id,
    slug: currentProduct.slug,
    name: currentProduct.name,
    description: [productDescription, displayWeight, grind].filter(Boolean).join(" • "),
    price: `₹${unitPrice}`,
    image: activeImage || currentProduct.image,
    quantity: nextQuantity,
    weight: displayWeight || null,
    selectedWeight: displayWeight || null,
    selectedGrind: grind,
    unitPrice,
  });

  const clampQuantity = (value) => {
    const stockLimit = Math.max(1, currentProductStock || 1);
    return Math.min(stockLimit, Math.max(1, Number(value) || 1));
  };

  const syncQuantity = (nextValue) => {
    const nextQuantity = clampQuantity(nextValue);
    setQuantity(nextQuantity);
  };

  const syncCartItem = () => {
    const nextQuantity = clampQuantity(quantity);

    if (cartItem) {
      updateQuantity(cartItemKey, nextQuantity);
      return;
    }

    addToCart(buildItem(nextQuantity));
  };

  const handleBuyNow = () => {
    if (!cartItemKey) {
      return;
    }

    setPendingBuyNowKey(cartItemKey);
    syncCartItem();
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={products} />
      <div className="product-page">
        <div className="product-container">
          <div className="product-left">
            <div className="product-hero-frame">
              <img src={activeImage || currentProduct.image} alt={currentProduct.name} className="product-hero" />
            </div>
            <div className="product-gallery-strip">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`gallery-thumb ${activeImage === image ? "active" : ""}`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={currentProduct.name} loading="lazy" />
                </button>
              ))}
            </div>
            <div className="product-notes">
              {(currentProduct.notes || []).map((note) => (
                <span key={note} className="note-chip">
                  {note}
                </span>
              ))}
            </div>
          </div>

          <div className="product-right">
            <span className="product-kicker">{currentProduct.tag || "Signature roast"}</span>
            <h1 className="product-title">{currentProduct.name}</h1>
            <p className="product-desc">{currentProduct.longDescription || currentProduct.description}</p>
            {displayWeight ? (
              <div className="product-pack-size">
                <span>Pack size</span>
                <strong>{displayWeight}</strong>
              </div>
            ) : null}

            <div className="product-trust">
              {trustPoints.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>

            <div className="product-options">
              <label>
                Grind
                <select value={grind} onChange={(event) => setGrind(event.target.value)}>
                  <option>Whole Bean</option>
                  <option>Espresso</option>
                  <option>Pour-over</option>
                  <option>French Press</option>
                </select>
              </label>
              <label>
                Quantity
                <div className="qty-row">
                  <button
                    type="button"
                    onClick={() => syncQuantity(quantity - 1)}
                    className="qty-btn"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, currentProductStock || 1)}
                    value={quantity}
                    onChange={(event) => syncQuantity(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => syncQuantity(quantity + 1)}
                    className="qty-btn"
                    disabled={quantity >= Math.max(1, currentProductStock || 1)}
                  >
                    +
                  </button>
                </div>
              </label>
            </div>

            <div className="product-buy">
              <div className="product-price-block">
                <span>Selected total</span>
                <div className="product-price">₹{total}</div>
              </div>
              <button className="buy-btn" onClick={syncCartItem} disabled={isSoldOut}>
                {isSoldOut ? "Sold Out" : cartItem ? "Update Cart" : "Add to Cart"}
              </button>
              <button className="secondary-btn" onClick={handleBuyNow} disabled={isSoldOut}>
                Buy Now
              </button>
            </div>

            <div className="stock-indicator">
              {isSoldOut ? "Currently unavailable" : `${currentProduct.stock} units in stock`}
            </div>

            <div className="product-benefits">
              {(currentProduct.benefits || []).map((benefit) => (
                <div key={benefit} className="benefit-pill">
                  {benefit}
                </div>
              ))}
            </div>

            <div className="product-meta">
              {displayWeight ? <div className="meta-item">Pack: {displayWeight}</div> : null}
              <div className="meta-item">Roast: {currentProduct.roast}</div>
              <div className="meta-item">Process: {currentProduct.process}</div>
            </div>
          </div>
        </div>

        <div className="sticky-buy-bar">
          <div>
            <strong>{currentProduct.name}</strong>
            <span>₹{total}</span>
          </div>
          <button onClick={syncCartItem} disabled={isSoldOut}>
            {isSoldOut ? "Sold Out" : cartItem ? "Update Cart" : "Add to Cart"}
          </button>
        </div>

        <div className="suggestions">
          <div className="suggestions-head">
            <span className="suggestions-kicker">More To Brew</span>
            <h3>You may also like</h3>
            <p>Explore a few more roasts from the current lineup without losing the same premium feel.</p>
          </div>
          <div className="suggest-grid">
            {relatedProducts.map((item) => (
              <button
                key={item.id || item.slug}
                type="button"
                className="suggest-card"
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                <div className="suggest-image-wrap">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <div className="suggest-copy">
                  {item.tag ? <span className="suggest-tag">{item.tag}</span> : null}
                  <div className="suggest-name">{item.name}</div>
                  <p className="suggest-description">{item.shortDescription || item.description}</p>
                  <div className="suggest-meta">
                    <span className="suggest-price">{item.price}</span>
                    {item.weight ? <span className="suggest-weight">{item.weight}</span> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
