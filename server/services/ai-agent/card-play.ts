import { generateObject, streamObject, type LanguageModelUsage } from "ai";
import type { GameState, Position, Card, Rank, Suit } from "../../../lib/game/types";
import { formatGameStateForCardPlay, getValidCardsForPlay } from "../../../lib/game/game";
import { cardToString, cardsEqual } from "../../../lib/game/card";
import { logger, generateCorrelationId } from "./logger";
import { getModel, withRetry, createTimeout, buildTelemetryConfig, getModelConfig } from "./config";
import { CardPlaySchema, type CardPlayResponse } from "./schemas";
import { buildCardPlaySystemPrompt } from "./prompts";
import type { CardPlayResult } from "./types";
import { mapUsageToTokenUsage } from "./types";

/**
 * Card play decision logic
 * Consolidated streaming/non-streaming implementation with retry on illegal cards
 */

// =============================================================================
// Utilities
// =============================================================================

function formatCardForPrompt(card: Card): string {
  return `${card.rank.toUpperCase()} of ${card.suit}`;
}

function findCardInHand(rank: Rank, suit: Suit, validCards: Card[], hand: Card[]): Card {
  const exactMatch = validCards.find((c) => c.rank === rank && c.suit === suit);
  if (exactMatch) return exactMatch;

  const handMatch = hand.find((c) => c.rank === rank && c.suit === suit);
  if (handMatch) return handMatch;

  logger.warn(`[AI-Agent] Could not find ${rank} of ${suit} in hand, using first valid card`);
  return validCards[0] || hand[0];
}

function buildRetryNote(chosenCardStr: string, validCardsList: string): string {
  return `IMPORTANT: Your previous selection (${chosenCardStr}) was ILLEGAL. You MUST choose exactly one card from this list: ${validCardsList}. Do not choose any other card.`;
}

// =============================================================================
// Context Preparation
// =============================================================================

interface CardPlayContext {
  game: GameState;
  player: Position;
  modelId: string;
  validCards: Card[];
  validCardsList: string;
  systemPrompt: string;
  gameContext: string;
  playerHand: Card[];
}

function prepareCardPlayContext(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
): CardPlayContext | CardPlayResult {
  const gameContext = formatGameStateForCardPlay(game, player);
  const playerObj = game.players.find((p) => p.position === player)!;
  const validCards = getValidCardsForPlay(game, player);

  // Early return cases
  if (validCards.length === 0) {
    return {
      card: playerObj.hand[0],
      reasoning: "No legal cards detected; playing the first card in hand as a safeguard.",
      duration: 0,
    };
  }

  if (validCards.length === 1) {
    return {
      card: validCards[0],
      reasoning: "Only one legal card available; playing it automatically to follow suit.",
      duration: 0,
    };
  }

  const validCardsList = validCards.map(formatCardForPrompt).join(", ");
  const systemPrompt = customPrompt || buildCardPlaySystemPrompt(validCardsList);

  return {
    game,
    player,
    modelId,
    validCards,
    validCardsList,
    systemPrompt,
    gameContext,
    playerHand: playerObj.hand,
  };
}

// =============================================================================
// Result Processing
// =============================================================================

interface ProcessedResult {
  card: Card;
  reasoning: string;
  illegalAttempt?: { card: Card; reasoning: string };
  isFallback?: boolean;
  isValid: boolean;
}

function processCardPlayResult(
  response: CardPlayResponse,
  ctx: CardPlayContext,
  previousAttempt?: { card: Card; reasoning: string },
): ProcessedResult {
  const card = findCardInHand(response.rank as Rank, response.suit as Suit, ctx.validCards, ctx.playerHand);
  const isValid = ctx.validCards.some((c) => cardsEqual(c, card));

  if (isValid && !previousAttempt) {
    return { card, reasoning: response.reasoning, isValid: true };
  }

  if (isValid && previousAttempt) {
    return { card, reasoning: response.reasoning, illegalAttempt: previousAttempt, isValid: true };
  }

  // Invalid after retry - fallback
  if (previousAttempt) {
    logger.warn(
      `[AI-Agent] Illegal card persisted after retry from ${ctx.player} (${ctx.modelId}). Falling back to first legal card.`,
    );
    return {
      card: ctx.validCards[0],
      reasoning: response.reasoning + `\n\n[Fell back to first legal card: ${formatCardForPrompt(ctx.validCards[0])}]`,
      illegalAttempt: previousAttempt,
      isFallback: true,
      isValid: true, // Fallback is always valid
    };
  }

  // First attempt invalid - need retry
  return { card, reasoning: response.reasoning, isValid: false };
}

// =============================================================================
// Shared Implementation
// =============================================================================

interface CardPlayOptions {
  game: GameState;
  player: Position;
  modelId: string;
  customPrompt?: string;
  onToken?: (token: string) => void;
}

async function makeCardPlayDecisionInternal(options: CardPlayOptions): Promise<CardPlayResult> {
  const { game, player, modelId, customPrompt, onToken } = options;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const ctxOrResult = prepareCardPlayContext(game, player, modelId, customPrompt);

  // Early return for trivial cases
  if ("card" in ctxOrResult) {
    if (onToken) onToken(ctxOrResult.reasoning);
    logger.info("Card play auto-played", { correlationId, player, modelId, reason: "single_legal_card" });
    return { ...ctxOrResult, duration: Date.now() - startTime };
  }

  const ctx = ctxOrResult;
  const model = getModel(modelId);
  const trick = game.completedTricks.length + 1;
  const isStreaming = !!onToken;

  logger.info(`Card play ${isStreaming ? "streaming " : ""}starting`, {
    correlationId,
    player,
    modelId,
    action: `trick_${trick}`,
  });

  const attemptDecision = async (retryNote?: string): Promise<{ response: CardPlayResponse; usage?: LanguageModelUsage }> => {
    const userContent = `${ctx.gameContext}${retryNote ? `\n\n${retryNote}` : ""}`;
    const timeout = createTimeout();

    try {
      if (isStreaming) {
        const { partialObjectStream, object: finalObjectPromise, usage: usagePromise } = await withRetry(
          async () =>
            streamObject({
              model,
              schema: CardPlaySchema,
              schemaName: "CardPlay",
              schemaDescription: "A card play decision in Euchre",
              ...getModelConfig(modelId),
              abortSignal: timeout.signal,
              experimental_telemetry: buildTelemetryConfig("card_play_stream", { player, modelId, trick: String(trick) }),
              messages: [
                { role: "system", content: ctx.systemPrompt },
                { role: "user", content: userContent },
              ],
            }),
          `Card play stream for ${player} (${modelId})`,
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

        const [response, usage] = await Promise.all([finalObjectPromise, usagePromise]);
        return { response, usage };
      } else {
        const { object, usage } = await withRetry(
          () =>
            generateObject({
              model,
              schema: CardPlaySchema,
              schemaName: "CardPlay",
              schemaDescription: "A card play decision in Euchre",
              ...getModelConfig(modelId),
              abortSignal: timeout.signal,
              experimental_telemetry: buildTelemetryConfig("card_play", { player, modelId, trick: String(trick) }),
              messages: [
                { role: "system", content: ctx.systemPrompt },
                { role: "user", content: userContent },
              ],
            }),
          `Card play for ${player} (${modelId})`,
        );
        return { response: object, usage };
      }
    } finally {
      timeout.cleanup();
    }
  };

  // First attempt
  const { response: firstResponse, usage } = await attemptDecision();
  let result = processCardPlayResult(firstResponse, ctx);

  // Retry if invalid card selected
  if (!result.isValid) {
    const chosenCardStr = cardToString(result.card);
    logger.warn("Illegal card selected, retrying", { correlationId, player, modelId, attemptedCard: chosenCardStr });

    const { response: retryResponse } = await attemptDecision(buildRetryNote(chosenCardStr, ctx.validCardsList));
    result = processCardPlayResult(retryResponse, ctx, { card: result.card, reasoning: result.reasoning });
  }

  const duration = Date.now() - startTime;
  logger.info(`Card play ${isStreaming ? "streaming " : ""}completed`, {
    correlationId,
    player,
    modelId,
    card: cardToString(result.card),
    duration,
    tokenUsage: mapUsageToTokenUsage(usage),
    isFallback: result.isFallback,
  });

  return {
    card: result.card,
    reasoning: result.reasoning,
    duration,
    illegalAttempt: result.illegalAttempt,
    isFallback: result.isFallback,
  };
}

// =============================================================================
// Public API
// =============================================================================

export async function makeCardPlayDecision(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
): Promise<CardPlayResult> {
  return makeCardPlayDecisionInternal({ game, player, modelId, customPrompt });
}

export async function makeCardPlayDecisionStreaming(
  game: GameState,
  player: Position,
  modelId: string,
  onToken: (token: string) => void,
  customPrompt?: string,
): Promise<CardPlayResult> {
  return makeCardPlayDecisionInternal({ game, player, modelId, customPrompt, onToken });
}
