import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/Cartcontext";
import {
  createCheckoutSession,
  getAccount,
  recordPaymentFailure,
  validateCoupon,
  verifyPayment,
} from "../../api";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import "./Checkout.css";

const FRONTEND_RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
const FALLBACK_CART_IMAGE = "/Flawlez5.png";

export default function Checkout() {
  const { cart, isLoggedIn } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDetails, setCouponDetails] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  const getOrderItemImage = (item) => {
    const image = typeof item?.image === "string" ? item.image.trim() : "";
    return image || FALLBACK_CART_IMAGE;
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      navigate("/home");
      return;
    }

    const loadAddresses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const accountData = await getAccount(token);
        if (accountData.addresses?.length) {
          const firstAddress = accountData.addresses[0];
          setSavedAddresses(accountData.addresses);
          setSelectedAddressId(firstAddress.id);
          setFormData({
            fullName: firstAddress.full_name || "",
            email: accountData.user?.email || accountData.user?.username || "",
            mobileNumber: firstAddress.phone || "",
            address: firstAddress.line1 || "",
            city: firstAddress.city || "",
            state: firstAddress.state || "",
            zipCode: firstAddress.postal_code || "",
            country: firstAddress.country || "India",
          });
        }
      } catch (error) {
        setCheckoutError(error.message || "Unable to load saved addresses.");
      }
    };

    loadAddresses();
  }, [cart.length, isLoggedIn, navigate]);

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
      setGatewayMessage("");
    };
    script.onerror = () => {
      setGatewayMessage("Payment gateway failed to load. Refresh and try again.");
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

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const price = parsePrice(item.price);
        return total + price * Number(item.quantity || 1);
      }, 0),
    [cart]
  );

  const discountAmount = couponDetails?.pricing?.discountAmount || 0;
  const total = Math.max(0, (couponDetails?.pricing?.total ?? subtotal));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id);
    setFormData((current) => ({
      ...current,
      fullName: address.full_name || "",
      mobileNumber: address.phone || "",
      address: address.line1 || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.postal_code || "",
      country: address.country || "India",
    }));
  };

  const handleApplyCoupon = async () => {
    setCouponMessage("");
    setCheckoutError("");

    if (!couponCode.trim()) {
      setCouponDetails(null);
      return;
    }

    setCouponLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await validateCoupon(token, {
        couponCode,
        cart,
      });

      setCouponDetails(response);
      setCouponCode(response.coupon.code);
      setCouponMessage(
        `Coupon ${response.coupon.code} applied. You saved ₹${response.coupon.discountAmount.toFixed(2)}.`
      );
    } catch (error) {
      setCouponDetails(null);
      setCouponMessage(error.message || "Coupon could not be applied.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setCheckoutError("");
    setCheckoutMessage("");

    try {
      const token = localStorage.getItem("token");
      const checkoutData = {
        ...formData,
        cart,
        couponCode: couponCode.trim() || undefined,
      };

      const response = await createCheckoutSession(token, checkoutData);

      if (!isRazorpayReady) {
        throw new Error(gatewayMessage || "Payment gateway is still loading. Please try again.");
      }

      const razorpayKey = response.keyId || FRONTEND_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Razorpay key is missing. Add VITE_RAZORPAY_KEY_ID or configure the backend key.");
      }

      const options = {
        key: razorpayKey,
        amount: response.amount || response.razorpayOrder.amount,
        currency: response.currency || response.razorpayOrder.currency,
        name: "Flawlez Coffee",
        description: `Order #${response.orderId}`,
        order_id: response.order_id || response.razorpayOrder.id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.mobileNumber,
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state}`,
        },
        theme: {
          color: "#6b3f29",
        },
        handler: async (paymentResponse) => {
          try {
            const verification = await verifyPayment(token, {
              orderId: response.orderId,
              ...paymentResponse,
            });

            if (verification.success) {
              navigate(`/checkout-success?orderId=${response.orderId}`);
              return;
            }

            setCheckoutError(verification.message || "Payment verification failed.");
          } catch (verificationError) {
            setCheckoutError(verificationError.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await recordPaymentFailure(token, {
              orderId: response.orderId,
              reason: "Customer closed Razorpay before completing payment.",
            });
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", async (paymentError) => {
        await recordPaymentFailure(token, {
          orderId: response.orderId,
          reason: paymentError.error?.description || "Payment failed",
        });
        setCheckoutError(paymentError.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpayInstance.open();
      setCheckoutMessage("Redirecting you to secure payment...");
    } catch (error) {
      setCheckoutError(error.message || "Unable to start checkout.");
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
            <div className="checkout-header-row">
              <div>
                <span className="checkout-kicker">Secure checkout</span>
                <h2>Deliver great coffee, fast</h2>
              </div>
              <div className="checkout-trust-row">
                <span>Razorpay secured</span>
                <span>Fresh roast dispatch</span>
              </div>
            </div>

            {savedAddresses.length > 0 ? (
              <div className="saved-addresses-section">
                <label>Use saved address</label>
                <div className="address-selector">
                  {savedAddresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      className={`address-option ${selectedAddressId === address.id ? "selected" : ""}`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <strong>{address.label || "Default"}</strong>
                      <span>
                        {address.line1}, {address.city}, {address.state}
                      </span>
                    </button>
                  ))}
                </div>
                <hr className="address-divider" />
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
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
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Zip Code *</label>
                  <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="coupon-panel">
                <div className="coupon-copy">
                  <h3>Have a coupon?</h3>
                  <p>Apply live and review the exact discount before you pay.</p>
                </div>
                <div className="coupon-input-row">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                  />
                  <button type="button" className="secondary-inline-btn" onClick={handleApplyCoupon} disabled={couponLoading}>
                    {couponLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
                {couponMessage ? <p className="inline-feedback">{couponMessage}</p> : null}
              </div>

              {gatewayMessage ? <p className="checkout-warning">{gatewayMessage}</p> : null}
              {checkoutMessage ? <p className="inline-feedback">{checkoutMessage}</p> : null}
              {checkoutError ? <p className="checkout-warning">{checkoutError}</p> : null}

              <button type="submit" className="checkout-submit-btn" disabled={loading || !isRazorpayReady}>
                {loading ? "Processing..." : "Proceed to Secure Payment"}
              </button>
            </form>
          </div>

          <aside className="checkout-summary-section">
            <h3>Order Summary</h3>
            <div className="order-items">
              {cart.map((item, index) => (
                <div key={`${item.id || item.slug}-${index}`} className="order-item">
                  <img src={getOrderItemImage(item)} alt={item.name} loading="lazy" />
                  <div className="order-item-details">
                    <h4>{item.name}</h4>
                    <p>
                      {[item.selectedWeight || item.weight || item.selectedSize, item.selectedGrind || "Whole Bean"]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    <p>Quantity: {item.quantity}</p>
                    <p className="order-item-price">
                      ₹{(parsePrice(item.price) * Number(item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="price-breakdown">
              <div>
                <span>Subtotal</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>
              <div>
                <span>Discount</span>
                <strong>{discountAmount > 0 ? `-₹${discountAmount.toFixed(2)}` : "₹0.00"}</strong>
              </div>
              <div className="grand-total">
                <span>Total</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="checkout-benefits">
              <div>Freshly roasted in small batches</div>
              <div>Secure UPI, cards, netbanking via Razorpay</div>
              <div>Order support and tracking from your account</div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
