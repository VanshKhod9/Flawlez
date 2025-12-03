import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CartContext } from "../../context/Cartcontext";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import "./CheckoutSuccess.css";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate("/home");
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/checkout-success/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          let parsedShipping = null;
          if (data.order?.shipping_address) {
            try {
              parsedShipping = JSON.parse(data.order.shipping_address);
            } catch (parseError) {
              console.error("Failed to parse shipping address:", parseError);
            }
          }

          setOrder({
            ...data.order,
            shipping_address: parsedShipping,
          });
          
          if (data.order && (data.order.payment_status === "completed" || data.order.payment_status === "pending_payment")) {
            clearCart();
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate, clearCart]);

  if (loading) {
    return (
      <>
        <Navbar />
        <SubNavbar />
        <div className="checkout-success-container">
          <div className="checkout-success-content">
            <h2>Loading...</h2>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <SubNavbar />
      <div className="checkout-success-container">
        <div className="checkout-success-content">
          <div className="success-icon">✓</div>
          <h2>Order Placed Successfully!</h2>
          {order ? (
            <>
              <p className="order-id">Order ID: #{order.id}</p>
              <p className="order-status">Status: {order.payment_status}</p>
              <p className="order-total">
                Total: ₹{(Number.parseFloat(order.total) || 0).toFixed(2)}
              </p>
              {order.shipping_address && (
                <div className="order-shipping">
                  <h4>Shipping to</h4>
                  <p>{order.shipping_address.fullName}</p>
                  <p>
                    {order.shipping_address.address}, {order.shipping_address.city},{" "}
                    {order.shipping_address.state} - {order.shipping_address.zipCode}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <p>Contact: {order.shipping_address.mobileNumber}</p>
                </div>
              )}
            </>
          ) : (
            <p className="order-status">We could not find your order details. Please contact support.</p>
          )}
          <div className="success-actions">
            <button onClick={() => navigate("/home")} className="continue-shopping-btn">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

