import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const register = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    res.json({ message: "User registered successfully", success: true });
  } catch (error) {
    console.error("Register error:", error.message, error.code);
    if (error.code === "P2002") {
      res.json({ message: "Username already exists", success: false });
    } else {
      res.status(500).json({ message: "Server error: " + error.message, success: false });
    }
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) return res.json({ message: "User not found" });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.json({ message: "Invalid password" });

    const token = jwt.sign(
      { username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      accessToken: token,
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProtected = (req, res) => {
  res.json({ message: "Protected content", user: req.user });
};