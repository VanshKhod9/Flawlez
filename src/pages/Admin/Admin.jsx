import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import Footer from "../../component/Footer";
import SearchOverlay from "../../component/Searchoverlay";
import { useProducts } from "../../context/ProductContext";
import {
  createCoupon,
  createProduct,
  deleteCoupon,
  deleteProduct,
  getAdminCoupons,
  getAdminOrders,
  getAdminOverview,
  getAdminProducts,
  getAdminUsers,
  updateAdminOrder,
  updateAdminUser,
  updateCoupon,
  updateProduct,
} from "../../api";
import "./Admin.css";

const productFormDefaults = {
  slug: "",
  name: "",
  shortDescription: "",
  longDescription: "",
  priceValue: "",
  weight: "250g",
  image: "",
  secondaryImage: "",
  gallery: "",
  benefits: "",
  tag: "",
  notes: "",
  roast: "Medium",
  origin: "India & East Africa",
  process: "Washed & Natural",
  stock: 50,
  featured: false,
  isActive: true,
};

const couponFormDefaults = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  maxDiscount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString("en-IN") : "-");
const MAX_PRODUCT_IMAGE_SIZE = 4 * 1024 * 1024;
const PRODUCT_IMAGE_OUTPUT_SIZE = 1400;

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load the selected image."));
    };

    image.src = objectUrl;
  });

const readFileAsSquareDataUrl = async (file) => {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = PRODUCT_IMAGE_OUTPUT_SIZE;
  canvas.height = PRODUCT_IMAGE_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to process the selected image.");
  }

  context.fillStyle = "#f3e6d6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;

  context.drawImage(image, x, y, width, height);
  return canvas.toDataURL("image/jpeg", 0.92);
};

export default function Admin() {
  const token = localStorage.getItem("token");
  const { products: liveProducts, refreshProducts } = useProducts();
  const [activeTab, setActiveTab] = useState("products");
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [productForm, setProductForm] = useState(productFormDefaults);
  const [couponForm, setCouponForm] = useState(couponFormDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => coupon.id === selectedCouponId) || null,
    [coupons, selectedCouponId]
  );

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, productData, orderData, userData, couponData] = await Promise.all([
        getAdminOverview(token),
        getAdminProducts(token),
        getAdminOrders(token),
        getAdminUsers(token),
        getAdminCoupons(token),
      ]);

      setOverview(overviewData.overview);
      setProducts(productData.products || []);
      setOrders(orderData.orders || []);
      setUsers(userData.users || []);
      setCoupons(couponData.coupons || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const syncProductForm = (product) => {
    if (!product) {
      setSelectedProductId(null);
      setProductForm(productFormDefaults);
      return;
    }

    const galleryImages = Array.isArray(product.gallery)
      ? product.gallery.filter((item) => item && item !== product.image)
      : [];
    const secondaryImage = product.secondaryImage || galleryImages[0] || "";
    const extraGallery = galleryImages.filter((item) => item !== secondaryImage);

    setSelectedProductId(product.id);
    setProductForm({
      slug: product.slug || "",
      name: product.name || "",
      shortDescription: product.shortDescription || "",
      longDescription: product.longDescription || "",
      priceValue: product.priceValue || "",
      weight: product.weight || "250g",
      image: product.image || "",
      secondaryImage,
      gallery: extraGallery.join(", "),
      benefits: (product.benefits || []).join(", "),
      tag: product.tag || "",
      notes: (product.notes || []).join(", "),
      roast: product.roast || "Medium",
      origin: product.origin || "India & East Africa",
      process: product.process || "Washed & Natural",
      stock: product.stock ?? 0,
      featured: Boolean(product.featured),
      isActive: product.isActive !== false,
    });
  };

  const syncCouponForm = (coupon) => {
    if (!coupon) {
      setSelectedCouponId(null);
      setCouponForm(couponFormDefaults);
      return;
    }

    setSelectedCouponId(coupon.id);
    setCouponForm({
      code: coupon.code || "",
      description: coupon.description || "",
      type: coupon.type || "percentage",
      value: coupon.value || "",
      minOrderValue: coupon.minOrderValue || "",
      maxDiscount: coupon.maxDiscount || "",
      usageLimit: coupon.usageLimit || "",
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      isActive: coupon.isActive !== false,
    });
  };

  const handleProductChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCouponChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCouponForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePrimaryImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setError("Image must be smaller than 4MB.");
      return;
    }

    try {
      const imageData = await readFileAsSquareDataUrl(file);
      setProductForm((current) => ({
        ...current,
        image: imageData,
      }));
      setMessage("Primary image squared and selected from your device. Save the product to publish it.");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load the selected image.");
    }
  };

  const clearPrimaryImage = () => {
    setProductForm((current) => ({
      ...current,
      image: "",
    }));
  };

  const handleSecondaryImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setError("Image must be smaller than 4MB.");
      return;
    }

    try {
      const imageData = await readFileAsSquareDataUrl(file);
      setProductForm((current) => ({
        ...current,
        secondaryImage: imageData,
      }));
      setMessage("Secondary image squared and selected from your device. Save the product to publish it.");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load the selected image.");
    }
  };

  const clearSecondaryImage = () => {
    setProductForm((current) => ({
      ...current,
      secondaryImage: "",
    }));
  };

  const withRefresh = async (work, successMessage) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await work();
      await Promise.all([loadAdminData(), refreshProducts()]);
      if (successMessage) setMessage(successMessage);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    await withRefresh(async () => {
      if (selectedProduct) {
        await updateProduct(token, selectedProduct.id, productForm);
      } else {
        await createProduct(token, productForm);
      }
      syncProductForm(null);
    }, selectedProduct ? "Product updated." : "Product created.");
  };

  const handleDeleteProduct = async (product) => {
    await withRefresh(async () => {
      await deleteProduct(token, product.id);
      if (selectedProductId === product.id) syncProductForm(null);
    }, "Product deleted.");
  };

  const handleSaveCoupon = async (event) => {
    event.preventDefault();
    await withRefresh(async () => {
      if (selectedCoupon) {
        await updateCoupon(token, selectedCoupon.id, couponForm);
      } else {
        await createCoupon(token, couponForm);
      }
      syncCouponForm(null);
    }, selectedCoupon ? "Coupon updated." : "Coupon created.");
  };

  const handleDeleteCoupon = async (coupon) => {
    await withRefresh(async () => {
      await deleteCoupon(token, coupon.id);
      if (selectedCouponId === coupon.id) syncCouponForm(null);
    }, "Coupon deleted.");
  };

  const handleOrderStatusChange = async (order, nextField, value) => {
    await withRefresh(async () => {
      await updateAdminOrder(token, order.id, {
        fulfillmentStatus:
          nextField === "fulfillmentStatus" ? value : order.fulfillment_status,
        paymentStatus: nextField === "paymentStatus" ? value : order.payment_status,
      });
    }, "Order updated.");
  };

  const handleUserToggle = async (user, field) => {
    await withRefresh(async () => {
      await updateAdminUser(token, user.username, {
        isAdmin: field === "isAdmin" ? !user.isAdmin : user.isAdmin,
        isVerified: field === "isVerified" ? !user.isVerified : user.isVerified,
      });
    }, "User updated.");
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <SearchOverlay products={liveProducts} />
      <main className="admin-page">
        <section className="admin-hero">
          <div>
            <span className="admin-kicker">Admin dashboard</span>
            <h1>Operate the store from one place</h1>
            <p>
              Manage catalog, stock, orders, customers, and offers inside your current stack without
              switching tools.
            </p>
          </div>
          <div className="admin-overview-grid">
            {overview ? (
              <>
                <div><span>Products</span><strong>{overview.productCount}</strong></div>
                <div><span>Orders</span><strong>{overview.orderCount}</strong></div>
                <div><span>Users</span><strong>{overview.userCount}</strong></div>
                <div><span>Revenue</span><strong>{formatCurrency(overview.paidRevenue)}</strong></div>
              </>
            ) : null}
          </div>
        </section>

        <div className="admin-tabs">
          {[
            ["products", "Products"],
            ["orders", "Orders"],
            ["users", "Users"],
            ["coupons", "Coupons"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={activeTab === value ? "active" : ""}
              onClick={() => setActiveTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {message ? <p className="form-message success admin-banner">{message}</p> : null}
        {error ? <p className="form-message error admin-banner">{error}</p> : null}
        {loading ? <p className="admin-state">Loading admin data...</p> : null}

        {!loading && activeTab === "products" ? (
          <section className="admin-layout">
            <div className="admin-list-panel">
              <div className="panel-header">
                <h2>Products</h2>
                <span>{products.length} total</span>
              </div>

              <div className="admin-product-list">
                {products.map((product) => (
                  <article className={`admin-product-card ${selectedProductId === product.id ? "selected" : ""}`} key={product.id}>
                    <button className="admin-product-main" onClick={() => syncProductForm(product)}>
                      <img src={product.image} alt={product.name} loading="lazy" />
                      <div>
                        <strong>{product.name}</strong>
                        <span>
                          {product.price}
                          {product.weight ? ` • ${product.weight}` : ""}
                        </span>
                        <small>{product.stock} in stock • {product.isActive ? "Live" : "Hidden"}</small>
                      </div>
                    </button>
                    <button className="danger-link" onClick={() => handleDeleteProduct(product)}>Delete</button>
                  </article>
                ))}
              </div>
            </div>

            <div className="admin-form-panel">
              <div className="panel-header">
                <h2>{selectedProduct ? `Edit ${selectedProduct.name}` : "Create product"}</h2>
                <button className="ghost-submit" onClick={() => syncProductForm(null)}>New product</button>
              </div>

              <form className="admin-form" onSubmit={handleSaveProduct}>
                <div className="admin-grid">
                  <label>
                    Product name
                    <input name="name" value={productForm.name} onChange={handleProductChange} required />
                  </label>
                  <label>
                    Slug
                    <input name="slug" value={productForm.slug} onChange={handleProductChange} />
                  </label>
                </div>

                <label>
                  Short description
                  <input name="shortDescription" value={productForm.shortDescription} onChange={handleProductChange} required />
                </label>

                <label>
                  Long description
                  <textarea name="longDescription" value={productForm.longDescription} onChange={handleProductChange} rows={4} />
                </label>

                <div className="admin-grid">
                  <label>
                    Price
                    <input name="priceValue" type="number" min="1" step="0.01" value={productForm.priceValue} onChange={handleProductChange} required />
                  </label>
                  <label>
                    Weight / pack size
                    <input
                      name="weight"
                      value={productForm.weight}
                      onChange={handleProductChange}
                      placeholder="250g"
                      required
                    />
                  </label>
                  <label>
                    Stock
                    <input name="stock" type="number" min="0" value={productForm.stock} onChange={handleProductChange} required />
                  </label>
                </div>

                <p className="admin-helper-text">
                  Every product defaults to `250g`, and you can change it here anytime for separate
                  pack-size listings like `Sermon 500g`.
                </p>

                <label>
                  Primary image
                  <input
                    name="image"
                    value={productForm.image}
                    onChange={handleProductChange}
                    placeholder="Paste image URL or use the upload button below"
                    required
                  />
                </label>

                <div className="admin-image-tools">
                  <label className="admin-upload-btn">
                    Choose image from device
                    <input type="file" accept="image/*" onChange={handlePrimaryImageUpload} />
                  </label>
                  {productForm.image ? (
                    <button type="button" className="ghost-submit" onClick={clearPrimaryImage}>
                      Remove image
                    </button>
                  ) : null}
                  <small>Supports JPG, PNG, WEBP up to 4MB. Device uploads are auto-fitted into a square.</small>
                </div>

                {productForm.image ? (
                  <div className="admin-image-preview">
                    <img src={productForm.image} alt="Product preview" />
                  </div>
                ) : null}

                <label>
                  Secondary image
                  <input
                    name="secondaryImage"
                    value={productForm.secondaryImage}
                    onChange={handleProductChange}
                    placeholder="Paste secondary image URL or use the upload button below"
                  />
                </label>

                <div className="admin-image-tools">
                  <label className="admin-upload-btn">
                    Choose secondary image
                    <input type="file" accept="image/*" onChange={handleSecondaryImageUpload} />
                  </label>
                  {productForm.secondaryImage ? (
                    <button type="button" className="ghost-submit" onClick={clearSecondaryImage}>
                      Remove secondary image
                    </button>
                  ) : null}
                  <small>Use this as the second image shown after opening the product. Device uploads are auto-squared.</small>
                </div>

                {productForm.secondaryImage ? (
                  <div className="admin-image-preview">
                    <img src={productForm.secondaryImage} alt="Secondary product preview" />
                  </div>
                ) : null}

                <div className="admin-grid">
                  <label>
                    Additional gallery images
                    <input
                      name="gallery"
                      value={productForm.gallery}
                      onChange={handleProductChange}
                      placeholder="/image3.png, /image4.png"
                    />
                  </label>
                  <label>
                    Benefits
                    <input name="benefits" value={productForm.benefits} onChange={handleProductChange} placeholder="Fresh roast, Filter-friendly, Fast dispatch" />
                  </label>
                </div>

                <div className="admin-grid">
                  <label>
                    Tasting notes
                    <input name="notes" value={productForm.notes} onChange={handleProductChange} />
                  </label>
                  <label>
                    Tag
                    <input name="tag" value={productForm.tag} onChange={handleProductChange} />
                  </label>
                </div>

                <div className="admin-grid">
                  <label>
                    Roast
                    <input name="roast" value={productForm.roast} onChange={handleProductChange} />
                  </label>
                  <label>
                    Origin
                    <input name="origin" value={productForm.origin} onChange={handleProductChange} />
                  </label>
                </div>

                <div className="admin-grid">
                  <label>
                    Process
                    <input name="process" value={productForm.process} onChange={handleProductChange} />
                  </label>
                  <div className="checkbox-stack">
                    <label className="checkbox-row">
                      <input type="checkbox" name="featured" checked={productForm.featured} onChange={handleProductChange} />
                      Featured on storefront
                    </label>
                    <label className="checkbox-row">
                      <input type="checkbox" name="isActive" checked={productForm.isActive} onChange={handleProductChange} />
                      Published live
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-submit" disabled={saving}>
                    {saving ? "Saving..." : selectedProduct ? "Update product" : "Create product"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "orders" ? (
          <section className="admin-section-card">
            <div className="panel-header">
              <h2>Orders</h2>
              <span>{orders.length} total</span>
            </div>
            <div className="table-list">
              {orders.map((order) => (
                <article key={order.id} className="table-row-card">
                  <div className="table-main">
                    <strong>Order #{order.id}</strong>
                    <span>{order.username}</span>
                    <small>{formatDate(order.created_at)}</small>
                  </div>
                  <div className="table-meta">
                    <span>{formatCurrency(order.total)}</span>
                    <select
                      value={order.fulfillment_status}
                      onChange={(event) => handleOrderStatusChange(order, "fulfillmentStatus", event.target.value)}
                    >
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={order.payment_status}
                      onChange={(event) => handleOrderStatusChange(order, "paymentStatus", event.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "users" ? (
          <section className="admin-section-card">
            <div className="panel-header">
              <h2>Users</h2>
              <span>{users.length} total</span>
            </div>
            <div className="table-list">
              {users.map((user) => (
                <article key={user.username} className="table-row-card">
                  <div className="table-main">
                    <strong>{user.username}</strong>
                    <span>{user.email || user.phone || "No contact info"}</span>
                    <small>{user.orderCount} orders • Joined {formatDate(user.createdAt)}</small>
                  </div>
                  <div className="table-toggle-group">
                    <label className="checkbox-row">
                      <input type="checkbox" checked={user.isVerified} onChange={() => handleUserToggle(user, "isVerified")} />
                      Verified
                    </label>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={user.isAdmin} onChange={() => handleUserToggle(user, "isAdmin")} />
                      Admin
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "coupons" ? (
          <section className="admin-layout">
            <div className="admin-list-panel">
              <div className="panel-header">
                <h2>Coupons</h2>
                <span>{coupons.length} total</span>
              </div>

              <div className="admin-product-list">
                {coupons.map((coupon) => (
                  <article className={`admin-product-card ${selectedCouponId === coupon.id ? "selected" : ""}`} key={coupon.id}>
                    <button className="admin-product-main" onClick={() => syncCouponForm(coupon)}>
                      <div>
                        <strong>{coupon.code}</strong>
                        <span>{coupon.type === "percentage" ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`}</span>
                        <small>{coupon.isActive ? "Active" : "Inactive"} • Used {coupon.usageCount} times</small>
                      </div>
                    </button>
                    <button className="danger-link" onClick={() => handleDeleteCoupon(coupon)}>Delete</button>
                  </article>
                ))}
              </div>
            </div>

            <div className="admin-form-panel">
              <div className="panel-header">
                <h2>{selectedCoupon ? `Edit ${selectedCoupon.code}` : "Create coupon"}</h2>
                <button className="ghost-submit" onClick={() => syncCouponForm(null)}>New coupon</button>
              </div>

              <form className="admin-form" onSubmit={handleSaveCoupon}>
                <div className="admin-grid">
                  <label>
                    Code
                    <input name="code" value={couponForm.code} onChange={handleCouponChange} required />
                  </label>
                  <label>
                    Type
                    <select name="type" value={couponForm.type} onChange={handleCouponChange}>
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat</option>
                    </select>
                  </label>
                </div>

                <label>
                  Description
                  <input name="description" value={couponForm.description} onChange={handleCouponChange} />
                </label>

                <div className="admin-grid">
                  <label>
                    Value
                    <input name="value" type="number" min="0" step="0.01" value={couponForm.value} onChange={handleCouponChange} required />
                  </label>
                  <label>
                    Minimum order
                    <input name="minOrderValue" type="number" min="0" step="0.01" value={couponForm.minOrderValue} onChange={handleCouponChange} />
                  </label>
                </div>

                <div className="admin-grid">
                  <label>
                    Max discount
                    <input name="maxDiscount" type="number" min="0" step="0.01" value={couponForm.maxDiscount} onChange={handleCouponChange} />
                  </label>
                  <label>
                    Usage limit
                    <input name="usageLimit" type="number" min="0" value={couponForm.usageLimit} onChange={handleCouponChange} />
                  </label>
                </div>

                <div className="admin-grid">
                  <label>
                    Starts at
                    <input name="startsAt" type="datetime-local" value={couponForm.startsAt} onChange={handleCouponChange} />
                  </label>
                  <label>
                    Expires at
                    <input name="expiresAt" type="datetime-local" value={couponForm.expiresAt} onChange={handleCouponChange} />
                  </label>
                </div>

                <label className="checkbox-row">
                  <input type="checkbox" name="isActive" checked={couponForm.isActive} onChange={handleCouponChange} />
                  Coupon is active
                </label>

                <div className="form-actions">
                  <button type="submit" className="primary-submit" disabled={saving}>
                    {saving ? "Saving..." : selectedCoupon ? "Update coupon" : "Create coupon"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
