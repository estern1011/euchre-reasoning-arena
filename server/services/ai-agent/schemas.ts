import { z } from "zod";
import type { Suit } from "../../../lib/game/types";

/**
 * Zod schemas for AI agent structured output
 * Context-specific schemas ensure SDK enforces valid responses
 */

export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export const RANKS = ["9", "10", "jack", "queen", "king", "ace"] as const;

// Tool options available to agents (Metacognition Arena)
export const TOOL_OPTIONS = ["none", "ask_audience", "situation_lookup", "fifty_fifty"] as const;
export type ToolOption = typeof TOOL_OPTIONS[number];

// =============================================================================
// Card Play Schema
// =============================================================================

export const CardPlaySchema = z.object({
  confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
  toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain. Tools cost points but can improve decisions."),
  reasoning: z.string().describe("Your strategic analysis of the trick and why you chose this card"),
  rank: z.enum(RANKS).describe("The rank of the card to play"),
  suit: z.enum(SUITS).describe("The suit of the card to play"),
});

export type CardPlayResponse = z.infer<typeof CardPlaySchema>;

// =============================================================================
// Trump Bid Schemas - Context-specific for SDK enforcement
// =============================================================================

// Round 1: Can only order_up or pass. No suit field needed.
export const TrumpBidRound1Schema = z.object({
  confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
  toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain."),
  reasoning: z.string().describe("Your analysis of your hand strength and why you made this decision"),
  action: z.enum(["pass", "order_up"]).describe("Your bidding decision"),
  goingAlone: z.boolean().describe("Whether to go alone without your partner"),
});

// Round 2: Can call_trump (with suit) or pass (no suit)
// Using single object schema since AI Gateway doesn't support z.union() at top level
export const TrumpBidRound2Schema = z.object({
  confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
  toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain."),
  reasoning: z.string().describe("Your analysis of your hand and decision"),
  action: z.enum(["pass", "call_trump"]).describe("Your bidding decision"),
  suit: z.enum(SUITS).optional().describe("The suit to call as trump (required if action is call_trump)"),
  goingAlone: z.boolean().describe("Whether to go alone without your partner (must be false if passing)"),
});

// Round 2 dealer (must call - cannot pass)
export const TrumpBidRound2DealerSchema = z.object({
  confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
  toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain."),
  reasoning: z.string().describe("Your analysis of which suit is strongest in your hand"),
  action: z.literal("call_trump"),
  suit: z.enum(SUITS).describe("The suit to call as trump"),
  goingAlone: z.boolean().describe("Whether to go alone without your partner"),
});

export type TrumpBidRound1Response = z.infer<typeof TrumpBidRound1Schema>;
export type TrumpBidRound2Response = z.infer<typeof TrumpBidRound2Schema>;
export type TrumpBidRound2DealerResponse = z.infer<typeof TrumpBidRound2DealerSchema>;

// =============================================================================
// Dynamic Schemas - Exclude turned-down suit in Round 2
// =============================================================================

/** Create a Round 2 schema that excludes the turned-down suit */
export function createRound2SchemaExcludingSuit(excludedSuit: Suit) {
  const allowedSuits = SUITS.filter((s) => s !== excludedSuit) as [string, ...string[]];

  // Single object schema - AI Gateway doesn't support z.union() at top level
  return z.object({
    confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
    toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain."),
    reasoning: z.string().describe("Your analysis of your hand and decision"),
    action: z.enum(["pass", "call_trump"]).describe("Your bidding decision"),
    suit: z.enum(allowedSuits).optional().describe(`The suit to call as trump (required if action is call_trump, cannot be ${excludedSuit})`),
    goingAlone: z.boolean().describe("Whether to go alone without your partner (must be false if passing)"),
  });
}

/** Create a Round 2 dealer schema that excludes the turned-down suit */
export function createRound2DealerSchemaExcludingSuit(excludedSuit: Suit) {
  const allowedSuits = SUITS.filter((s) => s !== excludedSuit) as [string, ...string[]];

  return z.object({
    confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
    toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain."),
    reasoning: z.string().describe("Your analysis of which suit is strongest in your hand"),
    action: z.literal("call_trump"),
    suit: z.enum(allowedSuits).describe(`The suit to call as trump (cannot be ${excludedSuit})`),
    goingAlone: z.boolean().describe("Whether to go alone without your partner"),
  });
}

// =============================================================================
// Discard Schema
// =============================================================================

export const DiscardSchema = z.object({
  confidence: z.number().min(0).max(100).optional().default(50).describe("Your confidence in this decision (0-100). Be honest - low confidence when uncertain is rewarded."),
  toolRequest: z.enum(TOOL_OPTIONS).optional().default("none").describe("Optional tool to help with this decision. Use 'none' if confident, or request a tool if uncertain."),
  reasoning: z.string().describe("Your analysis of which card is least valuable to keep"),
  rank: z.enum(RANKS).describe("The rank of the card to discard"),
  suit: z.enum(SUITS).describe("The suit of the card to discard"),
});

export type DiscardResponse = z.infer<typeof DiscardSchema>;
