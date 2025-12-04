import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import "./SearchOverlay.css";

export default function SearchOverlay({ products }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const { isSearchOpen, setIsSearchOpen } = useContext(CartContext);
  const navigate = useNavigate();

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
                        p.description.toLowerCase().includes(query.toLowerCase());
    
    if (filter === "all") return matchesQuery;
    if (filter === "popular") return matchesQuery && p.tag === "MOST POPULAR";
    if (filter === "staff-pick") return matchesQuery && p.tag === "STAFF PICK";
    if (filter === "medium") return matchesQuery && p.description.includes("MEDIUM ROAST");
    
    return matchesQuery;
  });

  const handleProductClick = (productId) => {
    setIsSearchOpen(false);
    navigate(`/product/${productId}`);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search coffee..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button onClick={() => setIsSearchOpen(false)}>✕</button>
      </div>

      <div className="search-filters">
        <button 
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button 
          className={filter === "popular" ? "active" : ""}
          onClick={() => setFilter("popular")}
        >
          Popular
        </button>
        <button 
          className={filter === "staff-pick" ? "active" : ""}
          onClick={() => setFilter("staff-pick")}
        >
          Staff Pick
        </button>
        <button 
          className={filter === "medium" ? "active" : ""}
          onClick={() => setFilter("medium")}
        >
          Medium Roast
        </button>
      </div>

      <div className="search-results">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div 
              className="search-item" 
              key={p.id || p.name}
              onClick={() => handleProductClick(p.id)}
            >
              <img src={p.image} alt={p.name} />
              <div>
                <h4>{p.name}</h4>
                <p>{p.description}</p>
                <span>{p.price}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No results found</p>
        )}
      </div>
    </div>
  );
}
