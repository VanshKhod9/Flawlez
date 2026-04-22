import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { isAdminUsername, issueAccessToken, normalizePhone } from "../utils/auth.js";

const verifyMsg91AccessToken = async (accessToken) => {
  if (!process.env.MSG91_AUTH_KEY) {
    throw new Error("MSG91 is not configured on the server");
  }

  const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      authkey: process.env.MSG91_AUTH_KEY,
      "access-token": accessToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to verify OTP with MSG91");
  }

  const data = await response.json();

  if (data.type !== "success") {
    throw new Error("OTP verification failed");
  }

  return data;
};

const validatePassword = (password) => String(password || "").trim().length >= 8;

const getConflictMessage = (users, username, phone) => {
  if (users.some((user) => user.username === username && user.isVerified)) {
    return "Username already exists.";
  }

  if (users.some((user) => user.phone === phone && user.isVerified)) {
    return "Phone number already registered.";
  }

  return "";
};

export const register = async (req, res) => {
  const { username, password, phone } = req.body;
  const trimmedUsername = String(username || "").trim();
  const normalizedPhone = normalizePhone(phone);

  if (!trimmedUsername || !password || !phone) {
    return res
      .status(400)
      .json({ message: "Username, password, and phone are required.", success: false });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long.",
      success: false,
    });
  }

  try {
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [{ username: trimmedUsername }, { phone: normalizedPhone }],
      },
    });

    const conflictMessage = getConflictMessage(existingUsers, trimmedUsername, normalizedPhone);

    if (conflictMessage) {
      return res.json({
        message: conflictMessage,
        success: false,
      });
    }

    res.json({ success: true, phone: normalizedPhone });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const completeRegister = async (req, res) => {
  const { username, password, phone, accessToken } = req.body;
  const trimmedUsername = String(username || "").trim();
  const normalizedPhone = normalizePhone(phone);

  if (!trimmedUsername || !password || !phone || !accessToken) {
    return res.status(400).json({
      message: "Username, password, phone, and OTP access token are required.",
      success: false,
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long.",
      success: false,
    });
  }

  try {
    await verifyMsg91AccessToken(accessToken);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const existingUsers = await tx.user.findMany({
        where: {
          OR: [{ username: trimmedUsername }, { phone: normalizedPhone }],
        },
      });

      const conflictMessage = getConflictMessage(existingUsers, trimmedUsername, normalizedPhone);
      if (conflictMessage) {
        const error = new Error(conflictMessage);
        error.name = "RegisterConflict";
        throw error;
      }

      const staleUsers = existingUsers.filter((existingUser) => !existingUser.isVerified);
      if (staleUsers.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: {
              in: staleUsers.map((existingUser) => existingUser.id),
            },
          },
        });
      }

      return tx.user.create({
        data: {
          username: trimmedUsername,
          password: hashedPassword,
          phone: normalizedPhone,
          isVerified: true,
          isAdmin: isAdminUsername(trimmedUsername),
        },
      });
    });

    res.json({
      success: true,
      accessToken: issueAccessToken(user),
      message: "Registration successful.",
      user: {
        username: user.username,
        isAdmin: Boolean(user.isAdmin),
      },
    });
  } catch (error) {
    console.error("Complete register error:", error);
    const message =
      error.message === "OTP verification failed" || error.name === "RegisterConflict"
        ? error.message
        : error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Username or phone number is already registered."
          : "Server error";
    res.status(message === "Server error" ? 500 : 400).json({ message, success: false });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = String(username || "").trim();

  if (!trimmedUsername || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
      success: false,
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username: trimmedUsername } });

    if (!user) {
      return res.status(404).json({ message: "User not found.", success: false });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Account not verified. Complete signup with OTP first.",
        success: false,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password.", success: false });
    }

    res.json({ success: true, phone: user.phone });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const completeLogin = async (req, res) => {
  const { username, accessToken } = req.body;
  const trimmedUsername = String(username || "").trim();

  if (!trimmedUsername || !accessToken) {
    return res.status(400).json({
      message: "Username and OTP access token are required.",
      success: false,
    });
  }

  try {
    await verifyMsg91AccessToken(accessToken);

    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found.", success: false });
    }

    const updatedUser =
      user.isAdmin === isAdminUsername(trimmedUsername)
        ? user
        : await prisma.user.update({
            where: { username: trimmedUsername },
            data: { isAdmin: isAdminUsername(trimmedUsername) },
          });

    res.json({
      success: true,
      accessToken: issueAccessToken(updatedUser),
      message: "Login successful.",
      user: {
        username: updatedUser.username,
        isAdmin: Boolean(updatedUser.isAdmin),
      },
    });
  } catch (error) {
    console.error("Complete login error:", error);
    const message = error.message === "OTP verification failed" ? error.message : "Server error";
    res.status(message === "Server error" ? 500 : 400).json({ message, success: false });
  }
};

export const getProtected = (req, res) => {
  res.json({ success: true, message: "Protected content", user: req.user });
};
