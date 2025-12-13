import type { Position, TrumpBidAction, Suit, Card, GameState } from "../../../lib/game/types";
import type { ToolResult } from "../tools/types";
import type { PromptOptions } from "../ai-agent/prompts";

/**
 * Shared types for SSE stream phase handlers
 */

/**
 * SSE event types and their data structures
 */
export type SSEEvent =
  | { type: "player_thinking"; data: PlayerThinkingData }
  | { type: "reasoning_token"; data: ReasoningTokenData }
  | { type: "decision_made"; data: DecisionMadeData }
  | { type: "round_complete"; data: RoundCompleteData }
  | { type: "tool_request"; data: ToolRequestData }
  | { type: "tool_progress"; data: ToolProgressData }
  | { type: "tool_result"; data: ToolResultData }
  | { type: "response_phase"; data: ResponsePhaseData }
  | { type: "illegal_attempt"; data: IllegalAttemptData }
  | { type: "error"; data: ErrorData };

export interface PlayerThinkingData {
  player: Position;
  modelId: string;
  action?: string;
}

export interface ReasoningTokenData {
  player: Position;
  token: string;
}

export interface DecisionMadeData {
  player: Position;
  modelId: string;
  action?: TrumpBidAction | "discard";
  suit?: Suit;
  goingAlone?: boolean;
  card?: Card;
  reasoning: string;
  confidence?: number;
  duration: number;
  illegalAttempt?: {
    card: Card;
    reasoning: string;
  };
  isFallback?: boolean;
  toolUsed?: {
    tool: string;
    cost: number;
  };
}

export interface RoundCompleteData {
  gameState: GameState;
  phase: string;
  decisions: DecisionRecord[];
  trickWinner?: Position;
  trickNumber?: number;
  handScores?: [number, number];
  gameScores?: [number, number];
  handNumber?: number;
  winningTeam?: 0 | 1;
  trumpSelectionResult?: {
    trumpCaller?: Position;
    trump: Suit | null;
    goingAlone: Position | null;
  } | null;
  allPassed?: boolean;
  selectionRound?: 1 | 2;
}

export interface ToolRequestData {
  player: Position;
  modelId: string;
  tool: string;
  cost: number;
}

export interface ToolProgressData {
  player: Position;
  message: string;
}

export interface ToolResultData {
  player: Position;
  tool: string;
  result: ToolResult["result"];
  cost: number;
  duration: number;
}

export interface ResponsePhaseData {
  player: Position;
}

export interface IllegalAttemptData {
  player: Position;
  modelId: string;
  attemptedCard: Card;
  isFallback?: boolean;
}

export interface ErrorData {
  message: string;
}

/**
 * Type-safe sendEvent for known SSE events
 */
export type TypedSendEvent = <T extends SSEEvent["type"]>(
  type: T,
  data: Extract<SSEEvent, { type: T }>["data"]
) => void;

/**
 * Stream context for SSE phase handlers
 * Uses a pragmatic sendEvent signature that accepts typed events
 * while remaining compatible with test mocks
 */
export interface StreamContext {
  sendEvent: (type: string, data: Record<string, unknown>) => void;
  game: GameState;
  promptOptions?: PromptOptions;  // Options including strategy hints and agent reflections
}

export interface PhaseResult {
  game: GameState;
  decisions: DecisionRecord[];
}

export interface DecisionRecord {
  player: Position;
  modelId: string;
  action?: TrumpBidAction | "discard";
  suit?: Suit;
  goingAlone?: boolean;
  card?: Card;
  reasoning: string;
  duration: number;
}
