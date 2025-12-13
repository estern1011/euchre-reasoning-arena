import { generateObject, streamObject, type LanguageModelUsage } from "ai";
import type { GameState, Card, Rank, Suit } from "../../../lib/game/types";
import { cardToString } from "../../../lib/game/card";
import { logger, generateCorrelationId } from "./logger";
import { getModel, withRetry, createTimeout, buildTelemetryConfig, getModelConfig } from "./config";
import { DiscardSchema, type DiscardResponse } from "./schemas";
import { buildDiscardSystemPrompt, type PromptOptions } from "./prompts";
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

function buildRetryNote(chosenCardStr: string, validCardsList: string): string {
  return `IMPORTANT: Your previous selection (${chosenCardStr}) was ILLEGAL. You MUST choose exactly one card from this list: ${validCardsList}. Do not choose any other card.`;
}

// =============================================================================
// Context Preparation
// =============================================================================

interface DiscardContext {
  player: string;
  modelId: string;
  hand: Card[];
  handList: string;
  systemPrompt: string;
}

function prepareDiscardContext(game: GameState, modelId: string, promptOptions?: PromptOptions): DiscardContext {
  if (!game.dealer) {
    throw new Error("Dealer not set in game state");
  }

  const player = game.dealer;
  const dealerObj = game.players.find((p) => p.position === player);

  if (!dealerObj) {
    throw new Error(`Dealer not found for position: ${player}`);
  }

  const hand = dealerObj.hand;

  if (hand.length === 0) {
    throw new Error(`Dealer has empty hand for position: ${player}`);
  }

  if (!game.trump) {
    throw new Error("Trump not set in game state during discard");
  }

  const handList = hand.map(formatCardForPrompt).join(", ");
  const systemPrompt = buildDiscardSystemPrompt(handList, game.trump, promptOptions, player);

  return { player, modelId, hand, handList, systemPrompt };
}

// =============================================================================
// Result Processing
// =============================================================================

interface ProcessedResult {
  card: Card;
  reasoning: string;
  confidence: number;
  illegalAttempt?: { card: Card; reasoning: string };
  isFallback?: boolean;
  isValid: boolean;
}

function processDiscardResult(
  response: DiscardResponse,
  ctx: DiscardContext,
  previousAttempt?: { card: Card; reasoning: string },
): ProcessedResult {
  const card = findCardInHand(response.rank as Rank, response.suit as Suit, ctx.hand);
  const isValid = !!card;
  const confidence = response.confidence ?? 50; // Default to 50% if not provided

  if (isValid && !previousAttempt) {
    return { card: card!, reasoning: response.reasoning, confidence, isValid: true };
  }

  if (isValid && previousAttempt) {
    return { card: card!, reasoning: response.reasoning, confidence, illegalAttempt: previousAttempt, isValid: true };
  }

  // Invalid after retry - fallback
  if (previousAttempt) {
    if (ctx.hand.length === 0) {
      throw new Error("Cannot discard from empty hand");
    }
    const fallbackCard = ctx.hand[0]!;
    logger.warn(
      `[AI-Agent] Illegal card persisted after retry from ${ctx.player} (${ctx.modelId}). Falling back to first card in hand.`,
    );
    return {
      card: fallbackCard,
      reasoning: response.reasoning + `\n\n[Fell back to first card in hand: ${formatCardForPrompt(fallbackCard)}]`,
      confidence,
      illegalAttempt: previousAttempt,
      isFallback: true,
      isValid: true, // Fallback is always valid
    };
  }

  // First attempt invalid - need retry
  const attemptedCard = { rank: response.rank as Rank, suit: response.suit as Suit };
  return { card: attemptedCard as Card, reasoning: response.reasoning, confidence, isValid: false };
}

// =============================================================================
// Shared Implementation
// =============================================================================

interface DiscardOptions {
  game: GameState;
  modelId: string;
  onToken?: (token: string) => void;
  promptOptions?: PromptOptions;
}

async function makeDiscardDecisionInternal(options: DiscardOptions): Promise<DiscardResult> {
  const { game, modelId, onToken, promptOptions } = options;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const ctx = prepareDiscardContext(game, modelId, promptOptions);
  const isStreaming = !!onToken;

  logger.info(`Discard ${isStreaming ? "streaming " : ""}starting`, {
    correlationId,
    player: ctx.player,
    modelId,
    action: "discard",
  });

  const model = getModel(modelId);

  const attemptDecision = async (retryNote?: string): Promise<{ response: DiscardResponse; usage?: LanguageModelUsage }> => {
    const userContent = retryNote ? `Which card do you discard?\n\n${retryNote}` : "Which card do you discard?";
    const timeout = createTimeout();

    try {
      if (isStreaming) {
        const { partialObjectStream, object: finalObjectPromise, usage: usagePromise } = await withRetry(
          async () =>
            streamObject({
              model,
              schema: DiscardSchema,
              schemaName: "Discard",
              schemaDescription: "A discard decision in Euchre",
              ...getModelConfig(modelId),
              abortSignal: timeout.signal,
              experimental_telemetry: buildTelemetryConfig("discard_stream", { player: ctx.player, modelId }),
              messages: [
                { role: "system", content: ctx.systemPrompt },
                { role: "user", content: userContent },
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

        const [response, usage] = await Promise.all([finalObjectPromise, usagePromise]);
        return { response, usage };
      } else {
        const { object, usage } = await withRetry(
          () =>
            generateObject({
              model,
              schema: DiscardSchema,
              schemaName: "Discard",
              schemaDescription: "A discard decision in Euchre",
              ...getModelConfig(modelId),
              abortSignal: timeout.signal,
              experimental_telemetry: buildTelemetryConfig("discard", { player: ctx.player, modelId }),
              messages: [
                { role: "system", content: ctx.systemPrompt },
                { role: "user", content: userContent },
              ],
            }),
          `Discard for ${ctx.player} (${modelId})`,
        );
        return { response: object, usage };
      }
    } finally {
      timeout.cleanup();
    }
  };

  // First attempt
  const { response: firstResponse, usage } = await attemptDecision();
  let result = processDiscardResult(firstResponse, ctx);

  // Retry if invalid card selected
  if (!result.isValid) {
    const chosenCardStr = `${firstResponse.rank} of ${firstResponse.suit}`;
    logger.warn("Illegal card selected, retrying", { correlationId, player: ctx.player, modelId, attemptedCard: chosenCardStr });

    const { response: retryResponse } = await attemptDecision(buildRetryNote(chosenCardStr, ctx.handList));
    result = processDiscardResult(retryResponse, ctx, { card: result.card, reasoning: result.reasoning });
  }

  const duration = Date.now() - startTime;
  logger.info(`Discard ${isStreaming ? "streaming " : ""}completed`, {
    correlationId,
    player: ctx.player,
    modelId,
    card: cardToString(result.card),
    duration,
    tokenUsage: mapUsageToTokenUsage(usage),
    isFallback: result.isFallback,
  });

  return {
    card: result.card,
    reasoning: result.reasoning,
    confidence: result.confidence,
    duration,
    illegalAttempt: result.illegalAttempt,
    isFallback: result.isFallback,
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
  promptOptions?: PromptOptions,
): Promise<DiscardResult> {
  return makeDiscardDecisionInternal({ game, modelId, onToken, promptOptions });
}
