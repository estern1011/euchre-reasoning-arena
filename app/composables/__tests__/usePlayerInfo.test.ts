import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePlayerInfo } from "../usePlayerInfo";
import { useGameStore } from "../../stores/game";
import type { GameState } from "../../../lib/game/types";

// Create mock game state
const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
  id: "test-game",
  phase: "playing",
  players: [
    { position: "north", team: 0, hand: [], modelId: "anthropic/claude-haiku-4.5" },
    { position: "east", team: 1, hand: [], modelId: "google/gemini-2.5-flash" },
    { position: "south", team: 0, hand: [], modelId: "openai/gpt-5-mini" },
    { position: "west", team: 1, hand: [], modelId: "xai/grok-4.1-fast-non-reasoning" },
  ],
  trump: "hearts",
  dealer: "north",
  trumpCaller: "south",
  kitty: [],
  currentTrick: { leadPlayer: "north", plays: [] },
  completedTricks: [],
  scores: [0, 0],
  ...overrides,
} as GameState);

describe("usePlayerInfo", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("getModelId", () => {
    it("should return empty string when game state is null", () => {
      const gameStore = useGameStore();
      gameStore.gameState = null;
      const { getModelId } = usePlayerInfo();
      expect(getModelId("north")).toBe("");
    });

    it("should return model ID for a position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState());

      const { getModelId } = usePlayerInfo();

      expect(getModelId("north")).toBe("anthropic/claude-haiku-4.5");
      expect(getModelId("east")).toBe("google/gemini-2.5-flash");
      expect(getModelId("south")).toBe("openai/gpt-5-mini");
      expect(getModelId("west")).toBe("xai/grok-4.1-fast-non-reasoning");
    });

    it("should return empty string for non-existent position", () => {
      const gameStore = useGameStore();
      const gameState = createMockGameState();
      gameState.players = gameState.players.filter((p) => p.position !== "north");
      gameStore.setGameState(gameState);

      const { getModelId } = usePlayerInfo();
      expect(getModelId("north")).toBe("");
    });
  });

  describe("getFormattedModelName", () => {
    it("should return empty string when game state is null", () => {
      const gameStore = useGameStore();
      gameStore.gameState = null;
      const { getFormattedModelName } = usePlayerInfo();
      expect(getFormattedModelName("north")).toBe("");
    });

    it("should format model names by removing provider prefix", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState());

      const { getFormattedModelName } = usePlayerInfo();

      expect(getFormattedModelName("north")).toBe("CLAUDE-HAIKU-4.5");
      expect(getFormattedModelName("east")).toBe("GEMINI-2.5-FLASH");
      expect(getFormattedModelName("south")).toBe("GPT-5-MINI");
      expect(getFormattedModelName("west")).toBe("GROK-4.1-FAST-NON-REASONING");
    });

    it("should uppercase model name without provider", () => {
      const gameStore = useGameStore();
      const gameState = createMockGameState();
      gameState.players[0]!.modelId = "simple-model";
      gameStore.setGameState(gameState);

      const { getFormattedModelName } = usePlayerInfo();
      expect(getFormattedModelName("north")).toBe("SIMPLE-MODEL");
    });
  });

  describe("getTeam", () => {
    it("should return null when game state is null", () => {
      const gameStore = useGameStore();
      gameStore.gameState = null;
      const { getTeam } = usePlayerInfo();
      expect(getTeam("north")).toBeNull();
    });

    it("should return team number for each position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState());

      const { getTeam } = usePlayerInfo();

      expect(getTeam("north")).toBe(0);
      expect(getTeam("east")).toBe(1);
      expect(getTeam("south")).toBe(0);
      expect(getTeam("west")).toBe(1);
    });
  });

  describe("currentPlayer", () => {
    it("should return null when game state is null", () => {
      const gameStore = useGameStore();
      gameStore.gameState = null;
      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBeNull();
    });

    it("should return current bidder during trump selection", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
        phase: "trump_selection",
        trumpSelection: {
          turnedUpCard: { rank: "9", suit: "hearts" },
          dealer: "north",
          currentBidder: "east",
          round: 1,
          bids: [],
        },
      }));

      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBe("east");
    });

    it("should return lead player when no plays yet", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
        currentTrick: { leadPlayer: "south", plays: [] },
      }));

      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBe("south");
    });

    it("should return next player in rotation", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
          ],
        },
      }));

      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBe("east");
    });

    it("should progress clockwise through players", () => {
      const gameStore = useGameStore();

      // North plays
      gameStore.setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
          ],
        },
      }));

      let { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBe("east");

      // East plays
      gameStore.setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
          ],
        },
      }));

      currentPlayer = usePlayerInfo().currentPlayer;
      expect(currentPlayer.value).toBe("south");

      // South plays
      gameStore.setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
            { player: "south", card: { rank: "jack", suit: "hearts" } },
          ],
        },
      }));

      currentPlayer = usePlayerInfo().currentPlayer;
      expect(currentPlayer.value).toBe("west");
    });

    it("should return null when trick is complete", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
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

      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBeNull();
    });

    it("should skip partner when going alone", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
        goingAlone: "north", // North going alone, south sits out
        currentTrick: {
          leadPlayer: "north",
          plays: [
            { player: "north", card: { rank: "9", suit: "hearts" } },
            { player: "east", card: { rank: "10", suit: "hearts" } },
          ],
        },
      }));

      const { currentPlayer } = usePlayerInfo();
      // Should skip south (north's partner) and go to west
      expect(currentPlayer.value).toBe("west");
    });

    it("should expect 3 plays when going alone", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
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

      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBeNull(); // 3 plays complete when going alone
    });

    it("should handle east as lead player", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
        currentTrick: {
          leadPlayer: "east",
          plays: [
            { player: "east", card: { rank: "9", suit: "hearts" } },
          ],
        },
      }));

      const { currentPlayer } = usePlayerInfo();
      expect(currentPlayer.value).toBe("south");
    });
  });

  describe("isCurrentPlayer", () => {
    it("should return true for current player", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
        currentTrick: { leadPlayer: "north", plays: [] },
      }));

      const { isCurrentPlayer } = usePlayerInfo();
      expect(isCurrentPlayer("north")).toBe(true);
      expect(isCurrentPlayer("east")).toBe(false);
      expect(isCurrentPlayer("south")).toBe(false);
      expect(isCurrentPlayer("west")).toBe(false);
    });

    it("should return false for all players when trick is complete", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({
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

      const { isCurrentPlayer } = usePlayerInfo();
      expect(isCurrentPlayer("north")).toBe(false);
      expect(isCurrentPlayer("east")).toBe(false);
      expect(isCurrentPlayer("south")).toBe(false);
      expect(isCurrentPlayer("west")).toBe(false);
    });
  });

  describe("modelsByPosition", () => {
    it("should return all model IDs mapped by position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState());

      const { modelsByPosition } = usePlayerInfo();

      expect(modelsByPosition.value).toEqual({
        north: "anthropic/claude-haiku-4.5",
        east: "google/gemini-2.5-flash",
        south: "openai/gpt-5-mini",
        west: "xai/grok-4.1-fast-non-reasoning",
      });
    });
  });

  describe("formattedModelsByPosition", () => {
    it("should return all formatted model names mapped by position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState());

      const { formattedModelsByPosition } = usePlayerInfo();

      expect(formattedModelsByPosition.value).toEqual({
        north: "CLAUDE-HAIKU-4.5",
        east: "GEMINI-2.5-FLASH",
        south: "GPT-5-MINI",
        west: "GROK-4.1-FAST-NON-REASONING",
      });
    });
  });

  describe("dealer", () => {
    it("should return null when game state is null", () => {
      const gameStore = useGameStore();
      gameStore.gameState = null;
      const { dealer } = usePlayerInfo();
      expect(dealer.value).toBeNull();
    });

    it("should return dealer position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({ dealer: "west" }));

      const { dealer } = usePlayerInfo();
      expect(dealer.value).toBe("west");
    });
  });

  describe("trumpCaller", () => {
    it("should return null when game state is null", () => {
      const gameStore = useGameStore();
      gameStore.gameState = null;
      const { trumpCaller } = usePlayerInfo();
      expect(trumpCaller.value).toBeNull();
    });

    it("should return trump caller position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({ trumpCaller: "east" }));

      const { trumpCaller } = usePlayerInfo();
      expect(trumpCaller.value).toBe("east");
    });
  });

  describe("goingAlone", () => {
    it("should return going alone position", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({ goingAlone: "south" }));

      const { goingAlone } = usePlayerInfo();
      expect(goingAlone.value).toBe("south");
    });

    it("should return null when no one is going alone", () => {
      const gameStore = useGameStore();
      gameStore.setGameState(createMockGameState({ goingAlone: undefined }));

      const { goingAlone } = usePlayerInfo();
      expect(goingAlone.value).toBeNull();
    });

    it("should return null when game state is null", () => {
      const { goingAlone } = usePlayerInfo();
      expect(goingAlone.value).toBeNull();
    });
  });
});
