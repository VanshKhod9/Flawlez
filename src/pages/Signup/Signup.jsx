import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, completeRegister } from "../../api";
import OTPWidget from "../../component/OTPWidget";
import Navbar from "../../component/Navbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import GoogleAuthButton from "../../component/GoogleAuthButton";
import { CartContext } from "../../context/Cartcontext";
import { useProducts } from "../../context/ProductContext";
import "../Auth/Auth.css";
import "./Signup.css";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [widgetPhone, setWidgetPhone] = useState("");
  const navigate = useNavigate();
  const { setSessionFromToken } = useContext(CartContext);
  const { products } = useProducts();

  const handlePhoneChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    if (phone.length !== 10) {
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+91${phone}`;
      const res = await register(username, password, fullPhone);
      if (res.success) {
        setWidgetPhone(res.phone);
        setStep(2);
      } else {
        setMessage(res.message || "Something went wrong.");
      }
    } catch (error) {
      setMessage(error.message || "Unable to start signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetSuccess = async (data) => {
    try {
      const res = await completeRegister(username, password, widgetPhone, data.message);
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

      <main className="auth-page signup-page">
        <section className="auth-shell">
          <div className="auth-intro">
            <span className="auth-kicker">Create your account</span>
            <h1>Join the Flawlez side of better coffee.</h1>
            <p>
              Save your address, revisit past orders, move through checkout quickly, and stay close
              to new releases and offers.
            </p>

            <div className="auth-benefits">
              <div>
                <strong>Quicker checkout</strong>
                <span>Save details once and order faster the next time.</span>
              </div>
              <div>
                <strong>Order tracking</strong>
                <span>See your payment and delivery progress in one place.</span>
              </div>
              <div>
                <strong>Launch perks</strong>
                <span>Get early access to drops, offers, and featured roasts.</span>
              </div>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-card-head">
              <span className="auth-step">{step === 1 ? "Step 1 of 2" : "Step 2 of 2"}</span>
              <h2>Sign Up</h2>
              <p>
                {step === 1
                  ? "Create your details first, then verify your phone number."
                  : "Complete OTP verification to activate your account."}
              </p>
            </div>

            {step === 1 ? (
              <>
                <GoogleAuthButton
                  buttonText="continue_with"
                  dividerLabel="or continue with"
                  onAuthSuccess={handleGoogleSuccess}
                />

                <form onSubmit={handleRegister} className="auth-form">
                  <label className="auth-label">
                    Username
                    <input
                      type="text"
                      className="auth-input"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Choose a username"
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="auth-label">
                    Phone Number
                    <div className="auth-phone-group">
                      <span className="auth-phone-prefix">+91</span>
                      <input
                        type="tel"
                        className="auth-input auth-phone-input"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="Enter 10-digit mobile number"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        required
                        disabled={loading}
                      />
                    </div>
                  </label>

                  <label className="auth-label">
                    Password
                    <input
                      type="password"
                      className="auth-input"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a strong password"
                      required
                      disabled={loading}
                    />
                  </label>

                  {message ? <p className="auth-message error">{message}</p> : null}

                  <button type="submit" className="auth-primary-btn" disabled={loading}>
                    {loading ? "Creating..." : "Continue to OTP"}
                  </button>

                  <p className="auth-link-row">
                    Already have an account? <Link to="/login">Log in</Link>
                  </p>
                </form>
              </>
            ) : (
              <div className="auth-otp-panel">
                <div className="auth-otp-copy">
                  <p>We’re verifying {widgetPhone} to complete your account setup.</p>
                </div>
                <OTPWidget
                  identifier={widgetPhone}
                  onSuccess={handleWidgetSuccess}
                  onFailure={handleWidgetFailure}
                />
                {message ? <p className="auth-message error">{message}</p> : null}
                <button className="auth-secondary-btn" onClick={() => { setStep(1); setMessage(""); }}>
                  Back to signup
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
