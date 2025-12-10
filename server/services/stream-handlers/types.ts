import type { Position } from "../../../lib/game/types";
import type { TrackedGameState } from "../game-tracker";

/**
 * Shared types for SSE stream phase handlers
 */

export interface StreamContext {
  sendEvent: (type: string, data: any) => void;
  game: TrackedGameState;
}

export interface PhaseResult {
  game: TrackedGameState;
  decisions: DecisionRecord[];
}

export interface DecisionRecord {
  player: Position;
  modelId: string;
  action?: string;
  suit?: string;
  goingAlone?: boolean;
  card?: { rank: string; suit: string };
  reasoning: string;
  duration: number;
}

export interface ToolCallbacksFactory {
  create: (player: Position, modelId: string) => {
    onToolRequest: (request: { tool: string; player: Position; cost: number }) => void;
    onToolProgress: (message: string) => void;
    onToolResult: (result: any) => void;
    onResponsePhase: () => void;
  };
}
