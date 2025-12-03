# Flawlez Coffee – A Modern Coffee E-Commerce Platform

**Frontend URL:** https://flawlez.vercel.app/  
**Backend URL:** https://flawlez.onrender.com

## Project Overview

Flawlez Coffee is a modern, full-stack e-commerce platform designed for coffee enthusiasts who demand quality and convenience. Our platform bridges the gap between coffee lovers and premium coffee products, offering a seamless shopping experience with comprehensive admin management capabilities.

## Problem Statement

Coffee lovers often struggle to find authentic, high-quality coffee products online with a seamless shopping experience. Flawlez Coffee aims to provide a one-stop e-commerce platform for premium coffee beans, equipment, and accessories — allowing users to browse, customize, and purchase effortlessly while providing admins with full product and order management capabilities.

## System Architecture

```
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐    SQL Queries    ┌─────────────────┐
│                 │ ◄──────────────► │                 │ ◄──────────────► │                 │
│   FRONTEND      │                  │    BACKEND      │                  │    DATABASE     │
│                 │                  │                 │                  │                 │
│  React.js       │                  │  Node.js        │                  │  PostgreSQL     │
│  ├─ React Router│                  │  ├─ Express.js  │                  │  ├─ users       │
│  ├─ Axios       │                  │  ├─ JWT Auth    │                  │  ├─ products    │
│  ├─ TailwindCSS │                  │  ├─ RESTful API │                  │  ├─ orders      │
│  └─ Vite        │                  │  └─ CORS        │                  │  └─ cart_items  │
│                 │                  │                 │                  │                 │
│  [Vercel]       │                  │   [Render]      │                  │   [Neon]        │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
        ▲                                      ▲                                      ▲
        │                                      │                                      │
        ▼                                      ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐                  ┌─────────────────┐
│     USERS       │                  │   API ROUTES    │                  │   DATA TABLES   │
│                 │                  │                 │                  │                 │
│ ◆ Customers     │                  │ ◆ /auth/*       │                  │ ◆ User Records  │
│ ◆ Admins        │                  │ ◆ /products/*   │                  │ ◆ Product Info  │
│ ◆ Guests        │                  │ ◆ /cart/*       │                  │ ◆ Order History │
│                 │                  │ ◆ /orders/*     │                  │ ◆ Cart Sessions │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

### Architecture Flow:
**Frontend (React.js) → Backend (Node.js + Express) → Database (PostgreSQL)**

### Structure Overview:
- **Frontend:** Built with React.js using React Router for navigation, Axios for API calls, and styled with Tailwind CSS
- **Backend:** Developed in Node.js using Express.js for RESTful APIs (authentication, product management, order processing)
- **Database:** PostgreSQL for relational data (tables: users, products, orders, cart_items)
- **Authentication:** Secure JWT-based login/signup for users and admin
- **Hosting:** Frontend → Vercel, Backend → Render, Database → Neon PostgreSQL

## Key Features

| Feature | Description |
|---------|-------------|
| **Authentication & Authorization** | User registration, login, logout, JWT-based session management, admin dashboard |
| **Product Management (CRUD)** | Admin can create, update, delete, and view products (name, price, image, stock, description) |
| **Shopping Cart & Checkout** | Users can add products to cart, view total, and checkout |
| **Order Management** | Admin can track orders and update status (Pending, Shipped, Delivered) |
| **Frontend Routing** | Pages: Home, Shop, Product Details, Cart, Login, Register, Dashboard |
| **Search & Filters** | Filter coffee by roast type, origin, or flavor notes |
| **Responsive Design** | Mobile-friendly UI built with TailwindCSS |
| **Email Subscriptions** | Newsletter signup with popup functionality |

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React.js, React Router, Axios, TailwindCSS, Vite |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon) |
| **Authentication** | JWT (JSON Web Token) |
| **Hosting** | Vercel (frontend), Render (backend), Neon (database) |
| **Version Control** | Git + GitHub |

## API Overview

| Endpoint | Method | Description | Access Level |
|----------|--------|-------------|--------------|
| `/api/auth/signup` | POST | Register new user | Public |
| `/api/auth/login` | POST | Authenticate user | Public |
| `/api/products` | GET | Get all coffee products | Public |
| `/api/products/:id` | GET | Get product details | Public |
| `/api/products` | POST | Add new product | Admin |
| `/api/products/:id` | PUT | Update product | Admin |
| `/api/products/:id` | DELETE | Delete product | Admin |
| `/api/cart` | GET | Get user's cart items | Authenticated |
| `/api/cart` | POST | Add item to cart | Authenticated |
| `/api/cart/:id` | DELETE | Remove item from cart | Authenticated |
| `/api/orders` | POST | Place a new order | Authenticated |
| `/api/orders/:id` | PUT | Update order status | Admin |

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coffee
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` files in both root and server directories:
   
   **Root `.env`:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```
   
   **Server `.env`:**
   ```env
   PORT=3000
   ACCESS_TOKEN_SECRET=your_jwt_secret
   DATABASE_URL=your_postgresql_connection_string
   ```

5. **Run the application**
   
   **Backend (from server directory):**
   ```bash
   npm start
   ```
   
   **Frontend (from root directory):**
   ```bash
   npm run dev
   ```

## Project Structure

```
coffee/
├── public/                 # Static assets and images
├── src/
│   ├── assets/            # Application assets
│   ├── component/         # Reusable React components
│   ├── context/           # React Context providers
│   ├── data/              # Static data files
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   ├── api.js             # API configuration
│   └── App.jsx            # Main application component
├── server/
│   ├── server.js          # Express server setup
│   └── package.json       # Backend dependencies
└── README.md
```

## Features in Detail

### User Features
- **Product Browsing:** View coffee products with detailed descriptions and images
- **Shopping Cart:** Add/remove items with real-time total calculation
- **User Authentication:** Secure login and registration system
- **Order Tracking:** View order history and status updates
- **Responsive Design:** Optimized for desktop and mobile devices

### Admin Features
- **Product Management:** Full CRUD operations for coffee products
- **Order Management:** Track and update order statuses
- **User Management:** View registered users and their activities
- **Dashboard Analytics:** Overview of sales and inventory

## Security Features

- JWT-based authentication
- Password hashing
- Protected routes for admin functionality
- Input validation and sanitization
- CORS configuration for secure API access

## Deployment

The application is deployed using modern cloud platforms:

- **Frontend:** Deployed on Vercel with automatic deployments from GitHub
- **Backend:** Hosted on Render with environment variable management
- **Database:** PostgreSQL database hosted on Neon with SSL encryption

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please reach out through the contact form on our website or create an issue in this repository.

---

**Live Application:** [Flawlez Coffee](https://flawlez.vercel.app/)