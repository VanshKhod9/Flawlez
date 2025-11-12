import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import {
  getAccount,
  addAddress,
  updateAddress,
  deleteAddress,
  changePassword,
} from "../../api";
import { CartContext } from "../../context/Cartcontext";
import "./Account.css";

const searchProducts = [
  {
    id: "sermon",
    name: "SERMON",
    description: "FRUITY & DECADENT · MEDIUM ROAST",
    price: "₹550.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "streetlevel",
    name: "STREETLEVEL",
    description: "SWEET & BALANCED · MEDIUM ROAST",
    price: "₹520.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "aster",
    name: "ASTER",
    description: "VIBRANT & COMPLEX · MEDIUM ROAST",
    price: "₹540.00",
    image: "/Flawlez 2.png",
  },
];

const emptyAddress = {
  label: "Default",
  full_name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  phone: "",
};

export default function Account() {
  const { logout } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState({ user: null, orders: [], addresses: [] });
  const [error, setError] = useState("");
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressMessage, setAddressMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ Always read the latest token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ✅ Fetch account details — stays logged in until manual logout
  useEffect(() => {
    const fetchAccount = async () => {
      const activeToken = localStorage.getItem("token");
      if (!activeToken) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getAccount(activeToken);

        // If backend says token invalid — only then logout
        if (data.message?.toLowerCase().includes("invalid token")) {
          localStorage.removeItem("token");
          logout();
          navigate("/login");
          return;
        }

        setAccount({
          user: data.user,
          orders: data.orders || [],
          addresses: data.addresses || [],
        });
        setError("");
      } catch (err) {
        console.error("Account fetch error", err);
        setError(err.message || "Unable to load account information.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [token, navigate, logout]);

  // ✅ Address handling
  const resetAddressForm = () => {
    setAddressForm(emptyAddress);
    setEditingAddressId(null);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressMessage("");

    try {
      const payload = { ...addressForm };
      const activeToken = localStorage.getItem("token");
      const response = editingAddressId
        ? await updateAddress(activeToken, editingAddressId, payload)
        : await addAddress(activeToken, payload);

      if (!response.success) throw new Error(response.message || "Unable to save address.");

      const refreshed = await getAccount(activeToken);
      setAccount((prev) => ({
        ...prev,
        addresses: refreshed.addresses || [],
      }));

      setAddressMessage(editingAddressId ? "Address updated" : "Address added");
      resetAddressForm();
    } catch (err) {
      console.error("Address save error", err);
      setAddressMessage(err.message || "Unable to save address");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || "",
      full_name: address.full_name || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country || "",
      phone: address.phone || "",
    });
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const activeToken = localStorage.getItem("token");
      const response = await deleteAddress(activeToken, id);
      if (!response.success) throw new Error(response.message || "Unable to delete address.");
      setAccount((prev) => ({
        ...prev,
        addresses: prev.addresses.filter((addr) => addr.id !== id),
      }));
    } catch (err) {
      console.error("Delete address error", err);
      setAddressMessage(err.message || "Unable to delete address");
    }
  };

  // ✅ Password handling
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      const activeToken = localStorage.getItem("token");
      const response = await changePassword(activeToken, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (!response.success) throw new Error(response.message || "Unable to update password");

      setPasswordMessage("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Password update error", err);
      setPasswordError(err.message || "Unable to update password");
    }
  };

  const formatCurrency = (value) => `₹${(Number(value) || 0).toFixed(2)}`;
  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return value;
    }
  };

  // ✅ Clean logout
  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={searchProducts} />

      <main className="account-page">
        {loading ? (
          <div className="account-loading">Loading account details...</div>
        ) : error ? (
          <div className="account-error">{error}</div>
        ) : (
          <>
            <header className="account-header">
              <div>
                <h1>My Account</h1>
                <span className="account-username">{account.user?.username}</span>
              </div>
              <button className="account-logout" onClick={handleLogout}>
                Log Out
              </button>
            </header>

            {/* ==== Orders ==== */}
            <section className="account-panels">
              <div className="account-panel" id="order-history">
                <h2>Order History</h2>
                {account.orders.length === 0 ? (
                  <p className="account-empty">You haven't placed any orders yet.</p>
                ) : (
                  <div className="orders-list">
                    {account.orders.map((order) => (
                      <div className="order-card" key={order.id}>
                        <div className="order-card-header">
                          <div>
                            <span className="order-id">Order #{order.id}</span>
                            <span className={`order-status status-${order.payment_status}`}>
                              {order.payment_status.replace("_", " ")}
                            </span>
                          </div>
                          <span className="order-date">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="order-total">Total: {formatCurrency(order.total)}</div>
                        <div className="order-items">
                          {order.items.map((item, index) => (
                            <div className="order-item" key={`${order.id}-${index}`}>
                              <span>{item.name}</span>
                              <span>Qty: {item.quantity}</span>
                              <span>
                                {formatCurrency(
                                  item.quantity *
                                    (Number(String(item.price).replace(/[^0-9.]/g, "")) || 0)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ==== Account Info ==== */}
              <div className="account-panel" id="account-details">
                <h2>Account Details</h2>
                <div className="account-detail-block">
                  <p className="account-detail-name">{account.user?.username}</p>
                  <p>India</p>
                </div>

                <div className="account-links">
                  <a href="#addresses">View Addresses ({account.addresses.length})</a>
                  <a href="#password">Reset Password</a>
                  <a href="mailto:subscriptions@coffeecollective.in">Manage Subscriptions</a>
                </div>
              </div>
            </section>

            {/* ==== Addresses ==== */}
            <section className="account-grid" id="addresses">
              <div className="account-panel">
                <div className="panel-header">
                  <h3>{editingAddressId ? "Edit Address" : "Add Address"}</h3>
                  {editingAddressId && (
                    <button className="link-btn" onClick={resetAddressForm}>
                      Cancel edit
                    </button>
                  )}
                </div>
                <form className="address-form" onSubmit={handleAddressSubmit}>
                  <div className="form-row">
                    <label>
                      Label
                      <input
                        type="text"
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressChange}
                      />
                    </label>
                    <label>
                      Full Name*
                      <input
                        type="text"
                        name="full_name"
                        value={addressForm.full_name}
                        onChange={handleAddressChange}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Address Line 1*
                    <input
                      type="text"
                      name="line1"
                      value={addressForm.line1}
                      onChange={handleAddressChange}
                      required
                    />
                  </label>
                  <label>
                    Address Line 2
                    <input
                      type="text"
                      name="line2"
                      value={addressForm.line2}
                      onChange={handleAddressChange}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      City*
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </label>
                    <label>
                      State*
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Postal Code*
                      <input
                        type="text"
                        name="postal_code"
                        value={addressForm.postal_code}
                        onChange={handleAddressChange}
                        required
                      />
                    </label>
                    <label>
                      Country*
                      <input
                        type="text"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressChange}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Phone
                    <input
                      type="tel"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                    />
                  </label>

                  <button type="submit" className="primary-btn">
                    {editingAddressId ? "Update address" : "Save address"}
                  </button>
                  {addressMessage && <p className="form-feedback">{addressMessage}</p>}
                </form>
              </div>

              <div className="account-panel address-list">
                <h3>Saved Addresses</h3>
                {account.addresses.length === 0 ? (
                  <p className="account-empty">No saved addresses yet.</p>
                ) : (
                  <div className="address-cards">
                    {account.addresses.map((address) => (
                      <div className="address-card" key={address.id}>
                        <div className="address-card-header">
                          <span className="address-label">{address.label}</span>
                          <div className="address-actions">
                            <button className="link-btn" onClick={() => handleEditAddress(address)}>
                              Edit
                            </button>
                            <button className="link-btn" onClick={() => handleDeleteAddress(address.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="address-name">{address.full_name}</p>
                        <p>{address.line1}</p>
                        {address.line2 && <p>{address.line2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p>{address.country}</p>
                        {address.phone && <p>Phone: {address.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ==== Password ==== */}
            <section className="account-panel" id="password">
              <h3>Reset Password</h3>
              <form className="password-form" onSubmit={handlePasswordSubmit}>
                <label>
                  Current Password
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>
                <label>
                  New Password
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>
                <label>
                  Confirm New Password
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>
                <button type="submit" className="primary-btn">
                  Update password
                </button>
                {passwordMessage && <p className="form-feedback">{passwordMessage}</p>}
                {passwordError && <p className="form-error">{passwordError}</p>}
              </form>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
