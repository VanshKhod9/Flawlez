import React, { useState, useContext } from "react";
import { CartContext } from "../context/Cartcontext";
import "./SearchOverlay.css";

export default function SearchOverlay({ products }) {
  const [query, setQuery] = useState("");
  const { isSearchOpen, setIsSearchOpen } = useContext(CartContext);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

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

      <div className="search-results">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div className="search-item" key={p.id || p.name}>
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
