import React from "react";
import { useNavigate } from "react-router-dom";
import "./Subnavbar.css";

export default function SubNavbar() {
  const navigate = useNavigate();

  return (
    <div className="subnavbar-container">
      <div className="subnav-center-group">
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
      <button className="subnav-btn subnav-btn-right" onClick={() => navigate("/quiz")}>
        Quiz
      </button>
    </div>
  );
}
