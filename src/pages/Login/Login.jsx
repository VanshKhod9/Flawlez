import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, completeLogin } from "../../api";
import { CartContext } from "../../context/Cartcontext";
import { useProducts } from "../../context/ProductContext";
import OTPWidget from "../../component/OTPWidget";
import Navbar from "../../component/Navbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import GoogleAuthButton from "../../component/GoogleAuthButton";
import "../Auth/Auth.css";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [widgetPhone, setWidgetPhone] = useState("");
  const navigate = useNavigate();
  const { setSessionFromToken } = useContext(CartContext);
  const { products } = useProducts();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        setWidgetPhone(res.phone);
        setStep(2);
      } else {
        setMessage(res.message || "Invalid credentials.");
      }
    } catch (error) {
      setMessage(error.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetSuccess = async (data) => {
    try {
      const res = await completeLogin(username, data.message);
      if (res.success) {
        setSessionFromToken(res.accessToken);
        navigate(res.user?.isAdmin ? "/admin" : "/home");
      } else {
        setMessage(res.message || "Verification failed.");
        setStep(1);
      }
    } catch (error) {
      setMessage(error.message || "Verification failed.");
      setStep(1);
    }
  };

  const handleWidgetFailure = (error) => {
    setMessage(error?.message || "OTP verification failed. Please try again.");
    setStep(1);
  };

  const handleGoogleSuccess = async (response) => {
    setSessionFromToken(response.accessToken);
    navigate(response.user?.isAdmin ? "/admin" : "/home");
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={products} />

      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-intro">
            <span className="auth-kicker">Flawlez account</span>
            <h1>Welcome back to a cleaner coffee routine.</h1>
            <p>
              Track orders, save addresses, move through checkout faster, and keep your favorite
              coffees one step away.
            </p>

            <div className="auth-benefits">
              <div>
                <strong>Fast reorders</strong>
                <span>Pick up where you left off without friction.</span>
              </div>
              <div>
                <strong>Secure verification</strong>
                <span>Password plus OTP keeps access trusted and simple.</span>
              </div>
              <div>
                <strong>Order visibility</strong>
                <span>Review payment and shipment details from one place.</span>
              </div>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-card-head">
              <span className="auth-step">{step === 1 ? "Step 1 of 2" : "Step 2 of 2"}</span>
              <h2>Log In</h2>
              <p>
                {step === 1
                  ? "Enter your account details to continue."
                  : "Verify your phone number to finish signing in."}
              </p>
            </div>

            {step === 1 ? (
              <>
                <GoogleAuthButton
                  buttonText="signin_with"
                  dividerLabel="or continue with"
                  onAuthSuccess={handleGoogleSuccess}
                />

                <form onSubmit={handleLogin} className="auth-form">
                  <label className="auth-label">
                    Username
                    <input
                      type="text"
                      className="auth-input"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Enter your username"
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="auth-label">
                    Password
                    <input
                      type="password"
                      className="auth-input"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                  </label>

                  {message ? <p className="auth-message error">{message}</p> : null}

                  <button type="submit" className="auth-primary-btn" disabled={loading}>
                    {loading ? "Checking..." : "Continue to OTP"}
                  </button>

                  <p className="auth-link-row">
                    New to Flawlez? <Link to="/signup">Create your account</Link>
                  </p>
                </form>
              </>
            ) : (
              <div className="auth-otp-panel">
                <div className="auth-otp-copy">
                  <p>We’ve sent verification access to {widgetPhone}.</p>
                </div>
                <OTPWidget
                  identifier={widgetPhone}
                  onSuccess={handleWidgetSuccess}
                  onFailure={handleWidgetFailure}
                />
                {message ? <p className="auth-message error">{message}</p> : null}
                <button className="auth-secondary-btn" onClick={() => { setStep(1); setMessage(""); }}>
                  Back to login
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
