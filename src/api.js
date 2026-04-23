export const API_URL = import.meta.env.VITE_API_URL || "https://flawlez-1.onrender.com/api";

const parsePrice = (value) => {
  const numeric = Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
};

const normalizeProduct = (product) => {
  const priceValue = Number(product?.price ?? 0);

  return {
    ...product,
    id: product?.id,
    slug: product?.slug || String(product?.id || ""),
    description: product?.shortDescription || product?.description || "",
    shortDescription: product?.shortDescription || product?.description || "",
    longDescription: product?.longDescription || product?.description || "",
    priceValue,
    price: `₹${priceValue.toFixed(2)}`,
    notes: Array.isArray(product?.notes) ? product.notes : [],
    gallery: Array.isArray(product?.gallery) ? product.gallery : [product?.image].filter(Boolean),
    benefits: Array.isArray(product?.benefits) ? product.benefits : [],
    roast: product?.roast || "Medium",
    origin: product?.origin || "India & East Africa",
    process: product?.process || "Washed & Natural",
    stock: Number(product?.stock ?? 0),
    featured: Boolean(product?.featured),
    isActive: product?.isActive !== false,
  };
};

const normalizeAddress = (address) => ({
  ...address,
  full_name: address?.full_name ?? address?.fullName ?? "",
  postal_code: address?.postal_code ?? address?.postalCode ?? "",
});

const normalizeOrder = (order) => ({
  ...order,
  payment_status: order?.payment_status ?? order?.paymentStatus ?? "pending",
  fulfillment_status: order?.fulfillment_status ?? order?.fulfillmentStatus ?? "processing",
  created_at: order?.created_at ?? order?.createdAt ?? null,
  items: order?.items || order?.orderData || order?.order_data || [],
  subtotal: Number(order?.subtotal ?? 0),
  discountAmount: Number(order?.discountAmount ?? order?.discount_amount ?? 0),
  total: Number(order?.total ?? 0),
});

const normalizeCoupon = (coupon) => ({
  ...coupon,
  value: Number(coupon?.value ?? 0),
  minOrderValue: Number(coupon?.minOrderValue ?? 0),
  maxDiscount: coupon?.maxDiscount == null ? null : Number(coupon.maxDiscount),
});

async function handleJsonResponse(res) {
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";

    if (res.status === 401) {
      localStorage.removeItem("token");
      const error = new Error(message || "Token expired - please login again");
      error.status = 401;
      throw error;
    }

    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

async function authorizedJson(url, token, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return handleJsonResponse(res);
}

export async function register(username, password, phone) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, phone }),
  });
  return handleJsonResponse(res);
}

export async function completeRegister(username, password, phone, accessToken) {
  const res = await fetch(`${API_URL}/register/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, phone, accessToken }),
  });
  return handleJsonResponse(res);
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleJsonResponse(res);
}

export async function completeLogin(username, accessToken) {
  const res = await fetch(`${API_URL}/login/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, accessToken }),
  });
  return handleJsonResponse(res);
}

export async function getProtected(token) {
  return authorizedJson(`${API_URL}/protected`, token, { method: "GET" });
}

export async function createCheckoutSession(token, checkoutData) {
  try {
    return await authorizedJson(`${API_URL}/create-order`, token, {
      method: "POST",
      body: JSON.stringify(checkoutData),
    });
  } catch (error) {
    if (error.status !== 403 && error.status !== 404) {
      throw error;
    }

    return authorizedJson(`${API_URL}/checkout`, token, {
      method: "POST",
      body: JSON.stringify(checkoutData),
    });
  }
}

export async function verifyPayment(token, payload) {
  return authorizedJson(`${API_URL}/verify-payment`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordPaymentFailure(token, payload) {
  return authorizedJson(`${API_URL}/payment-failed`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateCoupon(token, payload) {
  return authorizedJson(`${API_URL}/coupons/validate`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrderById(token, orderId) {
  const data = await authorizedJson(`${API_URL}/checkout-success/${orderId}`, token, {
    method: "GET",
  });

  return {
    ...data,
    order: data.order ? normalizeOrder(data.order) : null,
  };
}

export async function getAccount(token) {
  const data = await authorizedJson(`${API_URL}/account`, token, {
    method: "GET",
  });

  return {
    ...data,
    addresses: Array.isArray(data.addresses) ? data.addresses.map(normalizeAddress) : [],
    orders: Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : [],
  };
}

export async function addAddress(token, address) {
  const data = await authorizedJson(`${API_URL}/account/address`, token, {
    method: "POST",
    body: JSON.stringify(address),
  });

  return {
    ...data,
    address: data.address ? normalizeAddress(data.address) : null,
  };
}

export async function updateAddress(token, id, address) {
  const data = await authorizedJson(`${API_URL}/account/address/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(address),
  });

  return {
    ...data,
    address: data.address ? normalizeAddress(data.address) : null,
  };
}

export async function deleteAddress(token, id) {
  return authorizedJson(`${API_URL}/account/address/${id}`, token, {
    method: "DELETE",
  });
}

export async function changePassword(token, data) {
  return authorizedJson(`${API_URL}/account/password`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSubscriptionStatus(token) {
  return authorizedJson(`${API_URL}/subscription/status`, token, { method: "GET" });
}

export async function subscribeEmail(token, email) {
  return authorizedJson(`${API_URL}/subscription`, token, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getReviews() {
  const res = await fetch(`${API_URL}/reviews`);
  return handleJsonResponse(res);
}

export async function addReview(token, review) {
  return authorizedJson(`${API_URL}/reviews`, token, {
    method: "POST",
    body: JSON.stringify(review),
  });
}

export async function updateReview(token, id, review) {
  return authorizedJson(`${API_URL}/reviews/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(review),
  });
}

export async function deleteReview(token, id) {
  return authorizedJson(`${API_URL}/reviews/${id}`, token, {
    method: "DELETE",
  });
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);
  const data = await handleJsonResponse(res);

  return {
    ...data,
    products: Array.isArray(data.products) ? data.products.map(normalizeProduct) : [],
  };
}

export async function getProduct(slug) {
  const res = await fetch(`${API_URL}/products/${slug}`);
  const data = await handleJsonResponse(res);

  return {
    ...data,
    product: data.product ? normalizeProduct(data.product) : null,
  };
}

export async function getAdminOverview(token) {
  return authorizedJson(`${API_URL}/admin/overview`, token, { method: "GET" });
}

export async function getAdminProducts(token) {
  const data = await authorizedJson(`${API_URL}/admin/products`, token, {
    method: "GET",
  });

  return {
    ...data,
    products: Array.isArray(data.products) ? data.products.map(normalizeProduct) : [],
  };
}

export async function createProduct(token, product) {
  const data = await authorizedJson(`${API_URL}/admin/products`, token, {
    method: "POST",
    body: JSON.stringify({
      ...product,
      price: parsePrice(product.priceValue ?? product.price),
    }),
  });

  return {
    ...data,
    product: data.product ? normalizeProduct(data.product) : null,
  };
}

export async function updateProduct(token, id, product) {
  const data = await authorizedJson(`${API_URL}/admin/products/${id}`, token, {
    method: "PUT",
    body: JSON.stringify({
      ...product,
      price: parsePrice(product.priceValue ?? product.price),
    }),
  });

  return {
    ...data,
    product: data.product ? normalizeProduct(data.product) : null,
  };
}

export async function deleteProduct(token, id) {
  return authorizedJson(`${API_URL}/admin/products/${id}`, token, {
    method: "DELETE",
  });
}

export async function getAdminOrders(token) {
  const data = await authorizedJson(`${API_URL}/admin/orders`, token, { method: "GET" });
  return {
    ...data,
    orders: Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : [],
  };
}

export async function updateAdminOrder(token, id, payload) {
  const data = await authorizedJson(`${API_URL}/admin/orders/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return {
    ...data,
    order: data.order ? normalizeOrder(data.order) : null,
  };
}

export async function getAdminUsers(token) {
  return authorizedJson(`${API_URL}/admin/users`, token, { method: "GET" });
}

export async function updateAdminUser(token, username, payload) {
  return authorizedJson(`${API_URL}/admin/users/${username}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminCoupons(token) {
  const data = await authorizedJson(`${API_URL}/admin/coupons`, token, { method: "GET" });
  return {
    ...data,
    coupons: Array.isArray(data.coupons) ? data.coupons.map(normalizeCoupon) : [],
  };
}

export async function createCoupon(token, coupon) {
  const data = await authorizedJson(`${API_URL}/admin/coupons`, token, {
    method: "POST",
    body: JSON.stringify(coupon),
  });

  return {
    ...data,
    coupon: data.coupon ? normalizeCoupon(data.coupon) : null,
  };
}

export async function updateCoupon(token, id, coupon) {
  const data = await authorizedJson(`${API_URL}/admin/coupons/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(coupon),
  });

  return {
    ...data,
    coupon: data.coupon ? normalizeCoupon(data.coupon) : null,
  };
}

export async function deleteCoupon(token, id) {
  return authorizedJson(`${API_URL}/admin/coupons/${id}`, token, {
    method: "DELETE",
  });
}
