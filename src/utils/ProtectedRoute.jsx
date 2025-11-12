import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // simulate checking localStorage token (like a short delay)
    const token = localStorage.getItem("token");
    console.log("ProtectedRoute token:", token);
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    // Add a short delay so React finishes updating before redirecting
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100); // 100ms delay fixes the blink
    return () => clearTimeout(timer);
  }, []);

  // While checking, return nothing (prevents flicker)
  if (isChecking) {
    return null;
  }

  // If no token → go back to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise render the protected page
  return children;
}
