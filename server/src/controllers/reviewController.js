import prisma from "../config/prisma.js";

export const getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    const reviewsWithOwnership = reviews.map(review => ({
      ...review,
      username: review.user.username,
      isOwner: req.user ? review.username === req.user.username : false
    }));

    res.json(reviewsWithOwnership);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const username = req.user.username;

    const review = await prisma.review.create({
      data: {
        username,
        rating,
        comment,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.json({ 
      success: true, 
      review: {
        ...review,
        username: review.user.username,
        isOwner: true
      }
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const username = req.user.username;

    const review = await prisma.review.update({
      where: {
        id: parseInt(id),
        username, // Ensure user can only update their own reviews
      },
      data: {
        rating,
        comment,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.json({ 
      success: true, 
      review: {
        ...review,
        username: review.user.username,
        isOwner: true
      }
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user.username;

    await prisma.review.delete({
      where: {
        id: parseInt(id),
        username, // Ensure user can only delete their own reviews
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
  }
};