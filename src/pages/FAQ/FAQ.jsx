import React, { useState, useContext, useEffect } from "react";
import { CartContext } from "../../context/Cartcontext";
import { getReviews, addReview, updateReview, deleteReview } from "../../api";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import { PRODUCTS } from "../../data/products";
import "./FAQ.css";

const FAQ_DATA = [
  {
    question: "What types of coffee do you offer?",
    answer: "We offer premium single-origin and blend coffees including light, medium, and dark roasts. Our selection includes fruity, chocolatey, and balanced flavor profiles."
  },
  {
    question: "How fresh is your coffee?",
    answer: "All our coffee is roasted to order and shipped within 48 hours of roasting to ensure maximum freshness and flavor."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, we ship within India. International shipping options are coming soon!"
  },
  {
    question: "What's your return policy?",
    answer: "We offer a 30-day satisfaction guarantee. If you're not happy with your coffee, contact us for a full refund or exchange."
  },
  {
    question: "How should I store my coffee?",
    answer: "Store coffee in an airtight container in a cool, dry place away from direct sunlight. Avoid refrigerating whole beans."
  }
];

export default function FAQ() {
  const { isLoggedIn } = useContext(CartContext);
  const [activeTab, setActiveTab] = useState("faq");
  const [openFAQ, setOpenFAQ] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    if (activeTab === "reviews") {
      loadReviews();
    }
  }, [activeTab]);

  const loadReviews = async () => {
    try {
      const data = await getReviews();
      setReviews(data || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please login to post a review");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await addReview(token, newReview);
      setNewReview({ rating: 5, comment: "" });
      loadReviews();
    } catch (error) {
      alert("Failed to add review: " + error.message);
    }
  };

  const handleUpdateReview = async (id, updatedReview) => {
    try {
      const token = localStorage.getItem("token");
      await updateReview(token, id, updatedReview);
      setEditingReview(null);
      loadReviews();
    } catch (error) {
      alert("Failed to update review: " + error.message);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await deleteReview(token, id);
      loadReviews();
    } catch (error) {
      alert("Failed to delete review: " + error.message);
    }
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={PRODUCTS} />
      <div className="faq-container">
        <div className="faq-header">
          <h1>Help & Reviews</h1>
          <div className="faq-tabs">
            <button 
              className={activeTab === "faq" ? "active" : ""}
              onClick={() => setActiveTab("faq")}
            >
              FAQ
            </button>
            <button 
              className={activeTab === "reviews" ? "active" : ""}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </button>
          </div>
        </div>

        {activeTab === "faq" && (
          <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            {FAQ_DATA.map((item, index) => (
              <div key={index} className="faq-item">
                <button 
                  className="faq-question"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  {item.question}
                  <span>{openFAQ === index ? "−" : "+"}</span>
                </button>
                {openFAQ === index && (
                  <div className="faq-answer">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="reviews-section">
            <h2>Customer Reviews</h2>
            
            {isLoggedIn && (
              <form onSubmit={handleAddReview} className="review-form">
                <h3>Write a Review</h3>
                <div className="rating-input">
                  <label>Rating:</label>
                  <select 
                    value={newReview.rating} 
                    onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                  >
                    {[5,4,3,2,1].map(num => (
                      <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Share your experience..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  required
                />
                <button type="submit">Post Review</button>
              </form>
            )}

            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p>No reviews yet. Be the first to write one!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-item">
                  {editingReview === review.id ? (
                    <EditReviewForm 
                      review={review}
                      onSave={(updatedReview) => handleUpdateReview(review.id, updatedReview)}
                      onCancel={() => setEditingReview(null)}
                    />
                  ) : (
                    <>
                      <div className="review-header">
                        <span className="review-author">{review.username}</span>
                        <span className="review-rating">{"★".repeat(review.rating)}</span>
                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      {isLoggedIn && review.isOwner && (
                        <div className="review-actions">
                          <button onClick={() => setEditingReview(review.id)}>Edit</button>
                          <button onClick={() => handleDeleteReview(review.id)}>Delete</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function EditReviewForm({ review, onSave, onCancel }) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ rating, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="edit-review-form">
      <div className="rating-input">
        <label>Rating:</label>
        <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
          {[5,4,3,2,1].map(num => (
            <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />
      <div className="edit-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}