/**
 * Default configuration values for the Euchre Reasoning Arena
 */

import type { Position } from "../game/types";

/** Default AI model assignments by position - diverse showcase across tiers */
export const DEFAULT_MODEL_IDS: Record<Position, string> = {
  north: "anthropic/claude-haiku-4.5",     // Tier 2: Fast & Balanced ($1.00/M)
  east: "google/gemini-2.5-flash",         // Tier 2: Fast & Balanced ($0.30/M)
  south: "openai/gpt-5-mini",              // Tier 1: Ultra-Fast & Cheap ($0.25/M)
  west: "openai/o3-mini",                   // Tier 2: Reasoning model
} as const;

/** Get default model IDs as a tuple for API calls */
export function getDefaultModelIdsArray(): [string, string, string, string] {
  return [
    DEFAULT_MODEL_IDS.north,
    DEFAULT_MODEL_IDS.east,
    DEFAULT_MODEL_IDS.south,
    DEFAULT_MODEL_IDS.west,
  ];
}
