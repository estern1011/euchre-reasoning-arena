import { describe, it, expect } from "vitest";
import {
  formatCardPlayEntry,
  formatTrumpBidEntry,
  formatIllegalAttemptEntry,
  formatRoundSummaryEntry,
  formatErrorEntry,
} from "../activityLog";
import type { Card, Position } from "~/types/game";

describe("formatCardPlayEntry", () => {
  it("should format card play with step number", () => {
    const card: Card = { rank: "ace", suit: "hearts" };
    const entry = formatCardPlayEntry(1, "north", card);
    expect(entry).toBe("01 | [NORTH] ACTION: PLAYED ace♥");
  });

  it("should pad single-digit step numbers with zero", () => {
    const card: Card = { rank: "9", suit: "clubs" };
    expect(formatCardPlayEntry(1, "south", card)).toBe(
      "01 | [SOUTH] ACTION: PLAYED 9♣"
    );
    expect(formatCardPlayEntry(5, "east", card)).toBe(
      "05 | [EAST] ACTION: PLAYED 9♣"
    );
    expect(formatCardPlayEntry(9, "west", card)).toBe(
      "09 | [WEST] ACTION: PLAYED 9♣"
    );
  });

  it("should not pad double-digit step numbers", () => {
    const card: Card = { rank: "10", suit: "diamonds" };
    expect(formatCardPlayEntry(10, "north", card)).toBe(
      "10 | [NORTH] ACTION: PLAYED 10♦"
    );
    expect(formatCardPlayEntry(23, "south", card)).toBe(
      "23 | [SOUTH] ACTION: PLAYED 10♦"
    );
    expect(formatCardPlayEntry(99, "east", card)).toBe(
      "99 | [EAST] ACTION: PLAYED 10♦"
    );
  });

  it("should format all positions correctly", () => {
    const card: Card = { rank: "king", suit: "spades" };
    const positions: Position[] = ["north", "east", "south", "west"];

    positions.forEach((position) => {
      const entry = formatCardPlayEntry(1, position, card);
      expect(entry).toContain(`[${position.toUpperCase()}]`);
      expect(entry).toContain("ACTION: PLAYED");
    });
  });

  it("should format all suits correctly", () => {
    const suits = [
      { suit: "hearts" as const, symbol: "♥" },
      { suit: "diamonds" as const, symbol: "♦" },
      { suit: "clubs" as const, symbol: "♣" },
      { suit: "spades" as const, symbol: "♠" },
    ];

    suits.forEach(({ suit, symbol }) => {
      const card: Card = { rank: "ace", suit };
      const entry = formatCardPlayEntry(1, "north", card);
      expect(entry).toBe(`01 | [NORTH] ACTION: PLAYED ace${symbol}`);
    });
  });

  it("should format all ranks correctly", () => {
    const ranks = ["9", "10", "jack", "queen", "king", "ace"] as const;

    ranks.forEach((rank) => {
      const card: Card = { rank, suit: "hearts" };
      const entry = formatCardPlayEntry(1, "north", card);
      expect(entry).toBe(`01 | [NORTH] ACTION: PLAYED ${rank}♥`);
    });
  });

  it("should format complete game sequence", () => {
    const plays = [
      { step: 1, player: "north" as Position, card: { rank: "9" as const, suit: "hearts" as const } },
      { step: 2, player: "east" as Position, card: { rank: "10" as const, suit: "hearts" as const } },
      { step: 3, player: "south" as Position, card: { rank: "jack" as const, suit: "hearts" as const } },
      { step: 4, player: "west" as Position, card: { rank: "queen" as const, suit: "hearts" as const } },
    ];

    const entries = plays.map((p) => formatCardPlayEntry(p.step, p.player, p.card));

    expect(entries).toEqual([
      "01 | [NORTH] ACTION: PLAYED 9♥",
      "02 | [EAST] ACTION: PLAYED 10♥",
      "03 | [SOUTH] ACTION: PLAYED jack♥",
      "04 | [WEST] ACTION: PLAYED queen♥",
    ]);
  });
});

describe("formatTrumpBidEntry", () => {
  it("should format order up action", () => {
    const entry = formatTrumpBidEntry(1, "north", "order_up");
    expect(entry).toBe("01 | [NORTH] ACTION: ORDER_UP");
  });

  it("should format pass action", () => {
    const entry = formatTrumpBidEntry(2, "east", "pass");
    expect(entry).toBe("02 | [EAST] ACTION: PASS");
  });

  it("should format call trump action", () => {
    const entry = formatTrumpBidEntry(3, "south", "call_trump");
    expect(entry).toBe("03 | [SOUTH] ACTION: CALL_TRUMP");
  });

  it("should uppercase actions", () => {
    expect(formatTrumpBidEntry(1, "north", "order_up")).toContain("ORDER_UP");
    expect(formatTrumpBidEntry(1, "north", "pass")).toContain("PASS");
    expect(formatTrumpBidEntry(1, "north", "call_trump")).toContain("CALL_TRUMP");
  });

  it("should format all positions", () => {
    const positions: Position[] = ["north", "east", "south", "west"];

    positions.forEach((position) => {
      const entry = formatTrumpBidEntry(1, position, "pass");
      expect(entry).toContain(`[${position.toUpperCase()}]`);
    });
  });

  it("should pad step numbers correctly", () => {
    expect(formatTrumpBidEntry(1, "north", "pass")).toMatch(/^01 \|/);
    expect(formatTrumpBidEntry(9, "north", "pass")).toMatch(/^09 \|/);
    expect(formatTrumpBidEntry(10, "north", "pass")).toMatch(/^10 \|/);
  });

  it("should format bidding sequence", () => {
    const bids = [
      { step: 1, player: "north" as Position, action: "pass" },
      { step: 2, player: "east" as Position, action: "pass" },
      { step: 3, player: "south" as Position, action: "order_up" },
      { step: 4, player: "west" as Position, action: "call_trump" },
    ];

    const entries = bids.map((b) => formatTrumpBidEntry(b.step, b.player, b.action));

    expect(entries).toEqual([
      "01 | [NORTH] ACTION: PASS",
      "02 | [EAST] ACTION: PASS",
      "03 | [SOUTH] ACTION: ORDER_UP",
      "04 | [WEST] ACTION: CALL_TRUMP",
    ]);
  });

  it("should format going alone indicator", () => {
    const entry = formatTrumpBidEntry(1, "east", "order_up", true);
    expect(entry).toBe("01 | [EAST] ACTION: ORDER_UP (GOING ALONE)");
  });

  it("should not show going alone when false", () => {
    const entry = formatTrumpBidEntry(1, "east", "order_up", false);
    expect(entry).toBe("01 | [EAST] ACTION: ORDER_UP");
    expect(entry).not.toContain("GOING ALONE");
  });

  it("should not show going alone when undefined", () => {
    const entry = formatTrumpBidEntry(1, "east", "order_up");
    expect(entry).toBe("01 | [EAST] ACTION: ORDER_UP");
    expect(entry).not.toContain("GOING ALONE");
  });

  it("should format call_trump with going alone", () => {
    const entry = formatTrumpBidEntry(5, "south", "call_trump", true);
    expect(entry).toBe("05 | [SOUTH] ACTION: CALL_TRUMP (GOING ALONE)");
  });
});

describe("formatIllegalAttemptEntry", () => {
  it("should format illegal attempt with retry message", () => {
    const card: Card = { rank: "king", suit: "spades" };
    const entry = formatIllegalAttemptEntry(1, "west", card, false);

    expect(entry).toContain("01 |");
    expect(entry).toContain("[WEST]");
    expect(entry).toContain("⚠️ RETRY");
    expect(entry).toContain("king♠");
    expect(entry).toContain("(illegal), retrying...");
  });

  it("should format illegal attempt with fallback message", () => {
    const card: Card = { rank: "king", suit: "spades" };
    const entry = formatIllegalAttemptEntry(1, "west", card, true);

    expect(entry).toContain("01 |");
    expect(entry).toContain("[WEST]");
    expect(entry).toContain("⚠️ ILLEGAL");
    expect(entry).toContain("king♠");
    expect(entry).toContain("retry failed");
    expect(entry).toContain("using fallback");
  });

  it("should distinguish between retry and fallback", () => {
    const card: Card = { rank: "ace", suit: "hearts" };
    const retryEntry = formatIllegalAttemptEntry(1, "north", card, false);
    const fallbackEntry = formatIllegalAttemptEntry(2, "south", card, true);

    expect(retryEntry).toContain("⚠️ RETRY");
    expect(retryEntry).not.toContain("fallback");

    expect(fallbackEntry).toContain("⚠️ ILLEGAL");
    expect(fallbackEntry).toContain("fallback");
  });

  it("should format all suits in illegal attempts", () => {
    const suits = [
      { suit: "hearts" as const, symbol: "♥" },
      { suit: "diamonds" as const, symbol: "♦" },
      { suit: "clubs" as const, symbol: "♣" },
      { suit: "spades" as const, symbol: "♠" },
    ];

    suits.forEach(({ suit, symbol }) => {
      const card: Card = { rank: "9", suit };
      const entry = formatIllegalAttemptEntry(1, "north", card, false);
      expect(entry).toContain(`9${symbol}`);
    });
  });

  it("should format all positions in illegal attempts", () => {
    const positions: Position[] = ["north", "east", "south", "west"];
    const card: Card = { rank: "10", suit: "diamonds" };

    positions.forEach((position) => {
      const entry = formatIllegalAttemptEntry(1, position, card, false);
      expect(entry).toContain(`[${position.toUpperCase()}]`);
    });
  });

  it("should pad step numbers", () => {
    const card: Card = { rank: "jack", suit: "clubs" };

    expect(formatIllegalAttemptEntry(1, "north", card, false)).toMatch(/^01 \|/);
    expect(formatIllegalAttemptEntry(9, "north", card, false)).toMatch(/^09 \|/);
    expect(formatIllegalAttemptEntry(10, "north", card, false)).toMatch(/^10 \|/);
  });

  it("should format illegal attempt scenario", () => {
    const card: Card = { rank: "ace", suit: "clubs" };
    
    // First attempt - illegal, will retry
    const attemptEntry = formatIllegalAttemptEntry(5, "east", card, false);
    expect(attemptEntry).toBe("05 | [EAST] ⚠️ RETRY → Chose ace♣ (illegal), retrying...");
    
    // Retry also failed - fallback
    const fallbackEntry = formatIllegalAttemptEntry(6, "east", card, true);
    expect(fallbackEntry).toBe("06 | [EAST] ⚠️ ILLEGAL → Chose ace♣, retry failed, using fallback");
  });
});

describe("formatRoundSummaryEntry", () => {
  it("should return summary as-is", () => {
    const summary = "Team 0 (North/South) wins trick 1 (winner: north). Score: 0-0";
    expect(formatRoundSummaryEntry(summary)).toBe(summary);
  });

  it("should handle various summary formats", () => {
    const summaries = [
      "Round complete",
      "Team 1 wins!",
      "Score: 5-3",
      "Trump is hearts",
    ];

    summaries.forEach((summary) => {
      expect(formatRoundSummaryEntry(summary)).toBe(summary);
    });
  });

  it("should preserve formatting", () => {
    const summary = "  Padded summary  ";
    expect(formatRoundSummaryEntry(summary)).toBe(summary);
  });

  it("should handle empty string", () => {
    expect(formatRoundSummaryEntry("")).toBe("");
  });

  it("should handle multiline summaries", () => {
    const summary = "Line 1\nLine 2\nLine 3";
    expect(formatRoundSummaryEntry(summary)).toBe(summary);
  });
});

describe("formatErrorEntry", () => {
  it("should prefix error with ERROR:", () => {
    const error = "Game state is invalid";
    expect(formatErrorEntry(error)).toBe("ERROR: Game state is invalid");
  });

  it("should format various error messages", () => {
    const errors = [
      "Network timeout",
      "Invalid card played",
      "Player not found",
      "AI model failed",
    ];

    errors.forEach((error) => {
      const entry = formatErrorEntry(error);
      expect(entry).toBe(`ERROR: ${error}`);
      expect(entry).toMatch(/^ERROR: /);
    });
  });

  it("should handle empty error message", () => {
    expect(formatErrorEntry("")).toBe("ERROR: ");
  });

  it("should preserve error details", () => {
    const error = "Failed to fetch: 404 Not Found";
    expect(formatErrorEntry(error)).toBe("ERROR: Failed to fetch: 404 Not Found");
  });

  it("should format technical errors", () => {
    const error = "TypeError: Cannot read property 'suit' of undefined";
    const entry = formatErrorEntry(error);
    expect(entry).toContain("ERROR:");
    expect(entry).toContain("TypeError");
  });
});

describe("activity log integration", () => {
  it("should format a complete game activity log", () => {
    const log = [
      formatCardPlayEntry(1, "north", { rank: "9", suit: "hearts" }),
      formatCardPlayEntry(2, "east", { rank: "10", suit: "hearts" }),
      formatIllegalAttemptEntry(3, "south", { rank: "ace", suit: "clubs" }, false),
      formatCardPlayEntry(4, "south", { rank: "jack", suit: "hearts" }),
      formatCardPlayEntry(5, "west", { rank: "queen", suit: "hearts" }),
      formatRoundSummaryEntry("Team 0 (North/South) wins trick 1 (winner: south). Score: 0-0"),
    ];

    expect(log).toEqual([
      "01 | [NORTH] ACTION: PLAYED 9♥",
      "02 | [EAST] ACTION: PLAYED 10♥",
      "03 | [SOUTH] ⚠️ RETRY → Chose ace♣ (illegal), retrying...",
      "04 | [SOUTH] ACTION: PLAYED jack♥",
      "05 | [WEST] ACTION: PLAYED queen♥",
      "Team 0 (North/South) wins trick 1 (winner: south). Score: 0-0",
    ]);
  });

  it("should format trump selection followed by play", () => {
    const log = [
      formatTrumpBidEntry(1, "north", "pass"),
      formatTrumpBidEntry(2, "east", "pass"),
      formatTrumpBidEntry(3, "south", "order_up"),
      formatRoundSummaryEntry("Trump set to hearts by south"),
      formatCardPlayEntry(4, "east", { rank: "9", suit: "hearts" }),
      formatCardPlayEntry(5, "south", { rank: "10", suit: "hearts" }),
    ];

    expect(log.length).toBe(6);
    expect(log[0]).toContain("PASS");
    expect(log[2]).toContain("ORDER_UP");
    expect(log[4]).toContain("PLAYED");
  });

  it("should format error recovery scenario", () => {
    const log = [
      formatCardPlayEntry(1, "north", { rank: "9", suit: "hearts" }),
      formatErrorEntry("Network timeout"),
      formatRoundSummaryEntry("Game resumed"),
      formatCardPlayEntry(2, "east", { rank: "10", suit: "hearts" }),
    ];

    expect(log[0]).toContain("PLAYED");
    expect(log[1]).toContain("ERROR:");
    expect(log[2]).toContain("resumed");
    expect(log[3]).toContain("PLAYED");
  });

  it("should maintain consistent formatting throughout", () => {
    const entries = [
      formatCardPlayEntry(1, "north", { rank: "ace", suit: "hearts" }),
      formatTrumpBidEntry(2, "east", "pass"),
      formatIllegalAttemptEntry(3, "south", { rank: "king", suit: "spades" }, true),
      formatErrorEntry("Test error"),
      formatRoundSummaryEntry("Test summary"),
    ];

    // All step-based entries should have consistent format
    expect(entries[0]).toMatch(/^\d{2} \| \[.*\]/);
    expect(entries[1]).toMatch(/^\d{2} \| \[.*\]/);
    expect(entries[2]).toMatch(/^\d{2} \| \[.*\]/);

    // Error should have ERROR: prefix
    expect(entries[3]).toMatch(/^ERROR:/);

    // Summary is passed through
    expect(entries[4]).toBe("Test summary");
  });
});
