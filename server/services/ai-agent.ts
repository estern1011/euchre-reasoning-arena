/* eslint-disable no-console */
import { createGateway, generateText, streamText } from "ai";
import type {
  GameState,
  Position,
  Card,
  Suit,
  TrumpBidAction,
} from "../../lib/game/types";
import {
  formatTrumpSelectionForAI,
  formatGameStateForAI,
  getValidCardsForPlay,
} from "../../lib/game/game";
import { cardToString, cardsEqual } from "../../lib/game/card";

/**
 * AI Agent service for making game decisions via Vercel AI Gateway
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
  illegalAttempt?: {
    card: Card;
    reasoning: string;
  };
  isFallback?: boolean;
}

/**
 * Get the Vercel AI Gateway instance
 */
function getGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY environment variable is not set");
  }

  return createGateway({
    apiKey,
  });
}

/**
 * Get the appropriate AI model from the gateway
 * Model IDs include provider prefix (e.g., "google/gemini-2.5-flash-lite")
 */
function getModel(modelId: string) {
  const gateway = getGateway();
  return gateway(modelId);
}

/**
 * Parse AI response for trump bidding
 */
function parseTrumpBid(
  response: string,
  round: 1 | 2,
  turnedUpSuit: Suit,
): TrumpBidResult {
  const lowerResponse = response.toLowerCase();

  // Check for going alone
  const goingAlone =
    lowerResponse.includes("going alone") || lowerResponse.includes("go alone");

  // Round 1: order up or pass
  if (round === 1) {
    // Look for explicit action at the end or in structured format
    // Check for "PASS" as final decision first (more specific)
    if (
      /\bpass\b(?!.*\border.*up\b)/i.test(response) || // "pass" not followed by "order up"
      response.trim().toLowerCase().endsWith("pass") ||
      /\b(action|decision|choice):\s*pass\b/i.test(response)
    ) {
      return {
        action: "pass",
        goingAlone: false,
        reasoning: response,
        duration: 0,
      };
    }

    // Check for ORDER_UP as explicit action
    if (
      /\b(order\s*up|order\s*it\s*up)\b/i.test(response) &&
      !/\b(don't|do not|should not|shouldn't)\s*(order.*up)/i.test(response)
    ) {
      return {
        action: "order_up",
        goingAlone,
        reasoning: response,
        duration: 0, // Set by caller
      };
    }

    // Default to pass if unclear
    return {
      action: "pass",
      goingAlone: false,
      reasoning: response,
      duration: 0,
    };
  }

  // Round 2: call trump or pass
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  for (const suit of suits) {
    if (suit !== turnedUpSuit && lowerResponse.includes(suit)) {
      return {
        action: "call_trump",
        suit,
        goingAlone,
        reasoning: response,
        duration: 0,
      };
    }
  }

  return {
    action: "pass",
    goingAlone: false,
    reasoning: response,
    duration: 0,
  };
}

/**
 * Parse AI response for card play
 */
function parseCardPlay(response: string, validCards: Card[]): Card {
  const lowerResponse = response.toLowerCase();

  // Try to find a card mention in the response
  for (const card of validCards) {
    const cardStr = cardToString(card).toLowerCase();
    const rankNames: Record<string, string[]> = {
      "9": ["9", "nine"],
      "10": ["10", "ten"],
      jack: ["jack", "j"],
      queen: ["queen", "q"],
      king: ["king", "k"],
      ace: ["ace", "a"],
    };

    const suitNames: Record<Suit, string[]> = {
      hearts: ["hearts", "heart", "♥"],
      diamonds: ["diamonds", "diamond", "♦"],
      clubs: ["clubs", "club", "♣"],
      spades: ["spades", "spade", "♠"],
    };

    // Check if response mentions this card
    const rankMatches = rankNames[card.rank].some((r) =>
      lowerResponse.includes(r),
    );
    const suitMatches = suitNames[card.suit].some((s) =>
      lowerResponse.includes(s),
    );

    if (rankMatches && suitMatches) {
      return card;
    }
  }

  // Fallback: return first valid card
  return validCards[0];
}

function formatCardForPrompt(card: Card): string {
  return `${card.rank.toUpperCase()} of ${card.suit}`;
}

/**
 * Make a trump bid decision using AI
 */
export async function makeTrumpBidDecision(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
): Promise<TrumpBidResult> {
  const startTime = Date.now();

  const model = getModel(modelId);
  const gameContext = formatTrumpSelectionForAI(game, player);

  const systemPrompt =
    customPrompt ||
    `You are an expert Euchre player. Analyze the game state carefully and make the best trump bidding decision.

Key principles:
- Order up or call trump when you have a strong hand (3+ trump cards, or multiple high cards)
- Consider going alone only with an exceptional hand (4+ trump including bowers, or near-guaranteed 5 tricks)
- Be conservative as dealer in round 2 - you must call, so choose wisely
- Think about your partner's position and team strategy

Respond with your decision and reasoning. Format your final decision clearly:
- For ordering up: Say "ORDER UP" (add "GOING ALONE" if applicable)
- For calling trump: Say "CALL [SUIT]" (add "GOING ALONE" if applicable)
- For passing: Say "PASS"`;

  const { text } = await generateText({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: gameContext },
    ],
  });

  const duration = Date.now() - startTime;
  const result = parseTrumpBid(
    text,
    game.trumpSelection!.round,
    game.trumpSelection!.turnedUpCard.suit,
  );

  result.duration = duration;
  return result;
}

/**
 * Make a card play decision using AI
 */
export async function makeCardPlayDecision(
  game: GameState,
  player: Position,
  modelId: string,
  customPrompt?: string,
): Promise<CardPlayResult> {
  const startTime = Date.now();

  const model = getModel(modelId);
  const gameContext = formatGameStateForAI(game, player);
  const playerObj = game.players.find(
    (p: { position: Position }) => p.position === player,
  )!;
  const validCards = getValidCardsForPlay(game, player);

  if (validCards.length === 0) {
    console.warn(
      `[AI-Agent] No legal cards computed for ${player} (${modelId}). Falling back to first card in hand.`,
    );
    const fallbackCard = playerObj.hand[0];
    return {
      card: fallbackCard,
      reasoning:
        "No legal cards detected; playing the first card in hand as a safeguard.",
      duration: Date.now() - startTime,
    };
  }

  // If only one legal card, auto-play without prompting the model
  if (validCards.length === 1) {
    return {
      card: validCards[0],
      reasoning:
        "Only one legal card available; playing it automatically to follow suit.",
      duration: Date.now() - startTime,
    };
  }

  const validCardsList = validCards.map(formatCardForPrompt).join(", ");

  const systemPrompt =
    customPrompt ||
    `You are an expert Euchre player. Analyze the game state and select the best card to play.

Key principles:
- Follow suit if you can (required)
- Lead with trump to draw out opponent trump
- Save high trump (bowers, aces) for critical moments
- Support your partner's strong plays
- Count cards to track what's been played

Respond with your reasoning and card selection. Clearly state which card you're playing at the end.
Format: "[RANK] of [SUIT]" (e.g., "Ace of Hearts" or "Jack of Spades"). You must choose one of these legal cards: ${validCardsList}. Do not choose any other card.`;

  const attemptDecision = async (
    retryNote?: string,
  ): Promise<{ reasoning: string; card: Card }> => {
    const messages: { role: "system" | "user"; content: string }[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${gameContext}\n\nValid cards you may play: ${validCardsList}${retryNote ? `\n${retryNote}` : ""}`,
      },
    ];

    const { text } = await generateText({
      model,
      messages,
    });

    const parsed = parseCardPlay(text, playerObj.hand);
    return { reasoning: text, card: parsed };
  };

  // First attempt
  let { reasoning, card } = await attemptDecision();

  const isValidChoice = validCards.some((c) => cardsEqual(c, card));

  // Retry once with a stricter prompt if the model chose an illegal card
  if (!isValidChoice) {
    const chosenCardStr = cardToString(card);
    console.warn(
      `[AI-Agent] Illegal card from ${player} (${modelId}). Chosen ${chosenCardStr} is not legal. Retrying with explicit valid card list.`,
    );
    const retry = await attemptDecision(
      "Your previous selection was illegal. Choose exactly one card from the valid list above and nothing else.",
    );
    reasoning = retry.reasoning;
    card = retry.card;

    if (!validCards.some((c) => cardsEqual(c, card))) {
      console.warn(
        `[AI-Agent] Illegal card persisted after retry from ${player} (${modelId}). Falling back to first legal card ${cardToString(validCards[0])}.`,
      );
      card = validCards[0];
      reasoning =
        reasoning +
        `\n\n[Fell back to first legal card: ${formatCardForPrompt(card)}]`;
    }
  }

  const duration = Date.now() - startTime;

  return {
    card,
    reasoning,
    duration,
  };
}

/**
 * Make a trump bid decision with streaming support
 * @param onToken - Callback called for each token as it streams
 */
export async function makeTrumpBidDecisionStreaming(
  game: GameState,
  player: Position,
  modelId: string,
  onToken: (token: string) => void,
  customPrompt?: string,
): Promise<TrumpBidResult> {
  const startTime = Date.now();

  const model = getModel(modelId);
  const gameContext = formatTrumpSelectionForAI(game, player);

  const systemPrompt =
    customPrompt ||
    `You are an expert Euchre player. Analyze the game state carefully and make the best trump bidding decision.

Key principles:
- Order up or call trump when you have a strong hand (3+ trump cards, or multiple high cards)
- Consider going alone only with an exceptional hand (4+ trump including bowers, or near-guaranteed 5 tricks)
- Be conservative as dealer in round 2 - you must call, so choose wisely
- Think about your partner's position and team strategy

Respond with your decision and reasoning. Format your final decision clearly:
- For ordering up: Say "ORDER UP" (add "GOING ALONE" if applicable)
- For calling trump: Say "CALL [SUIT]" (add "GOING ALONE" if applicable)
- For passing: Say "PASS"`;

  const { textStream } = await streamText({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: gameContext },
    ],
  });

  let fullText = "";
  for await (const token of textStream) {
    fullText += token;
    onToken(token);
  }

  const duration = Date.now() - startTime;
  const result = parseTrumpBid(
    fullText,
    game.trumpSelection!.round,
    game.trumpSelection!.turnedUpCard.suit,
  );

  result.duration = duration;
  return result;
}

/**
 * Make a card play decision with streaming support
 * @param onToken - Callback called for each token as it streams
 */
export async function makeCardPlayDecisionStreaming(
  game: GameState,
  player: Position,
  modelId: string,
  onToken: (token: string) => void,
  customPrompt?: string,
): Promise<CardPlayResult> {
  const startTime = Date.now();

  const model = getModel(modelId);
  const gameContext = formatGameStateForAI(game, player);
  const playerObj = game.players.find(
    (p: { position: Position }) => p.position === player,
  )!;
  const validCards = getValidCardsForPlay(game, player);

  if (validCards.length === 0) {
    console.warn(
      `[AI-Agent] No legal cards computed for ${player} (${modelId}). Falling back to first card in hand.`,
    );
    const fallbackCard = playerObj.hand[0];
    const reasoning = "No legal cards detected; playing the first card in hand as a safeguard.";
    onToken(reasoning);
    return {
      card: fallbackCard,
      reasoning,
      duration: Date.now() - startTime,
    };
  }

  if (validCards.length === 1) {
    const reasoning = "Only one legal card available; playing it automatically to follow suit.";
    onToken(reasoning);
    return {
      card: validCards[0],
      reasoning,
      duration: Date.now() - startTime,
    };
  }

  const validCardsList = validCards.map(formatCardForPrompt).join(", ");

  const systemPrompt =
    customPrompt ||
    `You are an expert Euchre player. Analyze the game state and select the best card to play.

Key principles:
- Follow suit if you can (required)
- Lead with trump to draw out opponent trump
- Save high trump (bowers, aces) for critical moments
- Support your partner's strong plays
- Count cards to track what's been played

Respond with your reasoning and card selection. Clearly state which card you're playing at the end.
Format: "[RANK] of [SUIT]" (e.g., "Ace of Hearts" or "Jack of Spades"). You must choose one of these legal cards: ${validCardsList}. Do not choose any other card.`;

  const attemptDecisionStreaming = async (
    retryNote?: string,
  ): Promise<{ reasoning: string; card: Card }> => {
    const messages: { role: "system" | "user"; content: string }[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${gameContext}\n\nValid cards you may play: ${validCardsList}${retryNote ? `\n${retryNote}` : ""}`,
      },
    ];

    const { textStream } = await streamText({
      model,
      messages,
    });

    let fullText = "";
    for await (const token of textStream) {
      fullText += token;
      onToken(token);
    }

    const parsed = parseCardPlay(fullText, playerObj.hand);
    return { reasoning: fullText, card: parsed };
  };

  // First attempt
  let { reasoning, card } = await attemptDecisionStreaming();

  const isValidChoice = validCards.some((c) => cardsEqual(c, card));
  let illegalAttempt: { card: Card; reasoning: string } | undefined;
  let isFallback = false;

  // Retry once if illegal
  if (!isValidChoice) {
    const chosenCardStr = cardToString(card);
    illegalAttempt = { card, reasoning };

    console.warn(
      `[AI-Agent] Illegal card from ${player} (${modelId}). Chosen ${chosenCardStr} is not legal. Retrying with explicit valid card list.`,
    );
    const retry = await attemptDecisionStreaming(
      "Your previous selection was illegal. Choose exactly one card from the valid list above and nothing else.",
    );
    reasoning = retry.reasoning;
    card = retry.card;

    if (!validCards.some((c) => cardsEqual(c, card))) {
      console.warn(
        `[AI-Agent] Illegal card persisted after retry from ${player} (${modelId}). Falling back to first legal card ${cardToString(validCards[0])}.`,
      );
      card = validCards[0];
      isFallback = true;
      reasoning =
        reasoning +
        `\n\n[Fell back to first legal card: ${formatCardForPrompt(card)}]`;
    }
  }

  const duration = Date.now() - startTime;

  return {
    card,
    reasoning,
    duration,
    illegalAttempt,
    isFallback,
  };
}
