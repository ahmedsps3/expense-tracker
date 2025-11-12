import { execSync } from "child_process";

export async function initializeDatabase() {
  try {
    console.log("[DB] Initializing database...");
    
    // Run drizzle migrations
    console.log("[DB] Running migrations...");
    execSync("pnpm exec drizzle-kit generate", { stdio: "inherit" });
    execSync("pnpm exec drizzle-kit migrate", { stdio: "inherit" });
    
    console.log("[DB] Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    // Don't fail the server startup, just log the error
    return false;
  }
}
