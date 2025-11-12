import React, { useContext } from "react";
import { CartContext } from "../../context/Cartcontext";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import LoginPopup from "../../component/LoginPopup";
import Footer from "../../component/Footer";
import "./Home.css";

export default function Home() {
  const { addToCart } = useContext(CartContext);

  const products = [
    {
      id: "sermon",
      name: "SERMON",
      tag: "MOST POPULAR",
      description: "FRUITY & DECADENT · MEDIUM ROAST",
      price: "₹550.00",
      image: "/12-Photoroom.png",
    },
    {
      id: "streetlevel",
      name: "STREETLEVEL",
      tag: "",
      description: "SWEET & BALANCED · MEDIUM ROAST",
      price: "₹520.00",
      image: "/21-Photoroom.png",
    },
    {
      id: "aster",
      name: "ASTER",
      tag: "STAFF PICK",
      description: "VIBRANT & COMPLEX · MEDIUM ROAST",
      price: "₹540.00",
      image: "/12-Photoroom.png",
    },
  ];

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
              <div className="product-img">
                {p.tag && <span className="product-tag">{p.tag}</span>}
                <img src={p.image} alt={p.name} />
              </div>
              <h3>{p.name}</h3>
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
