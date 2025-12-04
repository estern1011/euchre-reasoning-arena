import { createGateway, streamObject, generateObject } from "ai";
import { z } from "zod";
import type {
  GameState,
  Position,
  Card,
  Suit,
  TrumpBidAction,
  Rank,
} from "../../lib/game/types";
import {
  formatTrumpSelectionForAI,
  formatGameStateForAI,
  getValidCardsForPlay,
} from "../../lib/game/game";
import { cardToString, cardsEqual } from "../../lib/game/card";

/**
 * AI Agent service for making game decisions via Vercel AI Gateway
 * Uses structured output (Zod schemas) for reliable parsing
 */

// Logger abstraction (can be replaced with proper logger)
const logger = {
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
};

// =============================================================================
// Zod Schemas
// =============================================================================

const CardPlaySchema = z.object({
  reasoning: z.string().describe("Your strategic analysis of the game state and why you chose this card"),
  rank: z.enum(["9", "10", "jack", "queen", "king", "ace"]).describe("The rank of the card to play"),
  suit: z.enum(["hearts", "diamonds", "clubs", "spades"]).describe("The suit of the card to play"),
});

const TrumpBidSchema = z.object({
  reasoning: z.string().describe("Your strategic analysis of your hand and the game state"),
  action: z.enum(["pass", "order_up", "call_trump"]).describe("Your bidding decision"),
  suit: z.enum(["hearts", "diamonds", "clubs", "spades"]).optional().describe("The suit to call (only for call_trump action)"),
  goingAlone: z.boolean().describe("Whether to go alone (without partner)"),
});

const DiscardSchema = z.object({
  reasoning: z.string().describe("Your analysis of which card to discard"),
  rank: z.enum(["9", "10", "jack", "queen", "king", "ace"]).describe("The rank of the card to discard"),
  suit: z.enum(["hearts", "diamonds", "clubs", "spades"]).describe("The suit of the card to discard"),
});

type CardPlayResponse = z.infer<typeof CardPlaySchema>;
type TrumpBidResponse = z.infer<typeof TrumpBidSchema>;
type DiscardResponse = z.infer<typeof DiscardSchema>;

// =============================================================================
// Result Interfaces
// =============================================================================

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

// =============================================================================
// Gateway & Model Setup
// =============================================================================

function getGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY environment variable is not set");
  }
  return createGateway({ apiKey });
}

function getModel(modelId: string) {
  return getGateway()(modelId);
}

// =============================================================================
// Shared Utilities
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

/** Stream reasoning tokens from partialObjectStream */
async function streamReasoningTokens<T extends { reasoning?: string }>(
  partialObjectStream: AsyncIterable<Partial<T>>,
  onToken: (token: string) => void,
): Promise<void> {
  let lastReasoning = "";
  for await (const partial of partialObjectStream) {
    if (partial.reasoning && partial.reasoning !== lastReasoning) {
      const newText = partial.reasoning.slice(lastReasoning.length);
      if (newText) onToken(newText);
      lastReasoning = partial.reasoning;
    }
  }
}

// =============================================================================
// System Prompts
// =============================================================================

function buildTrumpBidSystemPrompt(round: 1 | 2, turnedUpSuit: Suit): string {
  if (round === 1) {
    return `You are an expert Euchre player. Analyze the game state carefully and make the best trump bidding decision.

This is ROUND 1. The turned-up card suit is ${turnedUpSuit}. You may either:
- ORDER UP: Tell the dealer to pick up the ${turnedUpSuit} card (making ${turnedUpSuit} trump)
- PASS: Decline and let the next player decide

Key principles:
- Order up when you have 3+ cards of the turned-up suit, or 2 strong trump + other high cards
- Consider going alone only with an exceptional hand (4+ trump including bowers)
- Think about your partner's position and team strategy

Provide your reasoning and decision.`;
  }

  return `You are an expert Euchre player. Analyze the game state carefully and make the best trump bidding decision.

This is ROUND 2. The turned-up card (${turnedUpSuit}) was turned down. You may either:
- CALL TRUMP: Name any suit EXCEPT ${turnedUpSuit} as trump
- PASS: Decline (unless you're the dealer - dealer MUST call in round 2)

Key principles:
- Call trump when you have strength in another suit (3+ cards or 2 high cards)
- Consider going alone only with an exceptional hand
- If you're dealer, you MUST call - pick your strongest suit

Provide your reasoning and decision.`;
}

function buildCardPlaySystemPrompt(validCardsList: string): string {
  return `You are an expert Euchre player. Analyze the game state and select the best card to play.

Key principles:
- Follow suit if you can (required by Euchre rules)
- Lead with trump to draw out opponent trump
- Save high trump (bowers, aces) for critical moments
- Support your partner's strong plays
- Count cards to track what's been played

You MUST choose one of these valid cards: ${validCardsList}
Do not choose any card that is not in this list.`;
}

function buildDiscardSystemPrompt(handStr: string, trump: Suit): string {
  return `You are an expert Euchre player. You are the dealer and just picked up the trump card.
You now have 6 cards in your hand and must discard one to get back to 5 cards.

Key principles for discarding:
- Never discard trump cards (especially bowers)
- Discard your weakest off-suit card (usually a 9 or 10 of a non-trump suit)
- Keep cards that could be useful for taking tricks
- Consider keeping aces and kings of off-suits
- If you have a singleton in an off-suit, consider discarding it

Your hand: ${handStr}
Trump suit: ${trump}

Choose the best card to discard from your hand.`;
}

// =============================================================================
// Card Play Logic (shared between streaming and non-streaming)
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
  const gameContext = formatGameStateForAI(game, player);
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

function processCardPlayResult(
  response: CardPlayResponse,
  ctx: CardPlayContext,
  previousAttempt?: { card: Card; reasoning: string },
): { card: Card; reasoning: string; illegalAttempt?: { card: Card; reasoning: string }; isFallback?: boolean } {
  const card = findCardInHand(response.rank as Rank, response.suit as Suit, ctx.validCards, ctx.playerHand);
  const isValid = ctx.validCards.some((c) => cardsEqual(c, card));

  if (isValid && !previousAttempt) {
    return { card, reasoning: response.reasoning };
  }

  if (isValid && previousAttempt) {
    return { card, reasoning: response.reasoning, illegalAttempt: previousAttempt };
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
    };
  }

  // First attempt invalid - need retry
  return { card, reasoning: response.reasoning };
}

function buildRetryNote(chosenCardStr: string, validCardsList: string): string {
  return `IMPORTANT: Your previous selection (${chosenCardStr}) was ILLEGAL. You MUST choose exactly one card from this list: ${validCardsList}. Do not choose any other card.`;
}

// =============================================================================
// Trump Bid Functions
// =============================================================================

export async function makeTrumpBidDecision(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
): Promise<TrumpBidResult> {
  const startTime = Date.now();
  const gameContext = formatTrumpSelectionForAI(game, player);
  const { round, turnedUpCard } = game.trumpSelection!;
  const systemPrompt = customPrompt || buildTrumpBidSystemPrompt(round, turnedUpCard.suit);

  const { object } = await generateObject({
    model: getModel(modelId),
    schema: TrumpBidSchema,
    schemaName: "TrumpBid",
    schemaDescription: "A trump bidding decision in Euchre",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: gameContext },
    ],
  });

  return {
    action: object.action as TrumpBidAction,
    suit: object.suit as Suit | undefined,
    goingAlone: object.goingAlone,
    reasoning: object.reasoning,
    duration: Date.now() - startTime,
  };
}

export async function makeTrumpBidDecisionStreaming(
  game: GameState,
  player: Position,
  modelId: string,
  onToken: (token: string) => void,
  customPrompt?: string,
): Promise<TrumpBidResult> {
  const startTime = Date.now();
  const gameContext = formatTrumpSelectionForAI(game, player);
  const { round, turnedUpCard } = game.trumpSelection!;
  const systemPrompt = customPrompt || buildTrumpBidSystemPrompt(round, turnedUpCard.suit);

  const { partialObjectStream, object: finalObjectPromise } = streamObject({
    model: getModel(modelId),
    schema: TrumpBidSchema,
    schemaName: "TrumpBid",
    schemaDescription: "A trump bidding decision in Euchre",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: gameContext },
    ],
  });

  await streamReasoningTokens(partialObjectStream, onToken);
  const object = await finalObjectPromise;

  return {
    action: object.action as TrumpBidAction,
    suit: object.suit as Suit | undefined,
    goingAlone: object.goingAlone,
    reasoning: object.reasoning,
    duration: Date.now() - startTime,
  };
}

// =============================================================================
// Card Play Functions
// =============================================================================

export async function makeCardPlayDecision(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
): Promise<CardPlayResult> {
  const startTime = Date.now();
  const ctxOrResult = prepareCardPlayContext(game, player, modelId, customPrompt);

  // Early return for trivial cases
  if ("card" in ctxOrResult) {
    return { ...ctxOrResult, duration: Date.now() - startTime };
  }

  const ctx = ctxOrResult;
  const model = getModel(modelId);

  const attemptDecision = async (retryNote?: string): Promise<CardPlayResponse> => {
    const userContent = `${ctx.gameContext}\n\nValid cards you may play: ${ctx.validCardsList}${retryNote ? `\n${retryNote}` : ""}`;
    const { object } = await generateObject({
      model,
      schema: CardPlaySchema,
      schemaName: "CardPlay",
      schemaDescription: "A card play decision in Euchre",
      messages: [
        { role: "system", content: ctx.systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    return object;
  };

  // First attempt
  const firstResponse = await attemptDecision();
  let result = processCardPlayResult(firstResponse, ctx);

  // Retry if invalid
  if (!ctx.validCards.some((c) => cardsEqual(c, result.card)) && !result.isFallback) {
    const chosenCardStr = cardToString(result.card);
    logger.warn(`[AI-Agent] Illegal card from ${player} (${modelId}). Chosen ${chosenCardStr} is not legal. Retrying.`);

    const retryResponse = await attemptDecision(buildRetryNote(chosenCardStr, ctx.validCardsList));
    result = processCardPlayResult(retryResponse, ctx, { card: result.card, reasoning: result.reasoning });
  }

  return { ...result, duration: Date.now() - startTime };
}

export async function makeCardPlayDecisionStreaming(
  game: GameState,
  player: Position,
  modelId: string,
  onToken: (token: string) => void,
  customPrompt?: string,
): Promise<CardPlayResult> {
  const startTime = Date.now();
  const ctxOrResult = prepareCardPlayContext(game, player, modelId, customPrompt);

  // Early return for trivial cases
  if ("card" in ctxOrResult) {
    onToken(ctxOrResult.reasoning);
    return { ...ctxOrResult, duration: Date.now() - startTime };
  }

  const ctx = ctxOrResult;
  const model = getModel(modelId);

  const attemptDecisionStreaming = async (retryNote?: string): Promise<CardPlayResponse> => {
    const userContent = `${ctx.gameContext}\n\nValid cards you may play: ${ctx.validCardsList}${retryNote ? `\n${retryNote}` : ""}`;
    const { partialObjectStream, object: finalObjectPromise } = streamObject({
      model,
      schema: CardPlaySchema,
      schemaName: "CardPlay",
      schemaDescription: "A card play decision in Euchre",
      messages: [
        { role: "system", content: ctx.systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    await streamReasoningTokens(partialObjectStream, onToken);
    return finalObjectPromise;
  };

  // First attempt
  const firstResponse = await attemptDecisionStreaming();
  let result = processCardPlayResult(firstResponse, ctx);

  // Retry if invalid
  if (!ctx.validCards.some((c) => cardsEqual(c, result.card)) && !result.isFallback) {
    const chosenCardStr = cardToString(result.card);
    logger.warn(`[AI-Agent] Illegal card from ${player} (${modelId}). Chosen ${chosenCardStr} is not legal. Retrying.`);

    const retryResponse = await attemptDecisionStreaming(buildRetryNote(chosenCardStr, ctx.validCardsList));
    result = processCardPlayResult(retryResponse, ctx, { card: result.card, reasoning: result.reasoning });
  }

  return { ...result, duration: Date.now() - startTime };
}

// =============================================================================
// Discard Function
// =============================================================================

export async function makeDiscardDecisionStreaming(
  game: GameState,
  modelId: string,
  onToken: (token: string) => void,
): Promise<DiscardResult> {
  const startTime = Date.now();
  const dealerObj = game.players.find((p) => p.position === game.dealer)!;
  const hand = dealerObj.hand;
  const handStr = hand.map(formatCardForPrompt).join(", ");
  const systemPrompt = buildDiscardSystemPrompt(handStr, game.trump!);

  const { partialObjectStream, object: finalObjectPromise } = streamObject({
    model: getModel(modelId),
    schema: DiscardSchema,
    schemaName: "Discard",
    schemaDescription: "A discard decision in Euchre",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Choose a card to discard from: ${handStr}` },
    ],
  });

  await streamReasoningTokens(partialObjectStream, onToken);
  const object = await finalObjectPromise;

  return {
    card: findCardInHand(object.rank as Rank, object.suit as Suit, hand, hand),
    reasoning: object.reasoning,
    duration: Date.now() - startTime,
  };
}
