import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { CartContext } from "../context/Cartcontext";
import { getStoredSession } from "./session";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser } = useContext(CartContext);
  const session = currentUser ? { user: currentUser } : getStoredSession();

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !session.user.isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
