import { z } from "zod";
import type { Suit } from "../../../lib/game/types";

/**
 * Zod schemas for AI agent structured output
 * Context-specific schemas ensure SDK enforces valid responses
 */

export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export const RANKS = ["9", "10", "jack", "queen", "king", "ace"] as const;

// =============================================================================
// Card Play Schema
// =============================================================================

export const CardPlaySchema = z.object({
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
  reasoning: z.string().describe("Your analysis of your hand strength and why you made this decision"),
  action: z.enum(["pass", "order_up"]).describe("Your bidding decision"),
  goingAlone: z.boolean().describe("Whether to go alone without your partner"),
});

// Round 2: Can call_trump (with suit) or pass (no suit)
const TrumpBidRound2PassSchema = z.object({
  reasoning: z.string().describe("Your analysis of why you are passing"),
  action: z.literal("pass"),
  goingAlone: z.literal(false),
});

const TrumpBidRound2CallSchema = z.object({
  reasoning: z.string().describe("Your analysis of your hand and why you chose this trump suit"),
  action: z.literal("call_trump"),
  suit: z.enum(SUITS).describe("The suit to call as trump"),
  goingAlone: z.boolean().describe("Whether to go alone without your partner"),
});

// Round 2 dealer (must call - cannot pass)
export const TrumpBidRound2DealerSchema = z.object({
  reasoning: z.string().describe("Your analysis of which suit is strongest in your hand"),
  action: z.literal("call_trump"),
  suit: z.enum(SUITS).describe("The suit to call as trump"),
  goingAlone: z.boolean().describe("Whether to go alone without your partner"),
});

export const TrumpBidRound2Schema = z.union([TrumpBidRound2PassSchema, TrumpBidRound2CallSchema]);

export type TrumpBidRound1Response = z.infer<typeof TrumpBidRound1Schema>;
export type TrumpBidRound2Response = z.infer<typeof TrumpBidRound2Schema>;
export type TrumpBidRound2DealerResponse = z.infer<typeof TrumpBidRound2DealerSchema>;

// =============================================================================
// Dynamic Schemas - Exclude turned-down suit in Round 2
// =============================================================================

/** Create a Round 2 schema that excludes the turned-down suit */
export function createRound2SchemaExcludingSuit(excludedSuit: Suit) {
  const allowedSuits = SUITS.filter((s) => s !== excludedSuit) as [string, ...string[]];

  const passSchema = z.object({
    reasoning: z.string().describe("Your analysis of why you are passing"),
    action: z.literal("pass"),
    goingAlone: z.literal(false),
  });

  const callSchema = z.object({
    reasoning: z.string().describe("Your analysis of your hand and why you chose this trump suit"),
    action: z.literal("call_trump"),
    suit: z.enum(allowedSuits).describe(`The suit to call as trump (cannot be ${excludedSuit})`),
    goingAlone: z.boolean().describe("Whether to go alone without your partner"),
  });

  return z.union([passSchema, callSchema]);
}

/** Create a Round 2 dealer schema that excludes the turned-down suit */
export function createRound2DealerSchemaExcludingSuit(excludedSuit: Suit) {
  const allowedSuits = SUITS.filter((s) => s !== excludedSuit) as [string, ...string[]];

  return z.object({
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
  reasoning: z.string().describe("Your analysis of which card is least valuable to keep"),
  rank: z.enum(RANKS).describe("The rank of the card to discard"),
  suit: z.enum(SUITS).describe("The suit of the card to discard"),
});

export type DiscardResponse = z.infer<typeof DiscardSchema>;
