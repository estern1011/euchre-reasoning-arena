import { generateObject, streamObject, type LanguageModelUsage } from "ai";
import type { GameState, Position, Suit, TrumpBidAction } from "../../../lib/game/types";
import { formatTrumpSelectionForAI } from "../../../lib/game/game";
import { logger, generateCorrelationId } from "./logger";
import { getModel, withRetry, createTimeout, buildTelemetryConfig, getModelConfig } from "./config";
import {
  TrumpBidRound1Schema,
  createRound2SchemaExcludingSuit,
  createRound2DealerSchemaExcludingSuit,
} from "./schemas";
import { buildTrumpBidSystemPrompt, type PromptOptions } from "./prompts";
import type { TrumpBidResult } from "./types";
import { mapUsageToTokenUsage } from "./types";

/**
 * Trump bid decision logic
 * Consolidated streaming/non-streaming implementation
 */

// =============================================================================
// Schema Configuration
// =============================================================================

/** Check if dealer must call (round 2, dealer's turn, 3 passes already) */
function isDealerMustCall(game: GameState, player: Position): boolean {
  const { round, dealer, bids } = game.trumpSelection!;
  if (round !== 2 || player !== dealer) return false;
  const round2Bids = bids.slice(4); // Bids after round 1
  return round2Bids.length === 3 && round2Bids.every((b) => b.action === "pass");
}

/** Get the appropriate schema and config based on bidding context */
function getTrumpBidConfig(game: GameState, player: Position, promptOptions?: PromptOptions) {
  const { round, turnedUpCard } = game.trumpSelection!;
  const mustCall = isDealerMustCall(game, player);
  const excludedSuit = turnedUpCard.suit;

  if (round === 1) {
    return {
      schema: TrumpBidRound1Schema,
      schemaName: "TrumpBidRound1",
      schemaDescription: "Round 1 trump bid: order_up or pass",
      systemPrompt: buildTrumpBidSystemPrompt(1, excludedSuit, false, promptOptions),
    };
  }

  if (mustCall) {
    return {
      schema: createRound2DealerSchemaExcludingSuit(excludedSuit),
      schemaName: "TrumpBidRound2Dealer",
      schemaDescription: `Round 2 dealer must call trump (not ${excludedSuit})`,
      systemPrompt: buildTrumpBidSystemPrompt(2, excludedSuit, true, promptOptions),
    };
  }

  return {
    schema: createRound2SchemaExcludingSuit(excludedSuit),
    schemaName: "TrumpBidRound2",
    schemaDescription: `Round 2 trump bid: call_trump (not ${excludedSuit}) or pass`,
    systemPrompt: buildTrumpBidSystemPrompt(2, excludedSuit, false, promptOptions),
  };
}

// =============================================================================
// Shared Implementation
// =============================================================================

interface TrumpBidOptions {
  game: GameState;
  player: Position;
  modelId: string;
  customPrompt?: string;
  onToken?: (token: string) => void;
  promptOptions?: PromptOptions;
}

async function makeTrumpBidDecisionInternal(options: TrumpBidOptions): Promise<TrumpBidResult> {
  const { game, player, modelId, customPrompt, onToken, promptOptions } = options;
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const gameContext = formatTrumpSelectionForAI(game, player);
  const config = getTrumpBidConfig(game, player, promptOptions);
  const round = game.trumpSelection!.round;
  const isStreaming = !!onToken;

  logger.info(`Trump bid ${isStreaming ? "streaming " : ""}starting`, {
    correlationId,
    player,
    modelId,
    action: `round_${round}`,
  });

  const timeout = createTimeout();
  let usage: LanguageModelUsage | undefined;
  let result: { action: string; suit?: string; goingAlone: boolean; reasoning: string; confidence?: number };

  try {
    if (isStreaming) {
      const { partialObjectStream, object: finalObjectPromise, usage: usagePromise } = await withRetry(
        async () =>
          streamObject({
            model: getModel(modelId),
            schema: config.schema,
            schemaName: config.schemaName,
            schemaDescription: config.schemaDescription,
            ...getModelConfig(modelId),
            abortSignal: timeout.signal,
            experimental_telemetry: buildTelemetryConfig("trump_bid_stream", { player, modelId, round: String(round) }),
            messages: [
              { role: "system", content: customPrompt || config.systemPrompt },
              { role: "user", content: gameContext },
            ],
          }),
        `Trump bid stream for ${player} (${modelId})`,
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

      [result, usage] = await Promise.all([finalObjectPromise, usagePromise]);
    } else {
      const response = await withRetry(
        () =>
          generateObject({
            model: getModel(modelId),
            schema: config.schema,
            schemaName: config.schemaName,
            schemaDescription: config.schemaDescription,
            ...getModelConfig(modelId),
            abortSignal: timeout.signal,
            experimental_telemetry: buildTelemetryConfig("trump_bid", { player, modelId, round: String(round) }),
            messages: [
              { role: "system", content: customPrompt || config.systemPrompt },
              { role: "user", content: gameContext },
            ],
          }),
        `Trump bid for ${player} (${modelId})`,
      );

      result = response.object;
      usage = response.usage;
    }
  } finally {
    timeout.cleanup();
  }

  const duration = Date.now() - startTime;
  logger.info(`Trump bid ${isStreaming ? "streaming " : ""}completed`, {
    correlationId,
    player,
    modelId,
    action: result.action,
    duration,
    tokenUsage: mapUsageToTokenUsage(usage),
  });

  return {
    action: result.action as TrumpBidAction,
    suit: "suit" in result ? (result.suit as Suit) : undefined,
    goingAlone: result.goingAlone,
    reasoning: result.reasoning,
    confidence: result.confidence ?? 50, // Default to 50% if not provided
    duration,
  };
}

// =============================================================================
// Public API
// =============================================================================

export async function makeTrumpBidDecision(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
  promptOptions?: PromptOptions,
): Promise<TrumpBidResult> {
  return makeTrumpBidDecisionInternal({ game, player, modelId, customPrompt, promptOptions });
}

export async function makeTrumpBidDecisionStreaming(
  game: GameState,
  player: Position,
  modelId: string,
  onToken: (token: string) => void,
  customPrompt?: string,
  promptOptions?: PromptOptions,
): Promise<TrumpBidResult> {
  return makeTrumpBidDecisionInternal({ game, player, modelId, customPrompt, onToken, promptOptions });
}
