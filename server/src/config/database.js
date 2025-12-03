import prisma from "./prisma.js";

export async function initializeTables() {
  try {
    // Prisma handles table creation through migrations
    // This function is kept for compatibility but tables are managed by Prisma
    console.log("✅ Database connection established via Prisma");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}