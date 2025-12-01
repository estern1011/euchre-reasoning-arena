import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type {
  GameState,
  Position,
  Card,
  Suit,
  TrumpBidAction,
} from "~/lib/game/types";
import {
  formatTrumpSelectionForAI,
  formatGameStateForAI,
} from "~/lib/game/game";
import { cardToString } from "~/lib/game/card";

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
}

/**
 * Get the Vercel AI Gateway client
 */
function getGatewayClient() {
  const token = process.env.VERCEL_AI_GATEWAY_TOKEN;
  if (!token) {
    throw new Error("VERCEL_AI_GATEWAY_TOKEN environment variable is not set");
  }

  return createOpenAI({
    baseURL: "https://gateway.ai.cloudflare.com/v1",
    apiKey: token,
  });
}

/**
 * Get the appropriate AI model from the gateway
 * Model IDs include provider prefix (e.g., "google/gemini-2.5-flash-lite")
 */
function getModel(modelId: string) {
  const gateway = getGatewayClient();
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
    if (
      lowerResponse.includes("order up") ||
      lowerResponse.includes("order it up")
    ) {
      return {
        action: "order_up",
        goingAlone,
        reasoning: response,
        duration: 0, // Set by caller
      };
    }
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
    temperature: 0.7,
    maxTokens: 500,
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
  const playerObj = game.players.find((p) => p.position === player)!;

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
Format: "[RANK] of [SUIT]" (e.g., "Ace of Hearts" or "Jack of Spades")`;

  const { text } = await generateText({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: gameContext },
    ],
    temperature: 0.7,
    maxTokens: 500,
  });

  const duration = Date.now() - startTime;
  const selectedCard = parseCardPlay(text, playerObj.hand);

  return {
    card: selectedCard,
    reasoning: text,
    duration,
  };
}
