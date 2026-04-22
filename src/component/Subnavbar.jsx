import React from "react";
import { useNavigate } from "react-router-dom";
import "./Subnavbar.css";

const navItems = [
  { label: "Shop", mobileLabel: "Shop", path: "/home" },
  { label: "Bulk Order", mobileLabel: "Bulk", path: "/bulk-order" },
  { label: "Story", mobileLabel: "Story", path: "/story" },
  { label: "Quiz", mobileLabel: "Quiz", path: "/quiz" },
];

export default function SubNavbar() {
  const navigate = useNavigate();

  return (
    <div className="subnavbar-container">
      <div className="subnav-center-group">
        {navItems.map((item) => (
          <button key={item.path} className="subnav-btn" onClick={() => navigate(item.path)}>
            <span className="subnav-label-full">{item.label}</span>
            <span className="subnav-label-mobile">{item.mobileLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
