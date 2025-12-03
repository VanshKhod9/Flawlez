import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

export const getAccount = async (req, res) => {
  try {
    const username = req.user.username;
    
    const addresses = await prisma.address.findMany({
      where: { username },
      orderBy: { createdAt: 'desc' },
    });

    const subscription = await prisma.emailSubscription.findUnique({
      where: { username },
    });

    res.json({
      username,
      addresses,
      isSubscribed: !!subscription,
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const username = req.user.username;
    const { label, full_name, line1, line2, city, state, postal_code, country, phone } = req.body;

    const address = await prisma.address.create({
      data: {
        username,
        label,
        fullName: full_name,
        line1,
        line2,
        city,
        state,
        postalCode: postal_code,
        country,
        phone,
      },
    });

    res.json({ success: true, address });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const username = req.user.username;
    const { id } = req.params;
    const { label, full_name, line1, line2, city, state, postal_code, country, phone } = req.body;

    const address = await prisma.address.update({
      where: {
        id: parseInt(id),
        username,
      },
      data: {
        label,
        fullName: full_name,
        line1,
        line2,
        city,
        state,
        postalCode: postal_code,
        country,
        phone,
      },
    });

    res.json({ success: true, address });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const username = req.user.username;
    const { id } = req.params;

    await prisma.address.delete({
      where: {
        id: parseInt(id),
        username,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const username = req.user.username;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { password: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { username },
      data: { password: hashedNewPassword },
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const username = req.user.username;
    
    const subscription = await prisma.emailSubscription.findUnique({
      where: { username },
    });

    res.json({ isSubscribed: !!subscription });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const subscribeEmail = async (req, res) => {
  try {
    const username = req.user.username;
    const { email } = req.body;

    await prisma.emailSubscription.upsert({
      where: { username },
      update: { email },
      create: { username, email },
    });

    res.json({ success: true, message: "Successfully subscribed to newsletter" });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ message: "Server error" });
  }
};