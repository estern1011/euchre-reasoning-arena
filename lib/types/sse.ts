/**
 * SSE Message Types - Discriminated union for type-safe message handling
 * Includes Metacognition Arena events for tool usage and confidence
 */
import type { Card, GameState, Position, Suit, TrumpBidAction } from "../game/types";
import type { ToolResult as ToolResultType } from "../../server/services/tools/types";

// Base decision interface
export interface BaseDecision {
  player: Position;
  modelId: string;
  reasoning: string;
  confidence: number;
  duration: number;
  toolUsed?: ToolResultType;
}

// Card play decision
export interface CardPlayDecision extends BaseDecision {
  type: "card_play";
  card: Card;
  illegalAttempt?: {
    card: Card;
    reasoning: string;
  };
  isFallback?: boolean;
}

// Trump bid decision
export interface TrumpBidDecision extends BaseDecision {
  type: "trump_bid";
  action: TrumpBidAction;
  suit?: Suit;
  goingAlone: boolean;
}

// Discard decision
export interface DiscardDecision extends BaseDecision {
  type: "discard";
  card: Card;
}

// Union of all decision types
export type Decision = CardPlayDecision | TrumpBidDecision | DiscardDecision;

// SSE Message Types (discriminated union)
export interface SSEPlayerThinking {
  type: "player_thinking";
  player: Position;
  modelId: string;
  action?: "discard";
}

export interface SSEReasoningToken {
  type: "reasoning_token";
  player: Position;
  token: string;
}

export interface SSEIllegalAttempt {
  type: "illegal_attempt";
  player: Position;
  modelId: string;
  attemptedCard: Card;
  isFallback: boolean;
}

export interface SSEDecisionMade {
  type: "decision_made";
  player: Position;
  modelId: string;
  reasoning: string;
  confidence: number;
  duration: number;
  // Card play
  card?: Card;
  illegalAttempt?: { card: Card; reasoning: string };
  isFallback?: boolean;
  // Trump bid
  action?: TrumpBidAction | "discard";
  suit?: Suit;
  goingAlone?: boolean;
  // Tool usage (Metacognition Arena)
  toolUsed?: ToolResultType;
}

// =============================================================================
// Metacognition Arena - Tool Events
// =============================================================================

export interface SSEToolRequest {
  type: "tool_request";
  player: Position;
  modelId: string;
  tool: string;
  cost: number;
}

export interface SSEToolProgress {
  type: "tool_progress";
  player: Position;
  message: string;
}

export interface SSEToolResult {
  type: "tool_result";
  player: Position;
  tool: string;
  result: unknown;
  cost: number;
  duration: number;
}

export interface SSERoundComplete {
  type: "round_complete";
  gameState: GameState;
  phase: string;
  decisions: Decision[];
  // Trick completion fields
  trickWinner?: Position;
  trickNumber?: number;
  // Multi-hand game fields
  handScores?: [number, number];
  gameScores?: [number, number];
  handNumber?: number;
  winningTeam?: 0 | 1;
  // Trump selection fields
  trumpSelectionResult?: {
    trumpCaller: Position;
    trump: Suit;
    goingAlone: Position | null;
  } | null;
  allPassed?: boolean;
  selectionRound?: 1 | 2;
}

export interface SSEError {
  type: "error";
  message: string;
}

// Discriminated union of all SSE message types
export type SSEMessage =
  | SSEPlayerThinking
  | SSEReasoningToken
  | SSEIllegalAttempt
  | SSEDecisionMade
  | SSERoundComplete
  | SSEError
  | SSEToolRequest
  | SSEToolProgress
  | SSEToolResult;

// Type guard functions
export function isPlayerThinking(msg: SSEMessage): msg is SSEPlayerThinking {
  return msg.type === "player_thinking";
}

export function isReasoningToken(msg: SSEMessage): msg is SSEReasoningToken {
  return msg.type === "reasoning_token";
}

export function isIllegalAttempt(msg: SSEMessage): msg is SSEIllegalAttempt {
  return msg.type === "illegal_attempt";
}

export function isDecisionMade(msg: SSEMessage): msg is SSEDecisionMade {
  return msg.type === "decision_made";
}

export function isRoundComplete(msg: SSEMessage): msg is SSERoundComplete {
  return msg.type === "round_complete";
}

export function isSSEError(msg: SSEMessage): msg is SSEError {
  return msg.type === "error";
}

// Metacognition Arena type guards
export function isToolRequest(msg: SSEMessage): msg is SSEToolRequest {
  return msg.type === "tool_request";
}

export function isToolProgress(msg: SSEMessage): msg is SSEToolProgress {
  return msg.type === "tool_progress";
}

export function isToolResult(msg: SSEMessage): msg is SSEToolResult {
  return msg.type === "tool_result";
}
