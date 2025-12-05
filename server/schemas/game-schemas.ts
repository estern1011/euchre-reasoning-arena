import { z } from "zod";

/**
 * Shared Zod schemas for API request validation
 */

// Base game types
export const SuitSchema = z.enum(["hearts", "diamonds", "clubs", "spades"]);
export const RankSchema = z.enum(["9", "10", "jack", "queen", "king", "ace"]);
export const PositionSchema = z.enum(["north", "east", "south", "west"]);
export const GamePhaseSchema = z.enum(["trump_selection", "playing", "hand_complete", "game_complete"]);
export const TrumpBidActionSchema = z.enum(["order_up", "call_trump", "pass"]);

export const CardSchema = z.object({
  suit: SuitSchema,
  rank: RankSchema,
});

export const PlayerSchema = z.object({
  position: PositionSchema,
  team: z.union([z.literal(0), z.literal(1)]),
  hand: z.array(CardSchema),
  modelId: z.string(),
});

export const CardPlaySchema = z.object({
  player: PositionSchema,
  card: CardSchema,
  reasoning: z.string().optional(),
});

export const TrickSchema = z.object({
  leadPlayer: PositionSchema,
  plays: z.array(CardPlaySchema),
  winner: PositionSchema.optional(),
});

export const TrumpBidSchema = z.object({
  player: PositionSchema,
  action: TrumpBidActionSchema,
  suit: SuitSchema.optional(),
  goingAlone: z.boolean().optional(),
  reasoning: z.string().optional(),
});

export const TrumpSelectionStateSchema = z.object({
  turnedUpCard: CardSchema,
  dealer: PositionSchema,
  currentBidder: PositionSchema,
  round: z.union([z.literal(1), z.literal(2)]),
  bids: z.array(TrumpBidSchema),
});

export const GameStateSchema = z.object({
  id: z.string(),
  phase: GamePhaseSchema,
  players: z.array(PlayerSchema).length(4),
  trump: SuitSchema.nullable(),
  dealer: PositionSchema,
  trumpCaller: PositionSchema.optional(),
  goingAlone: PositionSchema.optional(),
  trumpSelection: TrumpSelectionStateSchema.optional(),
  kitty: z.array(CardSchema),
  currentTrick: TrickSchema,
  completedTricks: z.array(TrickSchema),
  scores: z.tuple([z.number(), z.number()]),
  // Multi-hand game tracking
  handNumber: z.number().optional().default(1),
  gameScores: z.tuple([z.number(), z.number()]).optional().default([0, 0]),
  winningScore: z.number().optional().default(10),
});

// Model ID validation (must be in provider/model format)
export const ModelIdSchema = z.string().regex(
  /^[a-z0-9-]+\/[a-z0-9-_.]+$/i,
  "Model ID must be in provider/model format (e.g., 'anthropic/claude-haiku-4.5')"
);

export const ModelIdsArraySchema = z.tuple([
  ModelIdSchema,
  ModelIdSchema,
  ModelIdSchema,
  ModelIdSchema,
]);

// API Request schemas
export const NewGameRequestSchema = z.object({
  modelIds: ModelIdsArraySchema.optional(),
  dealer: PositionSchema.optional(),
  winningScore: z.number().min(1).max(100).optional().default(10),
});

export const PlayNextRoundRequestSchema = z.object({
  gameState: GameStateSchema.optional(),
  modelIds: ModelIdsArraySchema.optional(),
});

// Type exports
export type NewGameRequest = z.infer<typeof NewGameRequestSchema>;
export type PlayNextRoundRequest = z.infer<typeof PlayNextRoundRequestSchema>;
