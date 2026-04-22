import prisma from "./prisma.js";
import { DEFAULT_PRODUCTS } from "../data/defaultProducts.js";

export async function initializeTables() {
  try {
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `;

    await prisma.$executeRaw`
      UPDATE users 
      SET first_name = COALESCE(first_name, 'User'),
          last_name = COALESCE(last_name, 'Name')
      WHERE first_name IS NULL OR last_name IS NULL
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        short_description TEXT NOT NULL,
        long_description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image TEXT NOT NULL,
        gallery JSONB,
        benefits JSONB,
        tag VARCHAR(255),
        notes JSONB,
        roast VARCHAR(255),
        origin VARCHAR(255),
        process VARCHAR(255),
        stock INTEGER NOT NULL DEFAULT 50,
        featured BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        min_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
        max_discount DECIMAL(10, 2),
        usage_limit INTEGER,
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        starts_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS gallery JSONB,
      ADD COLUMN IF NOT EXISTS benefits JSONB,
      ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 50,
      ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false
    `;

    await prisma.$executeRaw`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(255),
      ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(255) NOT NULL DEFAULT 'processing',
      ADD COLUMN IF NOT EXISTS payment_error TEXT
    `;

    const productCount = await prisma.product.count();

    if (productCount === 0) {
      await prisma.product.createMany({
        data: DEFAULT_PRODUCTS.map((product) => ({
          ...product,
          notes: product.notes,
        })),
      });
    }

  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}
