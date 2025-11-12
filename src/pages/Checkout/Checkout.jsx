import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/Cartcontext";
import { createCheckoutSession, verifyPayment } from "../../api";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import "./Checkout.css";

export default function Checkout() {
  const { cart, isLoggedIn } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [razorpayError, setRazorpayError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (cart.length === 0) {
      navigate("/home");
      return;
    }
  }, [isLoggedIn, cart, navigate]);

  useEffect(() => {
    if (window.Razorpay) {
      setIsRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setIsRazorpayReady(true);
      setRazorpayError("");
    };
    script.onerror = () => {
      setRazorpayError("Payment gateway failed to load. Please refresh and try again.");
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const parsePrice = (value) => {
    const numericPrice = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(numericPrice) ? 0 : numericPrice;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parsePrice(item.price);
      return total + price * item.quantity;
    }, 0);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const checkoutData = {
        ...formData,
        cart,
        total: calculateTotal(),
      };

      const response = await createCheckoutSession(token, checkoutData);

      if (!response.success) {
        alert(response.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (response.mode === "simulation") {
        navigate(`/checkout-success?orderId=${response.orderId}`);
        setLoading(false);
        return;
      }

      if (!isRazorpayReady) {
        alert(razorpayError || "Payment gateway is still loading. Please try again in a moment.");
        setLoading(false);
        return;
      }

      const options = {
        key: response.keyId,
        amount: response.razorpayOrder.amount,
        currency: response.currency,
        name: "Coffee Collective",
        description: `Order #${response.orderId}`,
        order_id: response.razorpayOrder.id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.mobileNumber,
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state}`,
        },
        theme: {
          color: "#7B6349",
        },
        handler: async (paymentResponse) => {
          try {
            const verification = await verifyPayment(token, {
              orderId: response.orderId,
              ...paymentResponse,
            });
            if (verification.success) {
              navigate(`/checkout-success?orderId=${response.orderId}`);
            } else {
              alert(verification.message || "Payment verification failed. Please contact support.");
            }
          } catch (verificationError) {
            console.error("Payment verification error:", verificationError);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (paymentError) => {
        console.error("Razorpay payment failed:", paymentError.error);
        alert(paymentError.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpayInstance.open();
      return;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <>
      <Navbar />
      <SubNavbar />
      <div className="checkout-container">
        <div className="checkout-wrapper">
          <div className="checkout-form-section">
            <h2>Checkout</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Zip Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

            <button type="submit" className="checkout-submit-btn" disabled={loading}>
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
            {razorpayError && (
              <p className="checkout-warning">{razorpayError}</p>
            )}
            </form>
          </div>

          <div className="checkout-summary-section">
            <h3>Order Summary</h3>
            <div className="order-items">
              {cart.map((item, i) => (
                <div key={i} className="order-item">
                  <img src={item.image} alt={item.name} />
                  <div className="order-item-details">
                    <h4>{item.name}</h4>
                    <p>Quantity: {item.quantity}</p>
                    <p className="order-item-price">
                      ₹{(parsePrice(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: ₹{calculateTotal().toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

