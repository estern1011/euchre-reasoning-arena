import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCardDisplay } from "../useCardDisplay";
import { useGameState } from "../useGameState";
import type { GameState, Card } from "~/types/game";

const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
  id: "test-game",
  phase: "playing",
  players: [
    {
      position: "north",
      team: 0,
      hand: [
        { rank: "9", suit: "hearts" },
        { rank: "10", suit: "hearts" },
      ],
      modelId: "m1",
    },
    {
      position: "east",
      team: 1,
      hand: [
        { rank: "jack", suit: "hearts" },
        { rank: "queen", suit: "hearts" },
      ],
      modelId: "m2",
    },
    {
      position: "south",
      team: 0,
      hand: [
        { rank: "king", suit: "hearts" },
        { rank: "ace", suit: "hearts" },
      ],
      modelId: "m3",
    },
    {
      position: "west",
      team: 1,
      hand: [
        { rank: "9", suit: "diamonds" },
        { rank: "10", suit: "diamonds" },
      ],
      modelId: "m4",
    },
  ],
  trump: "hearts",
  dealer: "north",
  trumpCaller: "south",
  kitty: [],
  currentTrick: { leadPlayer: "north", plays: [] },
  completedTricks: [],
  scores: [0, 0],
  ...overrides,
});

describe("useCardDisplay", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("playedCards", () => {
    it("should return all null cards when no plays yet", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState());

      const { playedCards } = useCardDisplay();

      expect(playedCards.value).toEqual({
        north: null,
        east: null,
        south: null,
        west: null,
        center: null,
      });
    });

    it("should return null cards when game state is null", () => {
      const { playedCards } = useCardDisplay();

      expect(playedCards.value).toEqual({
        north: null,
        east: null,
        south: null,
        west: null,
        center: null,
      });
    });

    it("should map single played card to position", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
          ],
        },
      }));

      const { playedCards } = useCardDisplay();

      expect(playedCards.value.north).toEqual({ rank: "9", suit: "hearts" });
      expect(playedCards.value.east).toBeNull();
      expect(playedCards.value.south).toBeNull();
      expect(playedCards.value.west).toBeNull();
      expect(playedCards.value.center).toEqual({ rank: "9", suit: "hearts" }); // Lead card
    });

    it("should map multiple played cards to positions", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
            { player: "south", card: { rank: "jack", suit: "hearts" } },
          ],
        },
      }));

      const { playedCards } = useCardDisplay();

      expect(playedCards.value.north).toEqual({ rank: "9", suit: "hearts" });
      expect(playedCards.value.east).toEqual({ rank: "10", suit: "hearts" });
      expect(playedCards.value.south).toEqual({ rank: "jack", suit: "hearts" });
      expect(playedCards.value.west).toBeNull();
      expect(playedCards.value.center).toEqual({ rank: "9", suit: "hearts" });
    });

    it("should update center card to lead card", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "east",
          plays: [
            { player: "east", card: { rank: "queen", suit: "diamonds" } },
          ],
        },
      }));

      const { playedCards } = useCardDisplay();

      expect(playedCards.value.center).toEqual({ rank: "queen", suit: "diamonds" });
    });
  });

  describe("leadCard", () => {
    it("should return null when no plays yet", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState());

      const { leadCard } = useCardDisplay();

      expect(leadCard.value).toBeNull();
    });

    it("should return null when game state is null", () => {
      const { leadCard } = useCardDisplay();

      expect(leadCard.value).toBeNull();
    });

    it("should return first played card", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "south",
          plays: [
            { player: "south", card: { rank: "ace", suit: "hearts" } },
            { player: "west", card: { rank: "9", suit: "hearts" } },
          ],
        },
      }));

      const { leadCard } = useCardDisplay();

      expect(leadCard.value).toEqual({ rank: "ace", suit: "hearts" });
    });
  });

  describe("leadPlayer", () => {
    it("should return null when game state is null", () => {
      const { clearGameState } = useGameState();
      clearGameState();
      const { leadPlayer } = useCardDisplay();

      expect(leadPlayer.value).toBeNull();
    });

    it("should return lead player from current trick", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: { leadPlayer: "west", plays: [] },
      }));

      const { leadPlayer } = useCardDisplay();

      expect(leadPlayer.value).toBe("west");
    });

    it("should return null when no current trick", () => {
      const { setGameState } = useGameState();
      const gameState = createMockGameState();
      gameState.currentTrick = undefined as any;
      setGameState(gameState);

      const { leadPlayer } = useCardDisplay();

      expect(leadPlayer.value).toBeNull();
    });
  });

  describe("hasPlayedCard", () => {
    it("should return false when no plays", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState());

      const { hasPlayedCard } = useCardDisplay();

      expect(hasPlayedCard("north")).toBe(false);
      expect(hasPlayedCard("east")).toBe(false);
    });

    it("should return false when game state is null", () => {
      const { hasPlayedCard } = useCardDisplay();

      expect(hasPlayedCard("north")).toBe(false);
    });

    it("should return true for players who have played", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
          ],
        },
      }));

      const { hasPlayedCard } = useCardDisplay();

      expect(hasPlayedCard("north")).toBe(true);
      expect(hasPlayedCard("east")).toBe(true);
      expect(hasPlayedCard("south")).toBe(false);
      expect(hasPlayedCard("west")).toBe(false);
    });
  });

  describe("getCardForPosition", () => {
    it("should return null when no plays", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState());

      const { getCardForPosition } = useCardDisplay();

      expect(getCardForPosition("north")).toBeNull();
    });

    it("should return null when game state is null", () => {
      const { getCardForPosition } = useCardDisplay();

      expect(getCardForPosition("north")).toBeNull();
    });

    it("should return card for position", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "queen", suit: "diamonds" } },
          ],
        },
      }));

      const { getCardForPosition } = useCardDisplay();

      expect(getCardForPosition("north")).toEqual({ rank: "9", suit: "hearts" });
      expect(getCardForPosition("east")).toEqual({ rank: "queen", suit: "diamonds" });
      expect(getCardForPosition("south")).toBeNull();
    });
  });

  describe("getPlayerHand", () => {
    it("should return empty array when game state is null", () => {
      const { clearGameState } = useGameState();
      clearGameState();
      const { getPlayerHand } = useCardDisplay();

      expect(getPlayerHand("north")).toEqual([]);
    });

    it("should return player's hand cards", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState());

      const { getPlayerHand } = useCardDisplay();

      expect(getPlayerHand("north")).toEqual([
        { rank: "9", suit: "hearts" },
        { rank: "10", suit: "hearts" },
      ]);
      expect(getPlayerHand("east")).toEqual([
        { rank: "jack", suit: "hearts" },
        { rank: "queen", suit: "hearts" },
      ]);
    });

    it("should return empty array for non-existent player", () => {
      const { setGameState } = useGameState();
      const gameState = createMockGameState();
      gameState.players = gameState.players.filter((p) => p.position !== "north");
      setGameState(gameState);

      const { getPlayerHand } = useCardDisplay();

      expect(getPlayerHand("north")).toEqual([]);
    });
  });

  describe("isTrickComplete", () => {
    it("should return false when no plays", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState());

      const { isTrickComplete } = useCardDisplay();

      expect(isTrickComplete.value).toBe(false);
    });

    it("should return false when game state is null", () => {
      const { isTrickComplete } = useCardDisplay();

      expect(isTrickComplete.value).toBe(false);
    });

    it("should return false with incomplete plays", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
          ],
        },
      }));

      const { isTrickComplete } = useCardDisplay();

      expect(isTrickComplete.value).toBe(false);
    });

    it("should return true when trick has 4 plays", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
            { player: "south", card: { rank: "jack", suit: "hearts" } },
            { player: "west", card: { rank: "queen", suit: "hearts" } },
          ],
        },
      }));

      const { isTrickComplete } = useCardDisplay();

      expect(isTrickComplete.value).toBe(true);
    });

    it("should return true when trick has 3 plays and going alone", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        goingAlone: "north",
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
            { player: "west", card: { rank: "queen", suit: "hearts" } },
          ],
        },
      }));

      const { isTrickComplete } = useCardDisplay();

      expect(isTrickComplete.value).toBe(true);
    });

    it("should return false when going alone with only 2 plays", () => {
      const { setGameState } = useGameState();
      setGameState(createMockGameState({
        goingAlone: "north",
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
          ],
        },
      }));

      const { isTrickComplete } = useCardDisplay();

      expect(isTrickComplete.value).toBe(false);
    });
  });
});
