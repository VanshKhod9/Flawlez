import React from "react";
import { useNavigate } from "react-router-dom";
import "./Subnavbar.css";

export default function SubNavbar() {
  const navigate = useNavigate();

  return (
    <div className="subnavbar-container">
      <button className="subnav-btn" onClick={() => navigate("/home")}>
        Shop
      </button>
      <button className="subnav-btn" onClick={() => navigate("/bulk-order")}>
        Bulk Order
      </button>
      <button className="subnav-btn" onClick={() => navigate("/story")}>
        Story
      </button>
    </div>
  );
}
