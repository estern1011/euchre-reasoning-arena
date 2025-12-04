import type { LanguageModelUsage } from "ai";
import type { Card, Suit, TrumpBidAction } from "../../../lib/game/types";

/**
 * Shared types for AI agent decisions
 */

export interface TrumpBidResult {
  action: TrumpBidAction;
  suit?: Suit;
  goingAlone: boolean;
  reasoning: string;
  duration: number;
}

export interface CardPlayResult {
  card: Card;
  reasoning: string;
  duration: number;
  illegalAttempt?: { card: Card; reasoning: string };
  isFallback?: boolean;
}

export interface DiscardResult {
  card: Card;
  reasoning: string;
  duration: number;
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
