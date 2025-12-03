import React, { useContext } from "react";
import { CartContext } from "../../context/Cartcontext";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import LoginPopup from "../../component/LoginPopup";
import Footer from "../../component/Footer";
import { PRODUCTS } from "../../data/products";
import "./Home.css";

export default function Home() {
  const { addToCart } = useContext(CartContext);

  const products = PRODUCTS;

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={products} />
      <LoginPopup />

      <div className="body-container">
        <div className="products-header">
          <h2>ALL COFFEE</h2>
        </div>

        <div className="product-grid">
          {products.map((p) => (
            <div className="product-card" key={p.id}>
              <div
                className="product-img"
                onClick={() => window.location.href = `/product/${p.id}`}
                style={{ cursor: "pointer" }}
              >
                {p.tag && <span className="product-tag">{p.tag}</span>}
                <img src={p.image} alt={p.name} />
              </div>
              <h3 onClick={() => window.location.href = `/product/${p.id}`} style={{ cursor: "pointer" }}>{p.name}</h3>
              <p className="product-desc">{p.description}</p>
              <p className="product-price">{p.price}</p>
              <button className="add-btn" onClick={() => addToCart(p)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
