import prisma from "../config/prisma.js";

const normalizeReview = (review, currentUser) => ({
  ...review,
  isOwner: currentUser ? review.username === currentUser : false,
});

export const getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
    });

    const currentUser = req.user?.username;
    res.json(reviews.map((review) => normalizeReview(review, currentUser)));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const username = req.user.username;

    if (!Number.isFinite(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    if (!String(comment || "").trim()) {
      return res.status(400).json({ success: false, message: "Comment is required." });
    }

    const review = await prisma.review.create({
      data: {
        username,
        rating: Number(rating),
        comment: String(comment).trim(),
      },
    });

    res.json({
      success: true,
      review: normalizeReview(review, username),
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const username = req.user.username;
    const review = await prisma.review.findFirst({
      where: {
        id: Number(req.params.id),
        username,
      },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        rating: Number(req.body.rating),
        comment: String(req.body.comment || "").trim(),
      },
    });

    res.json({
      success: true,
      review: normalizeReview(updated, username),
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const username = req.user.username;
    const review = await prisma.review.findFirst({
      where: {
        id: Number(req.params.id),
        username,
      },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    await prisma.review.delete({
      where: { id: review.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
  }
};
