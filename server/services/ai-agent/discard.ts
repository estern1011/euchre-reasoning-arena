import { streamObject, type LanguageModelUsage } from "ai";
import type { GameState, Card, Rank, Suit } from "../../../lib/game/types";
import { cardToString, cardsEqual } from "../../../lib/game/card";
import { logger, generateCorrelationId } from "./logger";
import { getModel, withRetry, createTimeout, buildTelemetryConfig, getModelConfig } from "./config";
import { DiscardSchema, type DiscardResponse } from "./schemas";
import { buildDiscardSystemPrompt } from "./prompts";
import type { DiscardResult } from "./types";
import { mapUsageToTokenUsage } from "./types";

/**
 * Discard decision logic for dealer after picking up trump
 */

function formatCardForPrompt(card: Card): string {
  return `${card.rank.toUpperCase()} of ${card.suit}`;
}

function findCardInHand(rank: Rank, suit: Suit, hand: Card[]): Card | undefined {
  return hand.find((c) => c.rank === rank && c.suit === suit);
}

export async function makeDiscardDecisionStreaming(
  game: GameState,
  modelId: string,
  onToken: (token: string) => void,
): Promise<DiscardResult> {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const player = game.dealer!;
  const dealerObj = game.players.find((p) => p.position === player)!;
  const hand = dealerObj.hand;
  const handStr = hand.map(formatCardForPrompt).join(", ");
  const systemPrompt = buildDiscardSystemPrompt(handStr, game.trump!);

  logger.info("Discard starting", { correlationId, player, modelId, action: "discard" });

  const timeout = createTimeout();
  let usage: LanguageModelUsage | undefined;
  let response: DiscardResponse;

  try {
    const { partialObjectStream, object: finalObjectPromise, usage: usagePromise } = await withRetry(
      async () =>
        streamObject({
          model: getModel(modelId),
          schema: DiscardSchema,
          schemaName: "Discard",
          schemaDescription: "A discard decision in Euchre",
          ...getModelConfig(modelId),
          abortSignal: timeout.signal,
          experimental_telemetry: buildTelemetryConfig("discard", { player, modelId }),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Which card do you discard?" },
          ],
        }),
      `Discard for ${player} (${modelId})`,
    );

    // Stream reasoning tokens
    let lastReasoning = "";
    for await (const partial of partialObjectStream) {
      if (partial.reasoning && partial.reasoning !== lastReasoning) {
        const newText = partial.reasoning.slice(lastReasoning.length);
        if (newText) onToken(newText);
        lastReasoning = partial.reasoning;
      }
    }

    [response, usage] = await Promise.all([finalObjectPromise, usagePromise]);
  } finally {
    timeout.cleanup();
  }

  const discardedCard = findCardInHand(response.rank as Rank, response.suit as Suit, hand);

  if (!discardedCard) {
    logger.warn("Discard card not in hand, using first card", {
      correlationId,
      player,
      modelId,
      attemptedCard: `${response.rank} of ${response.suit}`,
    });
  }

  const finalCard = discardedCard ?? hand[0]!;
  const duration = Date.now() - startTime;

  logger.info("Discard completed", {
    correlationId,
    player,
    modelId,
    card: cardToString(finalCard),
    duration,
    tokenUsage: mapUsageToTokenUsage(usage),
  });

  return {
    card: finalCard,
    reasoning: response.reasoning,
    confidence: response.confidence ?? 50, // Default to 50% if not provided
    duration,
  };
}
