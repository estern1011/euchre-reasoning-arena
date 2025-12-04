/**
 * Default configuration values for the Euchre Reasoning Arena
 */

import type { Position } from "../game/types";

/** Default AI model assignments by position */
export const DEFAULT_MODEL_IDS: Record<Position, string> = {
  north: "anthropic/claude-haiku-4.5",
  east: "google/gemini-2.5-flash",
  south: "openai/gpt-5-mini",
  west: "xai/grok-4.1-fast-non-reasoning",
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
