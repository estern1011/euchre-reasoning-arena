/**
 * Demo preset configurations for Metacognition Arena
 * These presets are designed to showcase different aspects of model calibration
 */

import type { Position } from "../game/types";

export interface DemoPreset {
  name: string;
  description: string;
  modelIds: Record<Position, string>;
  narrative: string;
  expectedOutcome: string;
}

export const DEMO_PRESETS: Record<string, DemoPreset> = {
  budgetBattle: {
    name: "Budget Battle",
    description: "Ultra-cheap models ($0.10-0.30/M) - test for overconfidence",
    modelIds: {
      north: "google/gemini-2.5-flash-lite",  // $0.10/M
      east: "xai/grok-code-fast-1",           // $0.20/M
      south: "openai/gpt-5-mini",             // $0.25/M
      west: "google/gemini-2.5-flash",        // $0.30/M
    },
    narrative: "Watch how the cheapest models play. Do they know when they're uncertain?",
    expectedOutcome: "Expect high confidence even on poor decisions - classic Dunning-Kruger effect",
  },

  premiumShowdown: {
    name: "Premium Showdown",
    description: "Top-tier models ($1.00-3.00/M) - benchmark calibration quality",
    modelIds: {
      north: "anthropic/claude-sonnet-4.5",   // $3.00/M
      east: "google/gemini-3-pro-preview",    // $2.00/M
      south: "openai/gpt-5",                  // $1.25/M
      west: "anthropic/claude-haiku-4.5",     // $1.00/M
    },
    narrative: "Premium models competing - notice the confident vs uncertain tool use",
    expectedOutcome: "Lower confidence scores, smarter tool usage, better calibration metrics",
  },

  reasoningTest: {
    name: "Reasoning Test",
    description: "Reasoning models vs standard models - the research question",
    modelIds: {
      north: "openai/o3-mini",                // Reasoning model
      east: "deepseek/deepseek-r1",           // Reasoning model
      south: "openai/gpt-5",                  // Standard flagship
      west: "anthropic/claude-sonnet-4.5",    // Standard flagship
    },
    narrative: "Do reasoning models have better metacognition? Let's find out!",
    expectedOutcome: "Test if extended chain-of-thought improves self-awareness and calibration",
  },

  diverseShowcase: {
    name: "Diverse Showcase",
    description: "Mix of tiers and providers - balanced demonstration",
    modelIds: {
      north: "anthropic/claude-haiku-4.5",    // Fast Claude
      east: "google/gemini-2.5-flash",        // Fast Gemini
      south: "openai/gpt-5-mini",             // Fast OpenAI
      west: "xai/grok-code-fast-1",           // Fast xAI
    },
    narrative: "Four different providers, all fast models - compare their reasoning styles",
    expectedOutcome: "Interesting diversity in decision-making and tool usage patterns",
  },

  cheapVsPremium: {
    name: "Cheap vs Premium",
    description: "Direct comparison - teams of cheap vs expensive models",
    modelIds: {
      north: "anthropic/claude-sonnet-4.5",   // Premium ($3.00/M)
      east: "google/gemini-2.5-flash-lite",   // Cheap ($0.10/M)
      south: "openai/gpt-5",                  // Premium ($1.25/M)
      west: "openai/gpt-5-mini",              // Cheap ($0.25/M)
    },
    narrative: "North-South (premium) vs East-West (budget) - who wins?",
    expectedOutcome: "Premium team should have better calibration, but will they win the game?",
  },
};

/** Get all preset names */
export function getPresetNames(): string[] {
  return Object.keys(DEMO_PRESETS);
}

/** Get a preset by name */
export function getPreset(name: string): DemoPreset | undefined {
  return DEMO_PRESETS[name];
}

/** Apply a preset to model IDs */
export function applyPreset(name: string): Record<Position, string> | null {
  const preset = DEMO_PRESETS[name];
  return preset ? preset.modelIds : null;
}
