import { useState } from "react";
import { register } from "../../api";
import { useNavigate } from "react-router-dom";
import Navbar from "../../component/Navbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import "./Signup.css";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await register(username, password);
    setMessage(res.message || "Registered!");
    if (res.message === "User registered successfully") {
      setTimeout(() => navigate("/login"), 1000);
    }
  };

  return (
    <>
      {/* Global Components */}
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay
        products={[
          {
            name: "SERMON",
            description: "FRUITY & DECADENT · MEDIUM ROAST",
            price: "$22.00",
            image: "/sermon.png",
          },
          {
            name: "STREETLEVEL",
            description: "SWEET & BALANCED · MEDIUM ROAST",
            price: "$22.00",
            image: "/streetlevel.png",
          },
          {
            name: "ASTER",
            description: "VIBRANT & COMPLEX · MEDIUM ROAST",
            price: "$22.00",
            image: "/aster.png",
          },
        ]}
      />

      {/* Signup Form Section */}
      <div className="signup-container">
        <h2 className="signup-title">Create Account</h2>

        <form onSubmit={handleRegister} className="signup-form">
          <label className="signup-label">EMAIL ADDRESS</label>
          <input
            type="text"
            className="signup-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label className="signup-label">PASSWORD</label>
          <input
            type="password"
            className="signup-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>

        {message && <p className="signup-message">{message}</p>}

        <p className="signup-link">
          Already have an account?{" "}
          <a href="/login" className="signup-login-link">
            Log In
          </a>
        </p>
      </div>
      <Footer />
    </>
  );
}
