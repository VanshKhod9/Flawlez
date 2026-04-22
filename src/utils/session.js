export const parseJwt = (token) => {
  try {
    const [, payload] = String(token || "").split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch {
    return null;
  }
};

export const getStoredSession = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return { token: null, user: null };
  }

  return {
    token,
    user: parseJwt(token),
  };
};
