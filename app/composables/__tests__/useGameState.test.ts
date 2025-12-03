import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useGameState } from "../useGameState";
import type { GameState } from "~/types/game";

const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
  id: "test-game-123",
  phase: "playing",
  players: [
    { position: "north", team: 0, hand: [], modelId: "m1" },
    { position: "east", team: 1, hand: [], modelId: "m2" },
    { position: "south", team: 0, hand: [], modelId: "m3" },
    { position: "west", team: 1, hand: [], modelId: "m4" },
  ],
  trump: "hearts",
  dealer: "north",
  trumpCaller: "south",
  kitty: [],
  currentTrick: { leadPlayer: "north", plays: [] },
  completedTricks: [],
  scores: [3, 5],
  ...overrides,
});

describe("useGameState", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const { clearGameState } = useGameState();
    clearGameState();
  });

  describe("gameState", () => {
    it("should start as null", () => {
      const { gameState } = useGameState();
      expect(gameState.value).toBeNull();
    });

    it("should return game state after setting", () => {
      const { gameState, setGameState } = useGameState();
      const mockState = createMockGameState();
      
      setGameState(mockState);
      
      expect(gameState.value).toEqual(mockState);
    });
  });

  describe("setGameState", () => {
    it("should set game state", () => {
      const { gameState, setGameState } = useGameState();
      const mockState = createMockGameState();
      
      setGameState(mockState);
      
      expect(gameState.value?.id).toBe("test-game-123");
      expect(gameState.value?.phase).toBe("playing");
      expect(gameState.value?.players.length).toBe(4);
    });

    it("should update existing game state", () => {
      const { gameState, setGameState } = useGameState();
      
      setGameState(createMockGameState({ phase: "trump_selection" }));
      expect(gameState.value?.phase).toBe("trump_selection");
      
      setGameState(createMockGameState({ phase: "playing" }));
      expect(gameState.value?.phase).toBe("playing");
    });
  });

  describe("modelIds", () => {
    it("should start as null", () => {
      const { modelIds } = useGameState();
      expect(modelIds.value).toBeNull();
    });

    it("should set model IDs", () => {
      const { modelIds, setModelIds } = useGameState();
      const ids: [string, string, string, string] = ["m1", "m2", "m3", "m4"];
      
      setModelIds(ids);
      
      expect(modelIds.value).toEqual(ids);
    });

    it("should update model IDs", () => {
      const { modelIds, setModelIds } = useGameState();
      
      setModelIds(["m1", "m2", "m3", "m4"]);
      expect(modelIds.value).toEqual(["m1", "m2", "m3", "m4"]);
      
      setModelIds(["a1", "a2", "a3", "a4"]);
      expect(modelIds.value).toEqual(["a1", "a2", "a3", "a4"]);
    });
  });

  describe("clearGameState", () => {
    it("should clear game state", () => {
      const { gameState, setGameState, clearGameState } = useGameState();
      
      setGameState(createMockGameState());
      expect(gameState.value).not.toBeNull();
      
      clearGameState();
      expect(gameState.value).toBeNull();
    });

    it("should clear model IDs", () => {
      const { modelIds, setModelIds, clearGameState } = useGameState();
      
      setModelIds(["m1", "m2", "m3", "m4"]);
      expect(modelIds.value).not.toBeNull();
      
      clearGameState();
      expect(modelIds.value).toBeNull();
    });

    it("should clear both game state and model IDs", () => {
      const { gameState, modelIds, setGameState, setModelIds, clearGameState } = useGameState();
      
      setGameState(createMockGameState());
      setModelIds(["m1", "m2", "m3", "m4"]);
      
      clearGameState();
      
      expect(gameState.value).toBeNull();
      expect(modelIds.value).toBeNull();
    });
  });

  describe("isInitialized", () => {
    it("should be false when game state is null", () => {
      const { isInitialized } = useGameState();
      expect(isInitialized.value).toBe(false);
    });

    it("should be true when game state is set", () => {
      const { isInitialized, setGameState } = useGameState();
      
      setGameState(createMockGameState());
      
      expect(isInitialized.value).toBe(true);
    });

    it("should be false after clearing", () => {
      const { isInitialized, setGameState, clearGameState } = useGameState();
      
      setGameState(createMockGameState());
      expect(isInitialized.value).toBe(true);
      
      clearGameState();
      expect(isInitialized.value).toBe(false);
    });
  });

  describe("isGameComplete", () => {
    it("should be false when phase is not complete", () => {
      const { isGameComplete, setGameState } = useGameState();
      
      setGameState(createMockGameState({ phase: "playing" }));
      
      expect(isGameComplete.value).toBe(false);
    });

    it("should be true when phase is complete", () => {
      const { isGameComplete, setGameState } = useGameState();
      
      setGameState(createMockGameState({ phase: "complete" }));
      
      expect(isGameComplete.value).toBe(true);
    });

    it("should be false during trump selection", () => {
      const { isGameComplete, setGameState } = useGameState();
      
      setGameState(createMockGameState({ phase: "trump_selection" }));
      
      expect(isGameComplete.value).toBe(false);
    });
  });

  describe("currentPhase", () => {
    it("should return null when game state is null", () => {
      const { currentPhase } = useGameState();
      expect(currentPhase.value).toBeNull();
    });

    it("should return current phase", () => {
      const { currentPhase, setGameState } = useGameState();
      
      setGameState(createMockGameState({ phase: "trump_selection" }));
      expect(currentPhase.value).toBe("trump_selection");
      
      setGameState(createMockGameState({ phase: "playing" }));
      expect(currentPhase.value).toBe("playing");
      
      setGameState(createMockGameState({ phase: "complete" }));
      expect(currentPhase.value).toBe("complete");
    });
  });

  describe("scores", () => {
    it("should return [0, 0] when game state is null", () => {
      const { scores } = useGameState();
      expect(scores.value).toEqual([0, 0]);
    });

    it("should return current scores", () => {
      const { scores, setGameState } = useGameState();
      
      setGameState(createMockGameState({ scores: [3, 5] }));
      
      expect(scores.value).toEqual([3, 5]);
    });

    it("should update when scores change", () => {
      const { scores, setGameState } = useGameState();
      
      setGameState(createMockGameState({ scores: [0, 0] }));
      expect(scores.value).toEqual([0, 0]);
      
      setGameState(createMockGameState({ scores: [2, 1] }));
      expect(scores.value).toEqual([2, 1]);
      
      setGameState(createMockGameState({ scores: [10, 8] }));
      expect(scores.value).toEqual([10, 8]);
    });
  });

  describe("trump", () => {
    it("should return null when game state is null", () => {
      const { trump } = useGameState();
      expect(trump.value).toBeNull();
    });

    it("should return current trump suit", () => {
      const { trump, setGameState } = useGameState();
      
      setGameState(createMockGameState({ trump: "hearts" }));
      expect(trump.value).toBe("hearts");
      
      setGameState(createMockGameState({ trump: "diamonds" }));
      expect(trump.value).toBe("diamonds");
      
      setGameState(createMockGameState({ trump: "clubs" }));
      expect(trump.value).toBe("clubs");
      
      setGameState(createMockGameState({ trump: "spades" }));
      expect(trump.value).toBe("spades");
    });

    it("should return null when trump not set", () => {
      const { trump, setGameState } = useGameState();
      
      setGameState(createMockGameState({ trump: null }));
      
      expect(trump.value).toBeNull();
    });
  });

  describe("validateGameState", () => {
    it("should validate correct game state", () => {
      const { validateGameState } = useGameState();
      const mockState = createMockGameState();
      
      expect(validateGameState(mockState)).toBe(true);
    });

    it("should reject null", () => {
      const { validateGameState } = useGameState();
      expect(validateGameState(null)).toBeFalsy();
    });

    it("should reject undefined", () => {
      const { validateGameState } = useGameState();
      expect(validateGameState(undefined)).toBeFalsy();
    });

    it("should reject object without id", () => {
      const { validateGameState } = useGameState();
      const invalid = { phase: "playing", players: [], scores: [0, 0] };
      
      expect(validateGameState(invalid)).toBe(false);
    });

    it("should reject object without phase", () => {
      const { validateGameState } = useGameState();
      const invalid = { id: "test", players: [], scores: [0, 0] };
      
      expect(validateGameState(invalid)).toBe(false);
    });

    it("should reject object without players array", () => {
      const { validateGameState } = useGameState();
      const invalid = { id: "test", phase: "playing", scores: [0, 0] };
      
      expect(validateGameState(invalid)).toBe(false);
    });

    it("should reject object with wrong number of players", () => {
      const { validateGameState } = useGameState();
      const invalid = {
        id: "test",
        phase: "playing",
        players: [{ position: "north", team: 0, hand: [], modelId: "m1" }],
        scores: [0, 0],
      };
      
      expect(validateGameState(invalid)).toBe(false);
    });

    it("should reject object without scores array", () => {
      const { validateGameState } = useGameState();
      const mockState = createMockGameState();
      const invalid = { ...mockState, scores: undefined };
      
      expect(validateGameState(invalid)).toBe(false);
    });

    it("should reject object with wrong scores length", () => {
      const { validateGameState } = useGameState();
      const mockState = createMockGameState();
      const invalid = { ...mockState, scores: [0, 0, 0] };
      
      expect(validateGameState(invalid)).toBe(false);
    });

    it("should validate all game phases", () => {
      const { validateGameState } = useGameState();
      
      expect(validateGameState(createMockGameState({ phase: "trump_selection" }))).toBe(true);
      expect(validateGameState(createMockGameState({ phase: "playing" }))).toBe(true);
      expect(validateGameState(createMockGameState({ phase: "complete" }))).toBe(true);
    });
  });

  describe("state persistence", () => {
    it("should persist state across multiple calls", () => {
      const { gameState: state1, setGameState } = useGameState();
      setGameState(createMockGameState());
      
      const { gameState: state2 } = useGameState();
      
      expect(state1.value).toEqual(state2.value);
    });

    it("should persist model IDs across multiple calls", () => {
      const { modelIds: ids1, setModelIds } = useGameState();
      setModelIds(["m1", "m2", "m3", "m4"]);
      
      const { modelIds: ids2 } = useGameState();
      
      expect(ids1.value).toEqual(ids2.value);
    });
  });
});
