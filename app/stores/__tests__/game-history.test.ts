import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useGameStore } from "../game";
import type { Card, Position } from "../../../lib/game/types";

/** Assert value is defined and return it with narrowed type */
function assertDefined<T>(value: T | undefined | null, message?: string): T {
  expect(value, message).toBeDefined();
  return value as T;
}

/** Get array element with assertion */
function at<T>(arr: T[], index: number): T {
  return assertDefined(arr[index], `Expected element at index ${index}`);
}

describe("game store - recordPlay", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createPlay = (player: Position, card: Card) => ({
    player,
    card,
    modelId: "test-model",
    reasoning: "test reasoning",
    duration: 100,
  });

  describe("normal game (4 players)", () => {
    it("should create a new trick after 4 plays", () => {
      const store = useGameStore();

      // Start a hand (not going alone)
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      // Play 4 cards for trick 1
      store.recordPlay(createPlay("north", { suit: "hearts", rank: "ace" }));
      store.recordPlay(createPlay("east", { suit: "hearts", rank: "king" }));
      store.recordPlay(createPlay("south", { suit: "hearts", rank: "queen" }));
      store.recordPlay(createPlay("west", { suit: "hearts", rank: "jack" }));

      const hand = assertDefined(store.getCurrentHand());
      expect(hand.tricks.length).toBe(1);
      expect(at(hand.tricks, 0).plays.length).toBe(4);

      // Play first card of trick 2
      store.recordPlay(createPlay("north", { suit: "clubs", rank: "ace" }));

      expect(hand.tricks.length).toBe(2);
      expect(at(hand.tricks, 1).plays.length).toBe(1);
    });

    it("should group plays correctly across multiple tricks", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      // Play 8 cards (2 complete tricks)
      const trick1Cards: Card[] = [
        { suit: "hearts", rank: "ace" },
        { suit: "hearts", rank: "king" },
        { suit: "hearts", rank: "queen" },
        { suit: "hearts", rank: "jack" },
      ];
      const trick2Cards: Card[] = [
        { suit: "clubs", rank: "ace" },
        { suit: "clubs", rank: "king" },
        { suit: "clubs", rank: "queen" },
        { suit: "clubs", rank: "jack" },
      ];

      const players: Position[] = ["north", "east", "south", "west"];

      trick1Cards.forEach((card, i) => {
        store.recordPlay(createPlay(at(players, i), card));
      });
      trick2Cards.forEach((card, i) => {
        store.recordPlay(createPlay(at(players, i), card));
      });

      const hand = assertDefined(store.getCurrentHand());
      expect(hand.tricks.length).toBe(2);
      expect(at(hand.tricks, 0).plays.length).toBe(4);
      expect(at(hand.tricks, 1).plays.length).toBe(4);
      expect(at(hand.tricks, 0).trickNumber).toBe(1);
      expect(at(hand.tricks, 1).trickNumber).toBe(2);
    });
  });

  describe("going alone (3 players)", () => {
    it("should create a new trick after 3 plays when going alone", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      // Simulate trump decision with going alone
      store.recordTrumpDecision({
        player: "north",
        modelId: "test-model",
        action: "order_up",
        suit: "hearts",
        goingAlone: true,
        reasoning: "test",
        duration: 100,
      });

      const hand = assertDefined(store.getCurrentHand());
      expect(hand.goingAlone).toBe("north");

      // Play 3 cards for trick 1 (partner south sits out)
      store.recordPlay(createPlay("north", { suit: "hearts", rank: "ace" }));
      store.recordPlay(createPlay("east", { suit: "hearts", rank: "king" }));
      store.recordPlay(createPlay("west", { suit: "hearts", rank: "queen" }));

      expect(hand.tricks.length).toBe(1);
      expect(at(hand.tricks, 0).plays.length).toBe(3);

      // Play first card of trick 2
      store.recordPlay(createPlay("north", { suit: "clubs", rank: "ace" }));

      expect(hand.tricks.length).toBe(2);
      expect(at(hand.tricks, 0).plays.length).toBe(3);
      expect(at(hand.tricks, 1).plays.length).toBe(1);
    });

    it("should correctly group 5 tricks with 3 plays each when going alone", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "east", { suit: "diamonds", rank: "9" });

      // East goes alone
      store.recordTrumpDecision({
        player: "east",
        modelId: "test-model",
        action: "order_up",
        suit: "diamonds",
        goingAlone: true,
        reasoning: "test",
        duration: 100,
      });

      const hand = assertDefined(store.getCurrentHand());

      // Play 15 unique cards total (5 tricks * 3 plays each)
      const players: Position[] = ["east", "south", "north"]; // West sits out
      const allCards: Card[] = [
        // Trick 1
        { suit: "diamonds", rank: "ace" },
        { suit: "diamonds", rank: "king" },
        { suit: "diamonds", rank: "queen" },
        // Trick 2
        { suit: "hearts", rank: "ace" },
        { suit: "hearts", rank: "king" },
        { suit: "hearts", rank: "queen" },
        // Trick 3
        { suit: "clubs", rank: "ace" },
        { suit: "clubs", rank: "king" },
        { suit: "clubs", rank: "queen" },
        // Trick 4
        { suit: "spades", rank: "ace" },
        { suit: "spades", rank: "king" },
        { suit: "spades", rank: "queen" },
        // Trick 5
        { suit: "diamonds", rank: "jack" },
        { suit: "hearts", rank: "jack" },
        { suit: "clubs", rank: "jack" },
      ];

      allCards.forEach((card, i) => {
        store.recordPlay(createPlay(at(players, i % 3), card));
      });

      expect(hand.tricks.length).toBe(5);
      hand.tricks.forEach((trick, i) => {
        expect(trick.plays.length).toBe(3);
        expect(trick.trickNumber).toBe(i + 1);
      });
    });

    it("should NOT create new trick after 4 plays when going alone (regression test)", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      // North goes alone
      store.recordTrumpDecision({
        player: "north",
        modelId: "test-model",
        action: "order_up",
        suit: "hearts",
        goingAlone: true,
        reasoning: "test",
        duration: 100,
      });

      // Play 6 cards (should be 2 tricks of 3, not 1 trick of 4 + 1 trick of 2)
      store.recordPlay(createPlay("north", { suit: "hearts", rank: "ace" }));
      store.recordPlay(createPlay("east", { suit: "hearts", rank: "king" }));
      store.recordPlay(createPlay("west", { suit: "hearts", rank: "queen" }));
      // Trick 1 should be complete here
      store.recordPlay(createPlay("north", { suit: "clubs", rank: "ace" }));
      store.recordPlay(createPlay("east", { suit: "clubs", rank: "king" }));
      store.recordPlay(createPlay("west", { suit: "clubs", rank: "queen" }));

      const hand = assertDefined(store.getCurrentHand());
      expect(hand.tricks.length).toBe(2);
      expect(at(hand.tricks, 0).plays.length).toBe(3);
      expect(at(hand.tricks, 1).plays.length).toBe(3);

      // Verify no play appears in wrong trick
      const trick1Players = at(hand.tricks, 0).plays.map((p) => p.player);
      const trick2Players = at(hand.tricks, 1).plays.map((p) => p.player);
      expect(trick1Players).toEqual(["north", "east", "west"]);
      expect(trick2Players).toEqual(["north", "east", "west"]);
    });
  });

  describe("duplicate prevention", () => {
    it("should prevent duplicate cards in the same hand", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      const card: Card = { suit: "hearts", rank: "ace" };

      store.recordPlay(createPlay("north", card));
      store.recordPlay(createPlay("east", card)); // Same card, should be ignored

      const hand = assertDefined(store.getCurrentHand());
      expect(at(hand.tricks, 0).plays.length).toBe(1);
    });
  });

  describe("rollback", () => {
    it("should rollback pending plays on error", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      // Record some plays
      store.recordPlay(createPlay("north", { suit: "hearts", rank: "ace" }));
      store.recordPlay(createPlay("east", { suit: "hearts", rank: "king" }));

      // Verify plays are pending
      expect(store.pendingPlayKeys.size).toBe(2);

      // Rollback
      store.rollbackPendingPlays();

      // Plays should be removed
      const hand = store.getCurrentHand();
      expect(hand?.tricks.length).toBe(0);
      expect(store.pendingPlayKeys.size).toBe(0);
    });

    it("should commit pending plays on success", () => {
      const store = useGameStore();
      store.startNewHandRecord(1, "north", { suit: "hearts", rank: "9" });

      store.recordPlay(createPlay("north", { suit: "hearts", rank: "ace" }));
      store.recordPlay(createPlay("east", { suit: "hearts", rank: "king" }));

      // Commit
      store.commitPendingPlays();

      // Pending keys cleared but plays remain
      expect(store.pendingPlayKeys.size).toBe(0);
      const hand = assertDefined(store.getCurrentHand());
      expect(at(hand.tricks, 0).plays.length).toBe(2);
    });
  });
});
