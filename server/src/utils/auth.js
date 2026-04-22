import jwt from "jsonwebtoken";

const adminUsernames = () =>
  (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUsername = (username) =>
  adminUsernames().includes(String(username || "").trim().toLowerCase());

export const issueAccessToken = (user) =>
  (() => {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("Server authentication is not configured. Add ACCESS_TOKEN_SECRET on the backend.");
    }

    return jwt.sign(
      {
        username: user.username,
        isAdmin: Boolean(user.isAdmin),
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
  })();

export const normalizePhone = (phone) => {
  const normalized = String(phone || "").trim();
  const digits = normalized.replace(/\D/g, "");

  if (normalized.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return `+${digits}`;
};
