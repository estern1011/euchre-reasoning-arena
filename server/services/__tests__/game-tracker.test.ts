import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewGame } from "../../../lib/game/game";
import type { GameState, Position, Card } from "../../../lib/game/types";

// Mock the logger module
vi.mock("../../db/logger", () => ({
  createGame: vi.fn(() => 1),
  completeGame: vi.fn(),
  createHand: vi.fn(() => 1),
  updateHand: vi.fn(),
  logDecision: vi.fn(() => 1),
  updateDecisionOutcome: vi.fn(),
  logToolExecution: vi.fn(() => 1),
  calculateCalibrationStats: vi.fn(() => []),
  saveCalibrationAnalysis: vi.fn(),
  isDbAvailable: vi.fn(() => true),
}));

import {
  initializeGameTracking,
  ensureTracking,
  logTrumpBidDecision,
  logDiscardDecision,
  logCardPlayDecision,
  updateTrickOutcomes,
  updateTrumpBidOutcomes,
  startNewHand,
  completeHandTracking,
  completeGameTracking,
  needsTracking,
  getGameId,
  getHandId,
  type TrackedGameState,
} from "../game-tracker";

import {
  createGame,
  createHand,
  logDecision,
  updateDecisionOutcome,
  updateHand,
  isDbAvailable,
} from "../../db/logger";

const modelIds: [string, string, string, string] = ["m1", "m2", "m3", "m4"];

describe("game-tracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initializeGameTracking", () => {
    it("creates game and hand records in database", () => {
      const game = createNewGame(modelIds);
      const tracked = initializeGameTracking(game, "test-preset");

      expect(createGame).toHaveBeenCalledWith(
        expect.objectContaining({
          northModel: "m1",
          eastModel: "m2",
          southModel: "m3",
          westModel: "m4",
          winningScore: 10,
          presetName: "test-preset",
        })
      );
      expect(createHand).toHaveBeenCalled();
      expect(tracked._dbGameId).toBe(1);
      expect(tracked._dbHandId).toBe(1);
      expect(tracked._presetName).toBe("test-preset");
    });

    it("returns unmodified game when DB unavailable", () => {
      vi.mocked(isDbAvailable).mockReturnValueOnce(false);
      const game = createNewGame(modelIds);
      const tracked = initializeGameTracking(game);

      expect(createGame).not.toHaveBeenCalled();
      expect(tracked._dbGameId).toBeUndefined();
    });
  });

  describe("ensureTracking", () => {
    it("initializes tracking if not already tracked", () => {
      const game = createNewGame(modelIds);
      const tracked = ensureTracking(game);

      expect(createGame).toHaveBeenCalled();
      expect(tracked._dbGameId).toBe(1);
    });

    it("returns existing tracked game without re-initializing", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbGameId = 42;

      const tracked = ensureTracking(game);

      expect(createGame).not.toHaveBeenCalled();
      expect(tracked._dbGameId).toBe(42);
    });
  });

  describe("logTrumpBidDecision", () => {
    it("logs trump bid to database", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;
      game._dbDecisionIds = {};

      const decisionId = logTrumpBidDecision(game, "north", "m1", {
        action: "order_up",
        suit: "hearts",
        goingAlone: false,
        reasoning: "Strong hand",
        confidence: 85,
        duration: 1000,
      });

      expect(logDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          handId: 1,
          decisionType: "trump_bid",
          agentPosition: "north",
          modelId: "m1",
          action: "order_up:hearts",
          reasoning: "Strong hand",
          confidence: 85,
        })
      );
      expect(decisionId).toBe(1);
      expect(game._dbDecisionIds["trump_bid_north_1"]).toBe(1);
    });

    it("returns null when DB unavailable", () => {
      vi.mocked(isDbAvailable).mockReturnValueOnce(false);
      const game = createNewGame(modelIds) as TrackedGameState;

      const decisionId = logTrumpBidDecision(game, "north", "m1", {
        action: "pass",
        reasoning: "Weak hand",
        confidence: 30,
      });

      expect(logDecision).not.toHaveBeenCalled();
      expect(decisionId).toBeNull();
    });
  });

  describe("logDiscardDecision", () => {
    it("logs discard to database and updates hand", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;

      const card: Card = { suit: "hearts", rank: "9" };
      logDiscardDecision(game, "south", "m3", {
        card,
        reasoning: "Weakest card",
        confidence: 75,
        duration: 500,
      });

      expect(logDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          decisionType: "discard",
          action: "9hearts",
        })
      );
      expect(updateHand).toHaveBeenCalledWith(1, {
        dealerDiscardCard: "9hearts",
      });
    });
  });

  describe("logCardPlayDecision", () => {
    it("logs card play with trick number", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;
      game._dbDecisionIds = {};
      game.completedTricks = []; // No completed tricks yet, so trick 1

      const card: Card = { suit: "spades", rank: "ace" };
      logCardPlayDecision(game, "east", "m2", {
        card,
        reasoning: "Lead with trump",
        confidence: 90,
        duration: 800,
      });

      expect(logDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          decisionType: "card_play",
          action: "acespades",
          trickNumber: 1,
        })
      );
    });

    it("marks illegal plays as not legal", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;
      game._dbDecisionIds = {};
      game.completedTricks = [];

      const card: Card = { suit: "hearts", rank: "10" };
      logCardPlayDecision(game, "west", "m4", {
        card,
        reasoning: "Fallback play",
        confidence: 50,
        isFallback: true,
        illegalAttempt: { card: { suit: "clubs", rank: "jack" } },
      });

      expect(logDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          wasLegal: false,
        })
      );
    });
  });

  describe("updateTrickOutcomes", () => {
    it("marks winning team decisions as successful", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbDecisionIds = {
        "card_play_north_1_1": 10,
        "card_play_east_1_1": 11,
        "card_play_south_1_1": 12,
        "card_play_west_1_1": 13,
      };

      updateTrickOutcomes(game, "north", 1);

      // North/South team won (team 1), so their decisions are successful
      expect(updateDecisionOutcome).toHaveBeenCalledWith(10, true); // north
      expect(updateDecisionOutcome).toHaveBeenCalledWith(12, true); // south
      expect(updateDecisionOutcome).toHaveBeenCalledWith(11, false); // east
      expect(updateDecisionOutcome).toHaveBeenCalledWith(13, false); // west
    });
  });

  describe("updateTrumpBidOutcomes", () => {
    it("marks trump maker bid as successful", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;
      game._dbDecisionIds = {
        "trump_bid_north_1": 20,
        "trump_bid_east_1": 21,
      };
      game.trump = "hearts";
      game.trumpCaller = "east";

      updateTrumpBidOutcomes(game, "east");

      expect(updateDecisionOutcome).toHaveBeenCalledWith(21, true); // maker
      expect(updateDecisionOutcome).toHaveBeenCalledWith(20, true); // passer (correct assessment)
      expect(updateHand).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          trumpSuit: "hearts",
          trumpMakerPosition: 1, // east = index 1
        })
      );
    });
  });

  describe("startNewHand", () => {
    it("creates new hand record and resets decision tracking", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbGameId = 1;
      game._dbHandId = 1;
      game._dbDecisionIds = { "some_old_decision": 99 };
      game.handNumber = 2;

      const updated = startNewHand(game);

      expect(createHand).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 1,
          handNumber: 2,
        })
      );
      expect(updated._dbHandId).toBe(1);
      expect(updated._dbDecisionIds).toEqual({}); // Reset
    });
  });

  describe("completeHandTracking", () => {
    it("updates hand with final scores and euchre status", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;
      game.trumpCaller = "north"; // Team 1 (NS) called

      completeHandTracking(game, 3, 2, 1, 0);

      expect(updateHand).toHaveBeenCalledWith(1, {
        team1Tricks: 3,
        team2Tricks: 2,
        team1Points: 1,
        team2Points: 0,
        euchred: false, // Made 3+ tricks
      });
    });

    it("marks hand as euchred when maker gets < 3 tricks", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 1;
      game.trumpCaller = "north"; // Team 1 called

      completeHandTracking(game, 2, 3, 0, 2); // Team 1 only got 2 tricks

      expect(updateHand).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          euchred: true,
        })
      );
    });
  });

  describe("helper functions", () => {
    it("needsTracking returns true for untracked game", () => {
      const game = createNewGame(modelIds);
      expect(needsTracking(game)).toBe(true);
    });

    it("needsTracking returns false for tracked game", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbGameId = 1;
      expect(needsTracking(game)).toBe(false);
    });

    it("getGameId returns null for untracked game", () => {
      const game = createNewGame(modelIds);
      expect(getGameId(game)).toBeNull();
    });

    it("getGameId returns ID for tracked game", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbGameId = 42;
      expect(getGameId(game)).toBe(42);
    });

    it("getHandId returns null for untracked game", () => {
      const game = createNewGame(modelIds);
      expect(getHandId(game)).toBeNull();
    });

    it("getHandId returns ID for tracked game", () => {
      const game = createNewGame(modelIds) as TrackedGameState;
      game._dbHandId = 99;
      expect(getHandId(game)).toBe(99);
    });
  });
});
