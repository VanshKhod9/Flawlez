import prisma from "../config/prisma.js";

const serializeOrder = (order) => ({
  ...order,
  subtotal: Number(order.subtotal ?? 0),
  discountAmount: Number(order.discountAmount ?? 0),
  total: Number(order.total),
  orderData: Array.isArray(order.orderData) ? order.orderData : [],
});

export const getAdminOverview = async (_req, res) => {
  try {
    const [productCount, orderCount, userCount, pendingOrders, revenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.count({ where: { fulfillmentStatus: { not: "delivered" } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "paid" },
      }),
    ]);

    res.json({
      success: true,
      overview: {
        productCount,
        orderCount,
        userCount,
        pendingOrders,
        paidRevenue: Number(revenue._sum.total || 0),
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const listAdminOrders = async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, orders: orders.map(serializeOrder) });
  } catch (error) {
    console.error("List admin orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateAdminOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const fulfillmentStatus = String(req.body.fulfillmentStatus || order.fulfillmentStatus).trim();
    const paymentStatus = String(req.body.paymentStatus || order.paymentStatus).trim();

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus,
        paymentStatus,
      },
    });

    res.json({ success: true, order: serializeOrder(updated) });
  } catch (error) {
    console.error("Update admin order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const listAdminUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true, addresses: true },
        },
      },
    });

    res.json({
      success: true,
      users: users.map((user) => ({
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        orderCount: user._count.orders,
        addressCount: user._count.addresses,
      })),
    });
  } catch (error) {
    console.error("List admin users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const updated = await prisma.user.update({
      where: { username },
      data: {
        isAdmin: req.body.isAdmin ?? user.isAdmin,
        isVerified: req.body.isVerified ?? user.isVerified,
      },
    });

    res.json({
      success: true,
      user: {
        username: updated.username,
        isAdmin: updated.isAdmin,
        isVerified: updated.isVerified,
      },
    });
  } catch (error) {
    console.error("Update admin user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
