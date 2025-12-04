// Read API base URL from Vite env var `VITE_API_URL` set in production (Vercel).
// Local development: create a top-level `.env` with `VITE_API_URL=http://localhost:3000/api`
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function register(username, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getProtected(token) {
  const res = await fetch(`${API_URL}/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Cart API functions
export async function saveCart(token, cart) {
  const res = await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cart }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || res.statusText };
    }
    throw new Error(errorData.message || `Failed to save cart: ${res.status}`);
  }
  
  return res.json();
}

export async function getCart(token) {
  const res = await fetch(`${API_URL}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || res.statusText };
    }
    throw new Error(errorData.message || `Failed to get cart: ${res.status}`);
  }
  
  return res.json();
}

// Checkout API functions
export async function createCheckoutSession(token, checkoutData) {
  const res = await fetch(`${API_URL}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(checkoutData),
  });
  return res.json();
}

export async function verifyPayment(token, payload) {
  const res = await fetch(`${API_URL}/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

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
    
    // Handle 401 Unauthorized (invalid/expired token)
    if (res.status === 401) {
      // Clear invalid token from localStorage
      localStorage.removeItem("token");
      // Create error message that Account page can recognize
      const error = new Error(message || "Token expired - please login again");
      error.status = 401;
      throw error;
    }
    
    throw new Error(message);
  }

  return data;
}

export async function getAccount(token) {
  const res = await fetch(`${API_URL}/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJsonResponse(res);
}

export async function addAddress(token, address) {
  const res = await fetch(`${API_URL}/account/address`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(address),
  });
  return handleJsonResponse(res);
}

export async function updateAddress(token, id, address) {
  const res = await fetch(`${API_URL}/account/address/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(address),
  });
  return handleJsonResponse(res);
}

export async function deleteAddress(token, id) {
  const res = await fetch(`${API_URL}/account/address/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse(res);
}

export async function changePassword(token, data) {
  const res = await fetch(`${API_URL}/account/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse(res);
}

// Email subscription API functions
export async function getSubscriptionStatus(token) {
  const res = await fetch(`${API_URL}/subscription/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJsonResponse(res);
}

export async function subscribeEmail(token, email) {
  const res = await fetch(`${API_URL}/subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return handleJsonResponse(res);
}

// Review API functions
export async function getReviews() {
  const res = await fetch(`${API_URL}/reviews`);
  return handleJsonResponse(res);
}

export async function addReview(token, review) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(review),
  });
  return handleJsonResponse(res);
}

export async function updateReview(token, id, review) {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(review),
  });
  return handleJsonResponse(res);
}

export async function deleteReview(token, id) {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse(res);
}
