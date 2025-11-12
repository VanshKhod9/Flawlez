# Checkout & Payment Setup Guide

## Features Implemented

✅ **Cart Persistence**
- Cart items are automatically saved to the database when user is logged in
- Cart syncs across all devices for the same user account
- Cart is loaded when user logs in

✅ **Checkout Page**
- Complete checkout form with:
  - Full Name
  - Email Address
  - Mobile Number
  - Address, City, State, Zip Code, Country
- Order summary showing all cart items
- Total calculation

✅ **Payment Gateway Integration**
- Razorpay payment gateway integration
- Works in both development (simulation) and production (live payments) modes

## Setup Instructions

### 1. Database Setup
The server automatically creates the required tables:
- `carts` - Stores user cart data
- `orders` - Stores order information

### 2. Razorpay Payment Gateway Setup (Optional for Production)

#### For Development (Payment Simulation):
- No setup needed! The system will simulate payments automatically.

#### For Production (Real Payments):

1. **Get Razorpay API Keys:**
   - Sign up at https://razorpay.com
   - From the Razorpay dashboard copy your `Key ID` and `Key Secret`

2. **Update Server `.env` file:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:5173
   RAZORPAY_CURRENCY=INR
   ```

3. **Install dependencies:** (already added to `package.json`, run inside `server/`)
   ```bash
   npm install
   ```

### 3. How It Works

1. **Adding to Cart:**
   - User adds items to cart
   - Cart is automatically saved to database (if logged in)
   - Cart persists across devices and sessions

2. **Checkout Process:**
   - User clicks "Checkout" button in cart popup
   - Redirected to checkout page
   - Fills in shipping information
   - Clicks "Proceed to Payment"
   - If Razorpay is configured: Razorpay Checkout opens in a secure modal
   - If Razorpay is not configured: Order is placed directly (simulation mode)

3. **After Payment:**
   - User is redirected to success page
   - Cart is automatically cleared
   - Order is saved in database

## API Endpoints

- `POST /api/cart` - Save cart (requires authentication)
- `GET /api/cart` - Get user's cart (requires authentication)
- `POST /api/checkout` - Create order and (optionally) Razorpay checkout session (requires authentication)
- `POST /api/verify-payment` - Verify Razorpay payment signature (requires authentication)
- `GET /api/checkout-success/:orderId` - Get order details (requires authentication)

## Testing

### Test Payment Flow (Simulation Mode):
1. Add items to cart
2. Click checkout
3. Fill in form
4. Submit - Order will be placed in simulation mode

### Test Payment Flow (With Razorpay):
1. Add items to cart
2. Click checkout
3. Fill in form
4. Submit - Razorpay checkout modal will open
5. Use Razorpay test credentials (example: UPI `success@razorpay`, card `4111 1111 1111 1111`)
6. Complete payment
7. You will be redirected to the success page

## Notes

- Cart is automatically synced every 500ms after changes (debounced)
- Cart is cleared after successful order
- Orders are stored with full details in the database
- Payment status is tracked: `pending`, `pending_payment`, `completed`, `failed`

