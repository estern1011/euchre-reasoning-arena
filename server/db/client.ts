/// <reference types="bun-types" />

/**
 * Database client for Metacognition Arena
 * SQLite database for tracking games, decisions, and calibration metrics
 *
 * Vercel-safe: Returns null when running on Vercel without external DB configured
 * This allows the game to run without persistence in production
 */

import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

// Use dynamic import for bun:sqlite to avoid errors in non-Bun environments
let Database: typeof import("bun:sqlite").Database | null = null;
let db: InstanceType<typeof import("bun:sqlite").Database> | null = null;

/** Check if database is available in this environment */
export function isDatabaseAvailable(): boolean {
  // On Vercel, skip DB unless explicitly configured
  if (process.env.VERCEL && !process.env.ENABLE_DB) {
    return false;
  }
  return true;
}

/** Get or create the database connection (returns null if unavailable) */
export function getDb(): InstanceType<typeof import("bun:sqlite").Database> | null {
  if (!isDatabaseAvailable()) {
    return null;
  }

  if (db) return db;

  try {
    // Lazy load bun:sqlite
    if (!Database) {
      Database = require("bun:sqlite").Database;
    }

    const dbPath = process.env.DB_PATH || join(process.cwd(), "data", "euchre.db");

    // Ensure directory exists
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    db = new Database!(dbPath, { create: true });

    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // WAL mode for better concurrency
    db.run("PRAGMA journal_mode = WAL");

    console.log("[Database] Connected to", dbPath);
    return db;
  } catch (error) {
    console.warn("[Database] Failed to connect:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Initialize database with schema */
export function initializeDb(): boolean {
  const database = getDb();
  if (!database) {
    console.log("[Database] Skipping initialization (not available)");
    return false;
  }

  try {
    const schemaPath = join(process.cwd(), "server", "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Execute schema
    database.run(schema);

    console.log("[Database] Schema initialized successfully");
    return true;
  } catch (error) {
    console.error("[Database] Failed to initialize schema:", error);
    return false;
  }
}

/** Close database connection */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Run migrations (for future use) */
export function runMigrations(): void {
  if (!getDb()) {
    console.log("[Database] Skipping migrations (not available)");
    return;
  }
  console.log("[Database] No migrations to run");
}

// Export for convenience
export default getDb;
