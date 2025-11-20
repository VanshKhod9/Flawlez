import React, { useState } from "react";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import "./Quiz.css";

const searchProducts = [
  {
    id: "sermon",
    name: "SERMON",
    description: "FRUITY & DECADENT · MEDIUM ROAST",
    price: "₹550.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "streetlevel",
    name: "STREETLEVEL",
    description: "SWEET & BALANCED · MEDIUM ROAST",
    price: "₹520.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "aster",
    name: "ASTER",
    description: "VIBRANT & COMPLEX · MEDIUM ROAST",
    price: "₹540.00",
    image: "/Flawlez 2.png",
  },
];

const quizQuestions = [
  {
    id: 1,
    question: "How do you prefer your coffee?",
    options: [
      { text: "Strong and bold", value: "bold" },
      { text: "Smooth and balanced", value: "balanced" },
      { text: "Light and fruity", value: "fruity" },
      { text: "Rich and chocolatey", value: "chocolatey" },
    ],
  },
  {
    id: 2,
    question: "What's your brewing method?",
    options: [
      { text: "Espresso", value: "espresso" },
      { text: "Pour Over / Filter", value: "filter" },
      { text: "French Press", value: "frenchpress" },
      { text: "Cold Brew", value: "coldbrew" },
    ],
  },
  {
    id: 3,
    question: "When do you enjoy coffee most?",
    options: [
      { text: "Morning kickstart", value: "morning" },
      { text: "Afternoon pick-me-up", value: "afternoon" },
      { text: "Evening relaxation", value: "evening" },
      { text: "Anytime!", value: "anytime" },
    ],
  },
  {
    id: 4,
    question: "What flavor notes excite you?",
    options: [
      { text: "Citrus & Berry", value: "citrus" },
      { text: "Nutty & Caramel", value: "nutty" },
      { text: "Floral & Tea-like", value: "floral" },
      { text: "Spicy & Complex", value: "spicy" },
    ],
  },
];

const recommendations = {
  bold: {
    name: "SERMON",
    description: "FRUITY & DECADENT · MEDIUM ROAST",
    reason: "Perfect for those who love bold, intense flavors with fruity notes.",
  },
  balanced: {
    name: "STREETLEVEL",
    description: "SWEET & BALANCED · MEDIUM ROAST",
    reason: "A smooth, balanced cup that's perfect for any time of day.",
  },
  fruity: {
    name: "ASTER",
    description: "VIBRANT & COMPLEX · MEDIUM ROAST",
    reason: "Bright and complex with vibrant fruit notes that dance on your palate.",
  },
  chocolatey: {
    name: "SERMON",
    description: "FRUITY & DECADENT · MEDIUM ROAST",
    reason: "Rich and decadent with deep, chocolatey undertones.",
  },
};

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleAnswer = (value) => {
    const questionId = quizQuestions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate recommendation based on answers
      calculateRecommendation(newAnswers);
    }
  };

  const calculateRecommendation = (allAnswers) => {
    // Simple recommendation logic based on first question (preference)
    const preference = allAnswers[1]; // First question answer
    
    let rec;
    if (preference === "bold" || preference === "chocolatey") {
      rec = recommendations.bold;
    } else if (preference === "balanced") {
      rec = recommendations.balanced;
    } else {
      rec = recommendations.fruity;
    }

    setRecommendation(rec);
    setShowResult(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setRecommendation(null);
  };

  const currentQ = quizQuestions[currentQuestion];

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={searchProducts} />
      
      <main className="quiz-page">
        <div className="quiz-container">
          {!showResult ? (
            <>
              <div className="quiz-header">
                <h1>Find Your Perfect Coffee</h1>
                <p>Answer a few questions and we'll recommend the perfect roast for you</p>
                <div className="quiz-progress">
                  <div 
                    className="quiz-progress-bar" 
                    style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                  ></div>
                </div>
                <p className="quiz-progress-text">
                  Question {currentQuestion + 1} of {quizQuestions.length}
                </p>
              </div>

              <div className="quiz-question-card">
                <h2>{currentQ.question}</h2>
                <div className="quiz-options">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      className="quiz-option-btn"
                      onClick={() => handleAnswer(option.value)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="quiz-result">
              <div className="result-icon">☕</div>
              <h2>Your Perfect Match!</h2>
              <div className="recommendation-card">
                <h3>{recommendation.name}</h3>
                <p className="recommendation-description">{recommendation.description}</p>
                <p className="recommendation-reason">{recommendation.reason}</p>
                <button className="quiz-shop-btn" onClick={() => window.location.href = "/home"}>
                  Shop {recommendation.name}
                </button>
              </div>
              <button className="quiz-retry-btn" onClick={resetQuiz}>
                Take Quiz Again
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
}

