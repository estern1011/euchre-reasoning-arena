import type { Rank, Card, Suit } from "./types";

export const rankValues: Record<Rank, number> = {
  "9": 1,
  "10": 2,
  jack: 3,
  queen: 4,
  king: 5,
  ace: 6,
};

// Trump ranking constants
const RIGHT_BOWER_RANK = 100;
const LEFT_BOWER_RANK = 99;
const TRUMP_RANK_OFFSET = 50;

const sameColorSuits: Record<Suit, Suit> = {
  spades: "clubs",
  clubs: "spades",
  hearts: "diamonds",
  diamonds: "hearts",
};

/**
 * Check if card is the right bower (Jack of trump suit)
 */
export function isRightBower(card: Card, trump: Suit): boolean {
  return card.rank === "jack" && card.suit === trump;
}

/**
 * Check if card is the left bower (Jack of same color as trump)
 */
export function isLeftBower(card: Card, trump: Suit): boolean {
  return card.rank === "jack" && card.suit === sameColorSuits[trump];
}

/**
 * Check if card is either bower
 */
export function isBower(card: Card, trump: Suit): boolean {
  return isRightBower(card, trump) || isLeftBower(card, trump);
}

/**
 * Get the effective suit of a card (left bower counts as trump suit)
 */
export function effectiveSuit(card: Card, trump: Suit): Suit {
  if (isRightBower(card, trump) || isLeftBower(card, trump)) {
    return trump;
  }
  return card.suit;
}

/**
 * Get trump ranking for a card (higher number wins)
 */
export function trumpRank(card: Card, trump: Suit): number {
  if (isRightBower(card, trump)) return RIGHT_BOWER_RANK;
  if (isLeftBower(card, trump)) return LEFT_BOWER_RANK;
  if (effectiveSuit(card, trump) === trump) {
    return TRUMP_RANK_OFFSET + rankValues[card.rank];
  }
  return rankValues[card.rank];
}

/**
 * Compare two cards in trump context with optional lead suit
 * Returns: positive if card1 wins, negative if card2 wins, 0 if equal
 */
export function compareCards(
  card1: Card,
  card2: Card,
  trump: Suit,
  leadSuit?: Suit,
): number {
  const suit1 = effectiveSuit(card1, trump);
  const suit2 = effectiveSuit(card2, trump);

  // Trump always beats non-trump
  if (suit1 === trump && suit2 !== trump) return 1;
  if (suit1 !== trump && suit2 === trump) return -1;

  // If both trump, compare by trump rank
  if (suit1 === trump && suit2 === trump) {
    return trumpRank(card1, trump) - trumpRank(card2, trump);
  }

  // If no lead suit specified, or both are non-trump, compare by rank
  if (!leadSuit) {
    return trumpRank(card1, trump) - trumpRank(card2, trump);
  }

  // Lead suit beats non-lead suit (when neither is trump)
  if (suit1 === leadSuit && suit2 !== leadSuit) return 1;
  if (suit1 !== leadSuit && suit2 === leadSuit) return -1;

  // Both follow or both don't - compare ranks
  return trumpRank(card1, trump) - trumpRank(card2, trump);
}

/**
 * Check if a card follows the same suit as the lead card (accounting for bowers)
 */
export function followsSuit(card: Card, leadCard: Card, trump: Suit): boolean {
  const leadSuit = effectiveSuit(leadCard, trump);
  return effectiveSuit(card, trump) === leadSuit;
}

/**
 * Create a standard Euchre deck (24 cards: 9-ace in each suit)
 */
export function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["9", "10", "jack", "queen", "king", "ace"];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Format a card for display (e.g., "J♥")
 */
export function cardToString(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const rankSymbols: Record<Rank, string> = {
    "9": "9",
    "10": "10",
    jack: "J",
    queen: "Q",
    king: "K",
    ace: "A",
  };

  return `${rankSymbols[card.rank]}${suitSymbols[card.suit]}`;
}

/**
 * Format multiple cards for display (e.g., "J♥, A♠, K♦")
 */
export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(", ");
}

/**
 * Remove a card from a hand
 */
export function removeCardFromHand(hand: Card[], cardToRemove: Card): Card[] {
  const index = hand.findIndex(
    (c) => c.suit === cardToRemove.suit && c.rank === cardToRemove.rank,
  );

  if (index === -1) {
    throw new Error(`Card ${cardToString(cardToRemove)} not found in hand`);
  }

  return hand.filter((_, i) => i !== index);
}

/**
 * Check if two cards are equal
 */
export function cardsEqual(card1: Card, card2: Card): boolean {
  return card1.suit === card2.suit && card1.rank === card2.rank;
}
