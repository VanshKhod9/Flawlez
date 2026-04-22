import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/Cartcontext";
import { useProducts } from "../../context/ProductContext";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import LoginPopup from "../../component/LoginPopup";
import Footer from "../../component/Footer";
import "./Home.css";

const brandPoints = [
  "Fresh roast dispatch",
  "Balanced premium blends",
  "Secure checkout with Razorpay",
];

const editorialNotes = [
  {
    title: "Minimal, not empty",
    copy: "Everything a first-time buyer needs is visible quickly, without noisy ecommerce clutter.",
  },
  {
    title: "Built for repeat orders",
    copy: "Saved account details, cleaner product pages, and simpler cart flow reduce checkout hesitation.",
  },
  {
    title: "Premium but grounded",
    copy: "Warm tones, restrained motion, and stronger spacing make the brand feel considered and trustworthy.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { products, loading, error } = useProducts();
  const [filter, setFilter] = useState("all");

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured).slice(0, 3),
    [products]
  );

  const visibleProducts = useMemo(() => {
    if (filter === "featured") {
      return products.filter((product) => product.featured);
    }

    if (filter === "popular") {
      return products.filter((product) => product.tag === "MOST POPULAR");
    }

    if (filter === "fresh") {
      return products.filter((product) => product.stock > 0);
    }

    return products;
  }, [filter, products]);

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={products} />
      <LoginPopup />

      <main className="home-page">
        <section className="home-announcement">
          {brandPoints.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </section>

        <section className="hero-shell">
          <div className="hero-copy">
            <span className="hero-eyebrow">Flawlez Coffee</span>
            <h1>Specialty coffee, presented with more calm and bought with less friction.</h1>
            <p>
              A cleaner store for modern coffee buyers: premium roasts, stronger product storytelling,
              and a faster path from browse to checkout.
            </p>

            <div className="hero-actions">
              <button
                className="primary-cta"
                onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
              >
                Shop Coffee
              </button>
              <button className="secondary-cta" onClick={() => navigate("/story")}>
                Read Our Story
              </button>
            </div>
          </div>

          <div className="hero-stack">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <button
                  key={product.id}
                  className="hero-product-card"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <div>
                    <span>{product.tag || "Signature roast"}</span>
                    <strong>{product.name}</strong>
                    <p>{product.description}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="hero-empty-state">
                <span>Curated lineup</span>
                <strong>Products will appear here once your featured catalogue is live.</strong>
                <p>
                  You can manage which coffees appear in this area from the admin panel whenever
                  you update featured stock.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="home-section editorial-band">
          {editorialNotes.map((item) => (
            <article key={item.title} className="editorial-card">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </section>

        <section className="home-section catalog-section" id="catalog">
          <div className="section-head">
            <div>
              <span className="section-kicker">Shop</span>
              <h2>Current coffee lineup</h2>
            </div>

            <div className="catalog-filters">
              {[
                ["all", "All"],
                ["featured", "Featured"],
                ["popular", "Popular"],
                ["fresh", "In Stock"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? "active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? <div className="catalog-state">Loading products...</div> : null}
          {!loading && error ? <div className="catalog-state error">{error}</div> : null}
          {!loading && !error && visibleProducts.length === 0 ? (
            <div className="catalog-state">No products are available in this view yet.</div>
          ) : null}

          {!loading && !error ? (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <article className="product-card" key={product.id || product.slug}>
                  <button className="product-image-wrap" onClick={() => navigate(`/product/${product.slug}`)}>
                    {product.tag ? <span className="product-tag">{product.tag}</span> : null}
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </button>

                  <div className="product-copy">
                    <button className="product-link" onClick={() => navigate(`/product/${product.slug}`)}>
                      {product.name}
                    </button>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-meta-row">
                      <span className="product-price">{product.price}</span>
                      <span className={`product-meta ${product.stock <= 5 ? "low-stock" : ""}`}>
                        {product.stock <= 0
                          ? "Sold out"
                          : product.stock <= 5
                            ? `${product.stock} left`
                            : product.origin}
                      </span>
                    </div>
                  </div>

                  <button className="add-btn" onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                    {product.stock > 0 ? "Add to Cart" : "Sold Out"}
                  </button>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
