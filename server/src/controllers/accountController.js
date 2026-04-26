import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { passwordMeetsRequirements, PASSWORD_REQUIREMENTS_MESSAGE } from "../utils/auth.js";

const requiredAddressFields = ["full_name", "line1", "city", "state", "postal_code", "country"];

const mapAddressPayload = (payload) => ({
  label: payload.label || "Default",
  fullName: payload.full_name,
  line1: payload.line1,
  line2: payload.line2 || null,
  city: payload.city,
  state: payload.state,
  postalCode: payload.postal_code,
  country: payload.country,
  phone: payload.phone || null,
});

const normalizeAddress = (address) => ({
  ...address,
  full_name: address.fullName,
  postal_code: address.postalCode,
});

const normalizeOrder = (order) => ({
  ...order,
  created_at: order.createdAt,
  payment_status: order.paymentStatus,
  order_data: order.orderData,
  items: Array.isArray(order.orderData) ? order.orderData : [],
  total: Number(order.total),
});

export const getAccount = async (req, res) => {
  try {
    const username = req.user.username;

    const [user, addresses, orders, subscription] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: {
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isAdmin: true,
          createdAt: true,
        },
      }),
      prisma.address.findMany({
        where: { username },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        where: { username },
        orderBy: { createdAt: "desc" },
      }),
      prisma.emailSubscription.findUnique({
        where: { username },
      }),
    ]);

    res.json({
      success: true,
      user,
      orders: orders.map(normalizeOrder),
      addresses: addresses.map(normalizeAddress),
      isSubscribed: Boolean(subscription),
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const addAddress = async (req, res) => {
  try {
    const username = req.user.username;
    const missingField = requiredAddressFields.find(
      (field) => !String(req.body[field] || "").trim()
    );

    if (missingField) {
      return res.status(400).json({
        message: `Missing address field: ${missingField}`,
        success: false,
      });
    }

    const address = await prisma.address.create({
      data: {
        username,
        ...mapAddressPayload(req.body),
      },
    });

    res.json({ success: true, address: normalizeAddress(address) });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const username = req.user.username;
    const addressId = Number(req.params.id);

    const address = await prisma.address.findFirst({
      where: { id: addressId, username },
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found.", success: false });
    }

    const updated = await prisma.address.update({
      where: { id: address.id },
      data: mapAddressPayload(req.body),
    });

    res.json({ success: true, address: normalizeAddress(updated) });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const username = req.user.username;
    const addressId = Number(req.params.id);

    const address = await prisma.address.findFirst({
      where: { id: addressId, username },
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found.", success: false });
    }

    await prisma.address.delete({
      where: { id: address.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const changePassword = async (req, res) => {
  try {
    const username = req.user.username;
    const { currentPassword, newPassword } = req.body;

    if (!passwordMeetsRequirements(newPassword)) {
      return res.status(400).json({
        message: PASSWORD_REQUIREMENTS_MESSAGE,
        success: false,
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found.", success: false });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Current password is incorrect.",
        success: false,
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { username },
      data: { password: hashedNewPassword },
    });

    res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const username = req.user.username;

    const subscription = await prisma.emailSubscription.findUnique({
      where: { username },
    });

    res.json({ success: true, isSubscribed: Boolean(subscription) });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const subscribeEmail = async (req, res) => {
  try {
    const username = req.user.username;
    const { email } = req.body;

    if (!String(email || "").trim()) {
      return res.status(400).json({ message: "Email is required.", success: false });
    }

    await prisma.emailSubscription.upsert({
      where: { username },
      update: { email },
      create: { username, email },
    });

    res.json({
      success: true,
      message: "Successfully subscribed to newsletter.",
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
