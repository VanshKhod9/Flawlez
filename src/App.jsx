import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute";
import ScrollToTop from "./utils/ScrollToTop";
import { CartProvider } from "./context/Cartcontext";
import { ProductProvider } from "./context/ProductContext";
import EmailSubscriptionPopup from "./component/EmailSubscriptionPopup";

const Signup = lazy(() => import("./pages/Signup/Signup"));
const Login = lazy(() => import("./pages/Login/Login"));
const Home = lazy(() => import("./pages/Home/Home"));
const BulkOrder = lazy(() => import("./pages/Bulk-order/bulk-order"));
const Story = lazy(() => import("./pages/Story/story"));
const Quiz = lazy(() => import("./pages/Quiz/Quiz"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess/CheckoutSuccess"));
const Account = lazy(() => import("./pages/Account/Account"));
const Product = lazy(() => import("./pages/Product/Product"));
const FAQ = lazy(() => import("./pages/FAQ/FAQ"));
const Admin = lazy(() => import("./pages/Admin/Admin"));

function App() {
  return (
    <CartProvider>
      <ProductProvider>
        <EmailSubscriptionPopup />
        <Router>
          <ScrollToTop />
          <Suspense fallback={<div style={{ padding: "32px" }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/bulk-order" element={<BulkOrder />} />
              <Route path="/story" element={<Story />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout-success"
                element={
                  <ProtectedRoute>
                    <CheckoutSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/faq" element={<FAQ />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ProductProvider>
    </CartProvider>
  );
}

export default App;
