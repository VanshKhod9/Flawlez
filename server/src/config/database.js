import prisma from "./prisma.js";

export async function initializeTables() {
  try {
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