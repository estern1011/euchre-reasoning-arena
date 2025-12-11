import type { LanguageModelUsage } from "ai";
import type { Card, Suit, TrumpBidAction } from "../../../lib/game/types";
import type { ToolResult } from "../tools/types";

/**
 * Shared types for AI agent decisions
 * Includes confidence and tool usage for Metacognition Arena
 */

export interface TrumpBidResult {
  action: TrumpBidAction;
  suit?: Suit;
  goingAlone: boolean;
  reasoning: string;
  confidence: number;
  duration: number;
  toolUsed?: ToolResult;
}

export interface CardPlayResult {
  card: Card;
  reasoning: string;
  confidence: number;
  duration: number;
  illegalAttempt?: { card: Card; reasoning: string };
  isFallback?: boolean;
  toolUsed?: ToolResult;
}

export interface DiscardResult {
  card: Card;
  reasoning: string;
  confidence: number;
  duration: number;
  illegalAttempt?: { card: Card; reasoning: string };
  isFallback?: boolean;
  toolUsed?: ToolResult;
}

/** Structured log context for Vercel observability */
export interface LogContext {
  correlationId?: string;
  player?: string;
  modelId?: string;
  action?: string;
  duration?: number;
  tokenUsage?: TokenUsage;
  error?: string;
  [key: string]: unknown;
}

/** Token usage for logging (mapped from LanguageModelUsage) */
export interface TokenUsage {
  prompt?: number;
  completion?: number;
  total?: number;
}

/** Convert AI SDK usage to our log format */
export function mapUsageToTokenUsage(usage: LanguageModelUsage | undefined): TokenUsage | undefined {
  if (!usage) return undefined;
  return {
    prompt: usage.inputTokens,
    completion: usage.outputTokens,
    total: usage.totalTokens,
  };
}
