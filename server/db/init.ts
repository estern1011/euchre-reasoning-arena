/**
 * Database initialization script
 * Run this to create the database and schema
 */

import { initializeDb, closeDb } from "./client";

try {
  console.log("[Database] Initializing database...");
  initializeDb();
  console.log("[Database] ✓ Database initialized successfully");
  console.log("[Database] Location: data/euchre.db");
  closeDb();
} catch (error) {
  console.error("[Database] ✗ Failed to initialize:", error);
  process.exit(1);
}
