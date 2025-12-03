import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import ProtectedRoute from "./utils/ProtectedRoute";
import { CartProvider } from "./context/Cartcontext";
import BulkOrder from "./pages/Bulk-order/bulk-order";
import Story from "./pages/Story/story";
import Quiz from "./pages/Quiz/Quiz";
import Checkout from "./pages/Checkout/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess/CheckoutSuccess";
import Account from "./pages/Account/Account";
import EmailSubscriptionPopup from "./component/EmailSubscriptionPopup";
import Product from "./pages/Product/Product";

function App() {
  return (
    <CartProvider>
      <EmailSubscriptionPopup />
      <Router>
        <Routes>
          {/* Default route → go to home */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Public routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} /> {/* Made Home public */}
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

          {/* Optional fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
