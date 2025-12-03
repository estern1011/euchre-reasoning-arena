import { describe, it, expect } from "vitest";
import { formatSuit, formatCard, formatPosition } from "../formatting";
import type { Suit, Card, Position } from "../types";

describe("formatSuit", () => {
  it("should format hearts as ♥", () => {
    expect(formatSuit("hearts")).toBe("♥");
  });

  it("should format diamonds as ♦", () => {
    expect(formatSuit("diamonds")).toBe("♦");
  });

  it("should format clubs as ♣", () => {
    expect(formatSuit("clubs")).toBe("♣");
  });

  it("should format spades as ♠", () => {
    expect(formatSuit("spades")).toBe("♠");
  });

  it("should format all suits correctly", () => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const symbols = ["♥", "♦", "♣", "♠"];

    suits.forEach((suit, index) => {
      expect(formatSuit(suit)).toBe(symbols[index]);
    });
  });
});

describe("formatCard", () => {
  it("should format card with rank and suit symbol", () => {
    const card: Card = { rank: "ace", suit: "hearts" };
    expect(formatCard(card)).toBe("ace♥");
  });

  it("should format all ranks with hearts", () => {
    const ranks = ["9", "10", "jack", "queen", "king", "ace"] as const;

    ranks.forEach((rank) => {
      const card: Card = { rank, suit: "hearts" };
      expect(formatCard(card)).toBe(`${rank}♥`);
    });
  });

  it("should format all suits with ace", () => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const symbols = ["♥", "♦", "♣", "♠"];

    suits.forEach((suit, index) => {
      const card: Card = { rank: "ace", suit };
      expect(formatCard(card)).toBe(`ace${symbols[index]}`);
    });
  });

  it("should format various card combinations", () => {
    expect(formatCard({ rank: "9", suit: "hearts" })).toBe("9♥");
    expect(formatCard({ rank: "10", suit: "diamonds" })).toBe("10♦");
    expect(formatCard({ rank: "jack", suit: "clubs" })).toBe("jack♣");
    expect(formatCard({ rank: "queen", suit: "spades" })).toBe("queen♠");
    expect(formatCard({ rank: "king", suit: "hearts" })).toBe("king♥");
    expect(formatCard({ rank: "ace", suit: "diamonds" })).toBe("ace♦");
  });

  it("should handle left bower (jack of same color)", () => {
    const leftBower: Card = { rank: "jack", suit: "diamonds" };
    expect(formatCard(leftBower)).toBe("jack♦");
  });

  it("should handle right bower (jack of trump)", () => {
    const rightBower: Card = { rank: "jack", suit: "hearts" };
    expect(formatCard(rightBower)).toBe("jack♥");
  });
});

describe("formatPosition", () => {
  it("should uppercase north", () => {
    expect(formatPosition("north")).toBe("NORTH");
  });

  it("should uppercase east", () => {
    expect(formatPosition("east")).toBe("EAST");
  });

  it("should uppercase south", () => {
    expect(formatPosition("south")).toBe("SOUTH");
  });

  it("should uppercase west", () => {
    expect(formatPosition("west")).toBe("WEST");
  });

  it("should uppercase all positions correctly", () => {
    const positions: Position[] = ["north", "east", "south", "west"];

    positions.forEach((position) => {
      expect(formatPosition(position)).toBe(position.toUpperCase());
    });
  });

  it("should maintain consistency with position order", () => {
    const positions: Position[] = ["north", "east", "south", "west"];
    const formatted = positions.map(formatPosition);

    expect(formatted).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
  });
});

describe("formatting integration", () => {
  it("should work together for complete game display", () => {
    const card: Card = { rank: "ace", suit: "hearts" };
    const position: Position = "north";

    const formattedCard = formatCard(card);
    const formattedPosition = formatPosition(position);

    expect(`[${formattedPosition}] PLAYED ${formattedCard}`).toBe(
      "[NORTH] PLAYED ace♥"
    );
  });

  it("should format a complete hand", () => {
    const hand: Card[] = [
      { rank: "9", suit: "hearts" },
      { rank: "10", suit: "diamonds" },
      { rank: "jack", suit: "clubs" },
      { rank: "queen", suit: "spades" },
      { rank: "king", suit: "hearts" },
    ];

    const formattedHand = hand.map(formatCard).join(", ");
    expect(formattedHand).toBe("9♥, 10♦, jack♣, queen♠, king♥");
  });
});
