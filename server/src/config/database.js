import prisma from "./prisma.js";

export async function initializeTables() {
  try {
    // Update users table to include new fields
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `;
    
    // Update existing users with default values for NULL fields
    await prisma.$executeRaw`
      UPDATE users 
      SET first_name = COALESCE(first_name, 'User'),
          last_name = COALESCE(last_name, 'Name')
      WHERE first_name IS NULL OR last_name IS NULL
    `;
    
    // Create reviews table manually since migration failed
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log("✅ Database connection established via Prisma");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}