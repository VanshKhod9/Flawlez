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
import { useProducts } from "../../context/ProductContext";
import "./Account.css";

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

const PASSWORD_REQUIREMENTS_MESSAGE =
  "Use 8+ characters with uppercase, lowercase, a number, and a special character.";

const passwordMeetsRequirements = (value) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

export default function Account() {
  const { logout } = useContext(CartContext);
  const navigate = useNavigate();
  const { products } = useProducts();
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

  // ✅ Fetch account details — only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchAccount = async () => {
      const activeToken = localStorage.getItem("token");
      if (!activeToken) {
        if (isMounted) {
          setError("Please login again.");
          setLoading(false);
        }
        navigate("/login");
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }
        const data = await getAccount(activeToken);

        if (!isMounted) return;

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
        if (!isMounted) return;
        
        console.error("Account fetch error", err);
        // If token is invalid, redirect to login
        if (err.status === 401 || err.message?.includes("token") || err.message?.includes("expired") || err.message?.includes("Invalid")) {
          localStorage.removeItem("token");
          logout();
          navigate("/login");
          return;
        }
        setError(err.message || "Unable to load account information.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAccount();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

    if (!passwordMeetsRequirements(passwordForm.newPassword)) {
      setPasswordError(PASSWORD_REQUIREMENTS_MESSAGE);
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

  const formatStatus = (value) => String(value || "").replace(/_/g, " ");

  const getItemTotal = (item) =>
    formatCurrency(
      (Number(item?.quantity) || 0) *
        (Number(String(item?.price ?? "").replace(/[^0-9.]/g, "")) || 0)
    );

  // ✅ Clean logout
  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const user = account.user || {};
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || "Flawlez Member";
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part?.[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "F";
  const totalSpent = account.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const latestOrder = account.orders[0] || null;
  const primaryAddress = account.addresses[0] || null;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "Recently joined";
  const locationLabel = primaryAddress
    ? [primaryAddress.city, primaryAddress.state].filter(Boolean).join(", ")
    : "India";

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={products} />

      <main className="account-page">
        {loading ? (
          <div className="account-loading">Loading account details...</div>
        ) : error ? (
          <div className="account-error">{error}</div>
        ) : (
          <div className="account-shell">
            <header className="account-hero">
              <div className="account-hero-copy">
                <span className="account-kicker">Flawlez Account</span>
                <h1>{displayName}</h1>
                <p>
                  Keep your orders, delivery details, and account security organized from one calm
                  dashboard.
                </p>

                <div className="account-hero-meta">
                  <span className="account-meta-pill">@{user.username}</span>
                  {user.email ? <span className="account-meta-pill">{user.email}</span> : null}
                  {user.phone ? <span className="account-meta-pill">{user.phone}</span> : null}
                </div>
              </div>

              <div className="account-hero-card">
                <div className="account-avatar">{initials}</div>
                <div className="account-hero-card-copy">
                  <span className="account-card-label">Member since</span>
                  <strong>{memberSince}</strong>
                  <span>{user.isAdmin ? "Admin access enabled" : "Customer account active"}</span>
                </div>
                <div className="account-hero-actions">
                  <button className="primary-btn" onClick={() => navigate("/home")}>
                    Shop Coffee
                  </button>
                  <button className="account-logout" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              </div>
            </header>

            <section className="account-stats">
              <article className="account-stat-card">
                <span className="account-stat-label">Total orders</span>
                <strong>{account.orders.length}</strong>
                <span>
                  {latestOrder
                    ? `Latest on ${new Date(latestOrder.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}`
                    : "No orders yet"}
                </span>
              </article>
              <article className="account-stat-card">
                <span className="account-stat-label">Total spent</span>
                <strong>{formatCurrency(totalSpent)}</strong>
                <span>Across every Flawlez purchase so far</span>
              </article>
              <article className="account-stat-card">
                <span className="account-stat-label">Saved addresses</span>
                <strong>{account.addresses.length}</strong>
                <span>{primaryAddress ? locationLabel : "Add your primary delivery location"}</span>
              </article>
              <article className="account-stat-card">
                <span className="account-stat-label">Current status</span>
                <strong>{user.isAdmin ? "Admin" : "Active"}</strong>
                <span>{latestOrder ? formatStatus(latestOrder.payment_status) : "Ready to shop"}</span>
              </article>
            </section>

            <section className="account-panels">
              <div className="account-panel account-orders-panel" id="order-history">
                <div className="account-panel-head">
                  <div>
                    <span className="account-section-kicker">Orders</span>
                    <h2>Order History</h2>
                    <p>Review past purchases, totals, and delivery progress.</p>
                  </div>
                </div>

                {account.orders.length === 0 ? (
                  <div className="account-empty-state">
                    <p className="account-empty">You haven&apos;t placed any orders yet.</p>
                    <button className="secondary-btn account-ghost-btn" onClick={() => navigate("/home")}>
                      Explore coffees
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {account.orders.map((order) => (
                      <article className="order-card" key={order.id}>
                        <div className="order-card-header">
                          <div className="order-card-meta">
                            <span className="order-id">Order #{order.id}</span>
                            <div className="order-statuses">
                              <span className={`order-status status-${order.payment_status}`}>
                                {formatStatus(order.payment_status)}
                              </span>
                              {order.fulfillment_status ? (
                                <span className="order-status order-status-secondary">
                                  {formatStatus(order.fulfillment_status)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <span className="order-date">{formatDate(order.created_at)}</span>
                        </div>

                        <div className="order-card-summary">
                          <div>
                            <span className="order-summary-label">Total paid</span>
                            <strong>{formatCurrency(order.total)}</strong>
                          </div>
                          <div>
                            <span className="order-summary-label">Items</span>
                            <strong>{order.items.length}</strong>
                          </div>
                        </div>

                        <div className="order-items">
                          {order.items.map((item, index) => (
                            <div className="order-item" key={`${order.id}-${index}`}>
                              <div>
                                <span className="order-item-name">{item.name}</span>
                                <span className="order-item-meta">
                                  Qty {item.quantity}
                                  {item.weight ? ` • ${item.weight}` : ""}
                                </span>
                              </div>
                              <strong>{getItemTotal(item)}</strong>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <aside className="account-panel account-overview-panel" id="account-details">
                <div className="account-panel-head">
                  <div>
                    <span className="account-section-kicker">Profile</span>
                    <h2>Account Overview</h2>
                    <p>Your identity, contact details, and shortcuts in one place.</p>
                  </div>
                </div>

                <div className="account-detail-grid">
                  <div className="account-detail-card">
                    <span className="account-detail-label">Username</span>
                    <strong>{user.username}</strong>
                  </div>
                  <div className="account-detail-card">
                    <span className="account-detail-label">Email</span>
                    <strong>{user.email || "Add one via Google login later"}</strong>
                  </div>
                  <div className="account-detail-card">
                    <span className="account-detail-label">Phone</span>
                    <strong>{user.phone || "Not available"}</strong>
                  </div>
                  <div className="account-detail-card">
                    <span className="account-detail-label">Primary region</span>
                    <strong>{locationLabel}</strong>
                  </div>
                </div>

                <div className="account-links-card">
                  <span className="account-section-kicker">Quick actions</span>
                  <div className="account-links">
                    <a href="#addresses">Manage addresses ({account.addresses.length})</a>
                    <a href="#password">Update password</a>
                    <button className="link-btn" onClick={() => navigate("/home")}>
                      Continue shopping
                    </button>
                    {user.isAdmin ? (
                      <button className="link-btn" onClick={() => navigate("/admin")}>
                        Open Admin Dashboard
                      </button>
                    ) : null}
                  </div>
                </div>
              </aside>
            </section>

            <section className="account-grid" id="addresses">
              <div className="account-panel">
                <div className="account-panel-head">
                  <div>
                    <span className="account-section-kicker">Delivery</span>
                    <h3>{editingAddressId ? "Edit Address" : "Add Address"}</h3>
                    <p>Keep checkout fast by saving complete address details here.</p>
                  </div>
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
                <div className="account-panel-head">
                  <div>
                    <span className="account-section-kicker">Saved</span>
                    <h3>Saved Addresses</h3>
                    <p>Choose a preferred delivery address and update it anytime.</p>
                  </div>
                </div>

                {account.addresses.length === 0 ? (
                  <p className="account-empty">No saved addresses yet.</p>
                ) : (
                  <div className="address-cards">
                    {account.addresses.map((address) => (
                      <article className="address-card" key={address.id}>
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
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="account-panel account-security-panel" id="password">
              <div className="account-panel-head">
                <div>
                  <span className="account-section-kicker">Security</span>
                  <h3>Reset Password</h3>
                  <p>Keep your account protected with a strong password you can remember.</p>
                </div>
              </div>

              <form className="password-form" onSubmit={handlePasswordSubmit}>
                <div className="form-row">
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
                      minLength={8}
                      required
                    />
                    <span className="password-hint">{PASSWORD_REQUIREMENTS_MESSAGE}</span>
                  </label>
                </div>

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
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
