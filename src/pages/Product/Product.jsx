import React, { useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import { PRODUCTS } from "../../data/products";
import { CartContext } from "../../context/Cartcontext";
import "./Product.css";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const product = useMemo(() => PRODUCTS.find((p) => p.id === id), [id]);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("250g");
  const [grind, setGrind] = useState("Whole Bean");

  const parsePrice = (value) => {
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  if (!product) {
    return (
      <>
        <Navbar />
        <SubNavbar />
        <div className="product-page">
          <div className="product-container">
            <h2>Product not found</h2>
            <button className="product-back" onClick={() => navigate("/home")}>Back to shop</button>
          </div>
        </div>
      </>
    );
  }

  const base = parsePrice(product.price);
  const sizeMultiplier = size === "250g" ? 1 : size === "500g" ? 1.9 : 3.5;
  const unitPrice = (base * sizeMultiplier).toFixed(2);
  const total = (base * sizeMultiplier * quantity).toFixed(2);

  const buildItem = () => ({
    id: `${product.id}-${size}-${grind}`,
    name: product.name,
    description: `${product.description} • ${size} • ${grind}`,
    price: `₹${unitPrice}`,
    image: product.image,
    quantity,
  });

  const handleAdd = () => {
    addToCart(buildItem());
  };

  const handleBuyNow = () => {
    addToCart(buildItem());
    navigate("/checkout");
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={PRODUCTS} />
      <div className="product-page">
        <div className="product-container">
          <div className="product-left">
            <img src={product.image} alt={product.name} className="product-hero" />
            <div className="product-notes">
              {product.notes?.map((n) => (
                <span key={n} className="note-chip">{n}</span>
              ))}
            </div>
          </div>

          <div className="product-right">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-desc">{product.description}</p>

            <div className="product-options">
              <label>
                Size
                <select value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="250g">250g</option>
                  <option value="500g">500g</option>
                  <option value="1kg">1kg</option>
                </select>
              </label>
              <label>
                Grind
                <select value={grind} onChange={(e) => setGrind(e.target.value)}>
                  <option>Whole Bean</option>
                  <option>Espresso</option>
                  <option>Pour-over</option>
                  <option>French Press</option>
                </select>
              </label>
              <label>
                Quantity
                <div className="qty-row">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="qty-btn">−</button>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
                  <button onClick={() => setQuantity((q) => q + 1)} className="qty-btn">+</button>
                </div>
              </label>
            </div>

              <div className="product-buy">
                <div className="product-price">₹{total}</div>
              <button className="buy-btn" onClick={handleAdd}>Add to Cart</button>
              <button className="secondary-btn" onClick={handleBuyNow}>Buy Now</button>
              </div>

            <div className="product-meta">
              <div className="meta-item">Roast: Medium</div>
              <div className="meta-item">Origin: India & East Africa</div>
              <div className="meta-item">Process: Washed & Natural</div>
            </div>
          </div>
        </div>

        <div className="suggestions">
          <h3>You may also like</h3>
          <div className="suggest-grid">
            {PRODUCTS.filter((p) => p.id !== product.id).map((p) => (
              <div key={p.id} className="suggest-card" onClick={() => navigate(`/product/${p.id}`)}>
                <img src={p.image} alt={p.name} />
                <div className="suggest-name">{p.name}</div>
                <div className="suggest-price">{p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}