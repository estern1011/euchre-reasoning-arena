import { describe, it, expect } from "vitest";
import type { Card, Suit } from "../types";
import {
  rankValues,
  isRightBower,
  isLeftBower,
  isBower,
  effectiveSuit,
  trumpRank,
  compareCards,
  followsSuit,
  createDeck,
  shuffleDeck,
  cardToString,
  cardsToString,
  removeCardFromHand,
  cardsEqual,
} from "../card";

describe("Card Values", () => {
  it("should have correct rank values", () => {
    expect(rankValues["9"]).toBe(1);
    expect(rankValues["10"]).toBe(2);
    expect(rankValues.jack).toBe(3);
    expect(rankValues.queen).toBe(4);
    expect(rankValues.king).toBe(5);
    expect(rankValues.ace).toBe(6);
  });
});

describe("Bower Detection", () => {
  it("should identify right bower (Jack of trump)", () => {
    const jackOfHearts: Card = { rank: "jack", suit: "hearts" };
    expect(isRightBower(jackOfHearts, "hearts")).toBe(true);
    expect(isRightBower(jackOfHearts, "diamonds")).toBe(false);
  });

  it("should identify left bower (Jack of same color)", () => {
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" };
    expect(isLeftBower(jackOfDiamonds, "hearts")).toBe(true);
    expect(isLeftBower(jackOfDiamonds, "diamonds")).toBe(false);
    expect(isLeftBower(jackOfDiamonds, "spades")).toBe(false);

    const jackOfClubs: Card = { rank: "jack", suit: "clubs" };
    expect(isLeftBower(jackOfClubs, "spades")).toBe(true);
    expect(isLeftBower(jackOfClubs, "hearts")).toBe(false);
  });

  it("should identify any bower", () => {
    const jackOfHearts: Card = { rank: "jack", suit: "hearts" };
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" };
    const queenOfHearts: Card = { rank: "queen", suit: "hearts" };

    expect(isBower(jackOfHearts, "hearts")).toBe(true); // Right bower
    expect(isBower(jackOfDiamonds, "hearts")).toBe(true); // Left bower
    expect(isBower(queenOfHearts, "hearts")).toBe(false); // Not a jack
  });
});

describe("Effective Suit", () => {
  it("should return trump for right bower", () => {
    const jackOfHearts: Card = { rank: "jack", suit: "hearts" };
    expect(effectiveSuit(jackOfHearts, "hearts")).toBe("hearts");
  });

  it("should return trump for left bower", () => {
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" };
    expect(effectiveSuit(jackOfDiamonds, "hearts")).toBe("hearts");
  });

  it("should return actual suit for non-bower cards", () => {
    const aceOfSpades: Card = { rank: "ace", suit: "spades" };
    expect(effectiveSuit(aceOfSpades, "hearts")).toBe("spades");
  });
});

describe("Trump Rank", () => {
  it("should give right bower highest rank (100)", () => {
    const jackOfHearts: Card = { rank: "jack", suit: "hearts" };
    expect(trumpRank(jackOfHearts, "hearts")).toBe(100);
  });

  it("should give left bower second highest rank (99)", () => {
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" };
    expect(trumpRank(jackOfDiamonds, "hearts")).toBe(99);
  });

  it("should give trump cards bonus ranking (50+)", () => {
    const aceOfHearts: Card = { rank: "ace", suit: "hearts" };
    const nineOfHearts: Card = { rank: "9", suit: "hearts" };

    expect(trumpRank(aceOfHearts, "hearts")).toBe(56); // 50 + 6
    expect(trumpRank(nineOfHearts, "hearts")).toBe(51); // 50 + 1
  });

  it("should give non-trump cards standard ranking", () => {
    const aceOfSpades: Card = { rank: "ace", suit: "spades" };
    expect(trumpRank(aceOfSpades, "hearts")).toBe(6);
  });
});

describe("Compare Cards", () => {
  it("should trump always beat non-trump", () => {
    const nineOfHearts: Card = { rank: "9", suit: "hearts" };
    const aceOfSpades: Card = { rank: "ace", suit: "spades" };

    expect(compareCards(nineOfHearts, aceOfSpades, "hearts")).toBeGreaterThan(
      0,
    );
    expect(compareCards(aceOfSpades, nineOfHearts, "hearts")).toBeLessThan(0);
  });

  it("should right bower beat left bower", () => {
    const jackOfHearts: Card = { rank: "jack", suit: "hearts" };
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" };

    expect(
      compareCards(jackOfHearts, jackOfDiamonds, "hearts"),
    ).toBeGreaterThan(0);
  });

  it("should left bower beat other trump", () => {
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" };
    const aceOfHearts: Card = { rank: "ace", suit: "hearts" };

    expect(compareCards(jackOfDiamonds, aceOfHearts, "hearts")).toBeGreaterThan(
      0,
    );
  });

  it("should compare trump cards by rank", () => {
    const aceOfHearts: Card = { rank: "ace", suit: "hearts" };
    const kingOfHearts: Card = { rank: "king", suit: "hearts" };

    expect(compareCards(aceOfHearts, kingOfHearts, "hearts")).toBeGreaterThan(
      0,
    );
  });

  it("should handle lead suit logic", () => {
    const aceOfSpades: Card = { rank: "ace", suit: "spades" };
    const aceOfClubs: Card = { rank: "ace", suit: "clubs" };

    // Spades is lead, clubs didn't follow suit
    expect(
      compareCards(aceOfSpades, aceOfClubs, "hearts", "spades"),
    ).toBeGreaterThan(0);
    // Clubs is lead, spades didn't follow suit
    expect(
      compareCards(aceOfSpades, aceOfClubs, "hearts", "clubs"),
    ).toBeLessThan(0);
  });

  it("should compare non-trump cards by rank when both follow suit", () => {
    const aceOfSpades: Card = { rank: "ace", suit: "spades" };
    const kingOfSpades: Card = { rank: "king", suit: "spades" };

    expect(
      compareCards(aceOfSpades, kingOfSpades, "hearts", "spades"),
    ).toBeGreaterThan(0);
  });

  it("should compare by trump rank when no lead suit specified", () => {
    const aceOfSpades: Card = { rank: "ace", suit: "spades" };
    const kingOfSpades: Card = { rank: "king", suit: "spades" };
    const nineOfHearts: Card = { rank: "9", suit: "hearts" };

    // Without leadSuit, should just compare trump ranks
    expect(compareCards(aceOfSpades, kingOfSpades, "hearts")).toBeGreaterThan(
      0,
    );
    // Trump card beats non-trump even without leadSuit
    expect(compareCards(nineOfHearts, aceOfSpades, "hearts")).toBeGreaterThan(
      0,
    );
  });
});

describe("Follow Suit", () => {
  it("should correctly identify when card follows suit", () => {
    const leadCard: Card = { rank: "ace", suit: "hearts" };
    const followCard: Card = { rank: "9", suit: "hearts" };
    const nonFollowCard: Card = { rank: "ace", suit: "spades" };

    expect(followsSuit(followCard, leadCard, "clubs")).toBe(true);
    expect(followsSuit(nonFollowCard, leadCard, "clubs")).toBe(false);
  });

  it("should handle left bower following trump lead", () => {
    const jackOfHearts: Card = { rank: "jack", suit: "hearts" }; // Lead (right bower)
    const jackOfDiamonds: Card = { rank: "jack", suit: "diamonds" }; // Left bower

    expect(followsSuit(jackOfDiamonds, jackOfHearts, "hearts")).toBe(true);
  });
});

describe("Deck Operations", () => {
  it("should create a standard 24-card Euchre deck", () => {
    const deck = createDeck();

    expect(deck).toHaveLength(24); // 6 ranks × 4 suits

    // Check all suits are present
    const suits = new Set(deck.map((c) => c.suit));
    expect(suits.size).toBe(4);

    // Check all ranks are present
    const ranks = new Set(deck.map((c) => c.rank));
    expect(ranks.size).toBe(6);
    expect(ranks.has("9")).toBe(true);
    expect(ranks.has("10")).toBe(true);
    expect(ranks.has("jack")).toBe(true);
    expect(ranks.has("queen")).toBe(true);
    expect(ranks.has("king")).toBe(true);
    expect(ranks.has("ace")).toBe(true);
  });

  it("should shuffle deck to different order", () => {
    const deck1 = createDeck();
    const deck2 = shuffleDeck(deck1);

    expect(deck2).toHaveLength(24);

    // Very unlikely to be in same order (though technically possible)
    const sameOrder = deck1.every(
      (card, i) => card.suit === deck2[i].suit && card.rank === deck2[i].rank,
    );
    expect(sameOrder).toBe(false);
  });

  it("should maintain all cards after shuffle", () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original);

    // Every card from original should exist in shuffled
    for (const card of original) {
      const found = shuffled.some(
        (c) => c.suit === card.suit && c.rank === card.rank,
      );
      expect(found).toBe(true);
    }
  });
});

describe("Card Formatting", () => {
  it("should format card to string with symbols", () => {
    expect(cardToString({ rank: "jack", suit: "hearts" })).toBe("J♥");
    expect(cardToString({ rank: "ace", suit: "spades" })).toBe("A♠");
    expect(cardToString({ rank: "king", suit: "diamonds" })).toBe("K♦");
    expect(cardToString({ rank: "queen", suit: "clubs" })).toBe("Q♣");
    expect(cardToString({ rank: "9", suit: "hearts" })).toBe("9♥");
    expect(cardToString({ rank: "10", suit: "spades" })).toBe("10♠");
  });

  it("should format multiple cards to string", () => {
    const cards: Card[] = [
      { rank: "jack", suit: "hearts" },
      { rank: "ace", suit: "spades" },
      { rank: "king", suit: "diamonds" },
    ];

    expect(cardsToString(cards)).toBe("J♥, A♠, K♦");
  });
});

describe("Hand Operations", () => {
  it("should remove card from hand", () => {
    const hand: Card[] = [
      { rank: "jack", suit: "hearts" },
      { rank: "ace", suit: "spades" },
      { rank: "king", suit: "diamonds" },
    ];

    const newHand = removeCardFromHand(hand, { rank: "ace", suit: "spades" });

    expect(newHand).toHaveLength(2);
    expect(newHand.some((c) => c.rank === "ace" && c.suit === "spades")).toBe(
      false,
    );
    expect(newHand.some((c) => c.rank === "jack" && c.suit === "hearts")).toBe(
      true,
    );
  });

  it("should throw error when removing card not in hand", () => {
    const hand: Card[] = [{ rank: "jack", suit: "hearts" }];

    expect(() => {
      removeCardFromHand(hand, { rank: "ace", suit: "spades" });
    }).toThrow();
  });

  it("should not mutate original hand", () => {
    const hand: Card[] = [
      { rank: "jack", suit: "hearts" },
      { rank: "ace", suit: "spades" },
    ];

    const newHand = removeCardFromHand(hand, hand[0]);

    expect(hand).toHaveLength(2); // Original unchanged
    expect(newHand).toHaveLength(1); // New hand has one less
  });
});

describe("Card Equality", () => {
  it("should correctly identify equal cards", () => {
    const card1: Card = { rank: "jack", suit: "hearts" };
    const card2: Card = { rank: "jack", suit: "hearts" };

    expect(cardsEqual(card1, card2)).toBe(true);
  });

  it("should correctly identify different cards", () => {
    const card1: Card = { rank: "jack", suit: "hearts" };
    const card2: Card = { rank: "jack", suit: "spades" };
    const card3: Card = { rank: "ace", suit: "hearts" };

    expect(cardsEqual(card1, card2)).toBe(false);
    expect(cardsEqual(card1, card3)).toBe(false);
  });
});
