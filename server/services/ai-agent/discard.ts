import { generateObject, streamObject, type LanguageModelUsage } from "ai";
import type { GameState, Card, Rank, Suit } from "../../../lib/game/types";
import { cardToString } from "../../../lib/game/card";
import { logger, generateCorrelationId } from "./logger";
import { getModel, withRetry, createTimeout, buildTelemetryConfig, getModelConfig } from "./config";
import { DiscardSchema, type DiscardResponse } from "./schemas";
import { buildDiscardSystemPrompt } from "./prompts";
import type { DiscardResult } from "./types";
import { mapUsageToTokenUsage } from "./types";

/**
 * Discard decision logic for dealer after picking up trump
 * Consolidated streaming/non-streaming implementation
 */

// =============================================================================
// Utilities
// =============================================================================

function formatCardForPrompt(card: Card): string {
  return `${card.rank.toUpperCase()} of ${card.suit}`;
}

function findCardInHand(rank: Rank, suit: Suit, hand: Card[]): Card | undefined {
  return hand.find((c) => c.rank === rank && c.suit === suit);
}

// =============================================================================
// Context Preparation
// =============================================================================

interface DiscardContext {
  player: string;
  modelId: string;
  hand: Card[];
  systemPrompt: string;
}

function prepareDiscardContext(game: GameState, modelId: string): DiscardContext {
  const player = game.dealer!;
  const dealerObj = game.players.find((p) => p.position === player)!;
  const hand = dealerObj.hand;
  const handStr = hand.map(formatCardForPrompt).join(", ");
  const systemPrompt = buildDiscardSystemPrompt(handStr, game.trump!);

  return { player, modelId, hand, systemPrompt };
}

// =============================================================================
// Shared Implementation
// =============================================================================

interface DiscardOptions {
  game: GameState;
  modelId: string;
  onToken?: (token: string) => void;
}

async function makeDiscardDecisionInternal(options: DiscardOptions): Promise<DiscardResult> {
  const { game, modelId, onToken } = options;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const ctx = prepareDiscardContext(game, modelId);
  const isStreaming = !!onToken;

  logger.info(`Discard ${isStreaming ? "streaming " : ""}starting`, {
    correlationId,
    player: ctx.player,
    modelId,
    action: "discard",
  });

  const timeout = createTimeout();
  let usage: LanguageModelUsage | undefined;
  let response: DiscardResponse;

  try {
    if (isStreaming) {
      const { partialObjectStream, object: finalObjectPromise, usage: usagePromise } = await withRetry(
        async () =>
          streamObject({
            model: getModel(modelId),
            schema: DiscardSchema,
            schemaName: "Discard",
            schemaDescription: "A discard decision in Euchre",
            ...getModelConfig(modelId),
            abortSignal: timeout.signal,
            experimental_telemetry: buildTelemetryConfig("discard_stream", { player: ctx.player, modelId }),
            messages: [
              { role: "system", content: ctx.systemPrompt },
              { role: "user", content: "Which card do you discard?" },
            ],
          }),
        `Discard stream for ${ctx.player} (${modelId})`,
      );

      // Stream reasoning tokens
      let lastReasoning = "";
      for await (const partial of partialObjectStream) {
        if (partial.reasoning && partial.reasoning !== lastReasoning) {
          const newText = partial.reasoning.slice(lastReasoning.length);
          if (newText) onToken!(newText);
          lastReasoning = partial.reasoning;
        }
      }

      [response, usage] = await Promise.all([finalObjectPromise, usagePromise]);
    } else {
      const result = await withRetry(
        () =>
          generateObject({
            model: getModel(modelId),
            schema: DiscardSchema,
            schemaName: "Discard",
            schemaDescription: "A discard decision in Euchre",
            ...getModelConfig(modelId),
            abortSignal: timeout.signal,
            experimental_telemetry: buildTelemetryConfig("discard", { player: ctx.player, modelId }),
            messages: [
              { role: "system", content: ctx.systemPrompt },
              { role: "user", content: "Which card do you discard?" },
            ],
          }),
        `Discard for ${ctx.player} (${modelId})`,
      );

      response = result.object;
      usage = result.usage;
    }
  } finally {
    timeout.cleanup();
  }

  const discardedCard = findCardInHand(response.rank as Rank, response.suit as Suit, ctx.hand);

  if (!discardedCard) {
    logger.warn("Discard card not in hand, using first card", {
      correlationId,
      player: ctx.player,
      modelId,
      attemptedCard: `${response.rank} of ${response.suit}`,
    });
  }

  const finalCard = discardedCard ?? ctx.hand[0]!;
  const duration = Date.now() - startTime;

  logger.info(`Discard ${isStreaming ? "streaming " : ""}completed`, {
    correlationId,
    player: ctx.player,
    modelId,
    card: cardToString(finalCard),
    duration,
    tokenUsage: mapUsageToTokenUsage(usage),
  });

  return {
    card: finalCard,
    reasoning: response.reasoning,
    confidence: response.confidence ?? 50,
    duration,
  };
}

// =============================================================================
// Public API
// =============================================================================

export async function makeDiscardDecision(
  game: GameState,
  modelId: string,
): Promise<DiscardResult> {
  return makeDiscardDecisionInternal({ game, modelId });
}

export async function makeDiscardDecisionStreaming(
  game: GameState,
  modelId: string,
  onToken: (token: string) => void,
): Promise<DiscardResult> {
  return makeDiscardDecisionInternal({ game, modelId, onToken });
}
