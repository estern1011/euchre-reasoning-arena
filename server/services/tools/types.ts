import type { Position, GameState, Card, Suit } from "../../../lib/game/types";
import type { ToolOption } from "../ai-agent/schemas";

/**
 * Tool definitions for the Metacognition Arena
 * Each tool has a cost that reduces the agent's score
 */

export interface ToolDefinition {
  name: string;
  id: ToolOption;
  cost: number;
  description: string;
  icon: string;
}

export const TOOL_DEFINITIONS: Record<Exclude<ToolOption, "none">, ToolDefinition> = {
  ask_audience: {
    name: "Ask Audience",
    id: "ask_audience",
    cost: 2,
    description: "Poll 3 models asking what move they would make",
    icon: "👥",
  },
  situation_lookup: {
    name: "Situation Lookup",
    id: "situation_lookup",
    cost: 1,
    description: "Query similar historical hands to see what worked",
    icon: "📊",
  },
  fifty_fifty: {
    name: "50/50",
    id: "fifty_fifty",
    cost: 3,
    description: "Reveal which cards in your hand can win this trick",
    icon: "⚡",
  },
};

export function getToolCost(tool: ToolOption): number {
  if (tool === "none") return 0;
  return TOOL_DEFINITIONS[tool].cost;
}

/**
 * Tool request from an agent
 */
export interface ToolRequest {
  tool: Exclude<ToolOption, "none">;
  player: Position;
  modelId: string;
  context: ToolContext;
}

/**
 * Context passed to tool execution
 */
export interface ToolContext {
  gameState: GameState;
  player: Position;
  hand: Card[];
  decisionType: "trump_bid" | "card_play" | "discard";
  // For card play
  currentTrick?: Card[];
  leadSuit?: Suit;
  trump?: Suit;
  // For trump bid
  turnedUpCard?: Card;
  biddingRound?: 1 | 2;
}

/**
 * Result from tool execution
 */
export interface ToolResult {
  tool: Exclude<ToolOption, "none">;
  success: boolean;
  result: AskAudienceResult | SituationLookupResult | FiftyFiftyResult;
  cost: number;
  duration: number;
}

/**
 * Ask Audience tool result
 */
export interface AudienceOpinion {
  modelId: string;
  modelName: string;
  decision: string;
  confidence: number;
  briefReasoning: string;
}

export interface AskAudienceResult {
  opinions: AudienceOpinion[];
  consensus: {
    decision: string;
    agreementRate: number;
  };
}

/**
 * Situation Lookup tool result
 */
export interface HistoricalSituation {
  decision: string;
  successRate: number;
  occurrences: number;
  sampleReasoning?: string;
}

export interface SituationLookupResult {
  situationsFound: number;
  recommendations: HistoricalSituation[];
  confidence: number;
}

/**
 * 50/50 tool result
 */
export interface FiftyFiftyResult {
  totalOptions: number;
  winningOptions: number;
  revealedWinners: Card[];
  eliminatedLosers: Card[];
}

/**
 * Tool execution callbacks for streaming
 */
export interface ToolCallbacks {
  onToolRequest?: (request: { tool: string; player: Position; cost: number }) => void;
  onToolProgress?: (message: string) => void;
  onToolResult?: (result: ToolResult) => void;
  onResponsePhase?: () => void; // Called when agent starts second decision with tool result
}
