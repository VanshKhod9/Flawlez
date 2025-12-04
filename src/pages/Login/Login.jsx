import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api";
import { CartContext } from "../../context/Cartcontext";
import Navbar from "../../component/Navbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import "./Login.css";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(CartContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await login(usernameOrEmail, password);

      if (res.accessToken) {
        localStorage.setItem("token", res.accessToken);
        console.log("✅ Login successful, token stored:", res.accessToken.substring(0, 20) + "...");
        
        // Set login state - this will trigger cart loading
        setIsLoggedIn(true);
        
        setMessage("Login successful!");
        
        // Give cart time to load before navigating
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else {
        setMessage(res.message || "Invalid username or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Something went wrong. Please try again.");
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

      {/* Login Form Section */}
      <div className="login-container">
        <h2 className="login-title">Account Login</h2>

        <form onSubmit={handleLogin} className="login-form">
          <label className="login-label">EMAIL ADDRESS</label>
          <input
            type="text"
            className="login-input"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />

          <label className="login-label">PASSWORD</label>
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        {message && <p className="login-message">{message}</p>}

        <p className="login-link">
          Don’t have an account?{" "}
          <a href="/signup" className="login-signup-link">
            Sign Up
          </a>
        </p>
      </div>
      <Footer />
    </>
  );
}
