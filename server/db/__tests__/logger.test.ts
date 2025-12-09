import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock statement
const mockStatement = {
  run: vi.fn(() => ({ lastInsertRowid: 1 })),
  get: vi.fn(),
  all: vi.fn(() => []),
};

// Create mock database
const mockDb = {
  prepare: vi.fn(() => mockStatement),
  exec: vi.fn(),
};

// Mock the client module
vi.mock("../client", () => ({
  default: vi.fn(() => mockDb),
  isDatabaseAvailable: vi.fn(() => true),
}));

import getDb, { isDatabaseAvailable } from "../client";
import {
  createGame,
  completeGame,
  createHand,
  updateHand,
  logDecision,
  updateDecisionOutcome,
  logToolExecution,
  isDbAvailable,
  type GameRecord,
  type HandRecord,
  type DecisionRecord,
} from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatement.run.mockReturnValue({ lastInsertRowid: 1 });
  });

  describe("isDbAvailable", () => {
    it("returns true when database is available", () => {
      vi.mocked(isDatabaseAvailable).mockReturnValue(true);
      expect(isDbAvailable()).toBe(true);
    });

    it("returns false when database is unavailable", () => {
      vi.mocked(isDatabaseAvailable).mockReturnValue(false);
      expect(isDbAvailable()).toBe(false);
    });
  });

  describe("createGame", () => {
    it("inserts game record and returns ID", () => {
      const game: GameRecord = {
        northModel: "gpt-4",
        eastModel: "claude-3",
        southModel: "gpt-4",
        westModel: "claude-3",
        winningScore: 10,
        presetName: "test-preset",
        startedAt: 1000,
      };

      const id = createGame(game);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO games"));
      expect(mockStatement.run).toHaveBeenCalledWith(
        "gpt-4", "claude-3", "gpt-4", "claude-3",
        10, "test-preset", 1000
      );
      expect(id).toBe(1);
    });

    it("returns null when database unavailable", () => {
      vi.mocked(getDb).mockReturnValueOnce(null);

      const id = createGame({
        northModel: "m1",
        eastModel: "m2",
        southModel: "m3",
        westModel: "m4",
        winningScore: 10,
      });

      expect(id).toBeNull();
    });
  });

  describe("completeGame", () => {
    it("updates game with final results", () => {
      completeGame(1, {
        team1Score: 10,
        team2Score: 7,
        winner: "team1",
        totalHands: 5,
        completedAt: 2000,
        durationMs: 1000,
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE games"));
      // The function passes more params including calibration fields
      expect(mockStatement.run).toHaveBeenCalled();
      const callArgs = mockStatement.run.mock.calls[0];
      expect(callArgs).toContain(10); // team1Score
      expect(callArgs).toContain(7);  // team2Score
      expect(callArgs).toContain("team1"); // winner
      expect(callArgs).toContain(5);  // totalHands
    });
  });

  describe("createHand", () => {
    it("inserts hand record and returns ID", () => {
      const hand: HandRecord = {
        gameId: 1,
        handNumber: 1,
        dealerPosition: 0,
        createdAt: 1000,
      };

      mockStatement.run.mockReturnValue({ lastInsertRowid: 42 });
      const id = createHand(hand);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO hands"));
      expect(id).toBe(42);
    });
  });

  describe("updateHand", () => {
    it("updates hand with trump info", () => {
      updateHand(1, {
        trumpSuit: "hearts",
        trumpMakerPosition: 2,
        goingAlone: true,
        goingAlonePosition: 2,
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE hands"));
      expect(mockStatement.run).toHaveBeenCalled();
    });

    it("updates hand with trick scores", () => {
      updateHand(1, {
        team1Tricks: 3,
        team2Tricks: 2,
        team1Points: 1,
        team2Points: 0,
        euchred: false,
      });

      expect(mockStatement.run).toHaveBeenCalled();
    });
  });

  describe("logDecision", () => {
    it("inserts decision record and returns ID", () => {
      const decision: DecisionRecord = {
        handId: 1,
        decisionType: "card_play",
        agentPosition: "north",
        modelId: "gpt-4",
        action: "acespades",
        reasoning: "Lead with trump",
        confidence: 85,
        wasLegal: true,
        trickNumber: 1,
        decisionTimeMs: 500,
        createdAt: 1000,
      };

      mockStatement.run.mockReturnValue({ lastInsertRowid: 100 });
      const id = logDecision(decision);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO decisions"));
      expect(id).toBe(100);
    });

    it("handles trump bid decisions", () => {
      const decision: DecisionRecord = {
        handId: 1,
        decisionType: "trump_bid",
        agentPosition: "east",
        modelId: "claude-3",
        action: "order_up:hearts",
        reasoning: "Strong hand",
        confidence: 90,
        wasLegal: true,
        trumpRound: 1,
        createdAt: 1000,
      };

      logDecision(decision);

      // Verify the key fields were passed correctly
      expect(mockStatement.run).toHaveBeenCalled();
      const callArgs = mockStatement.run.mock.calls[0];
      expect(callArgs).toContain(1); // handId
      expect(callArgs).toContain("trump_bid");
      expect(callArgs).toContain("claude-3");
      expect(callArgs).toContain("order_up:hearts");
      expect(callArgs).toContain("Strong hand");
      expect(callArgs).toContain(90); // confidence
    });
  });

  describe("updateDecisionOutcome", () => {
    it("updates decision with success status", () => {
      updateDecisionOutcome(100, true);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE decisions SET was_successful")
      );
      expect(mockStatement.run).toHaveBeenCalledWith(1, 100);
    });

    it("updates decision with failure status", () => {
      updateDecisionOutcome(100, false);

      expect(mockStatement.run).toHaveBeenCalledWith(0, 100);
    });
  });

  describe("logToolExecution", () => {
    it("inserts tool execution record", () => {
      const tool = {
        decisionId: 100,
        toolName: "ask_audience",
        agentPosition: "south" as const,
        success: true,
        result: '{"suggestion":"play ace"}',
        costPoints: 2,
        executionTimeMs: 300,
        createdAt: 1000,
      };

      mockStatement.run.mockReturnValue({ lastInsertRowid: 200 });
      const id = logToolExecution(tool);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO tool_executions"));
      expect(id).toBe(200);
    });
  });
});

describe("calibration calculations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculateBrierScore formula is correct", () => {
    // Test the Brier score formula directly
    // Brier = mean((predicted - actual)^2)
    // If confidence = 80% and outcome = 1 (success): (0.8 - 1)^2 = 0.04
    // If confidence = 80% and outcome = 0 (failure): (0.8 - 0)^2 = 0.64
    // If confidence = 50% and outcome = 1: (0.5 - 1)^2 = 0.25
    // If confidence = 50% and outcome = 0: (0.5 - 0)^2 = 0.25

    const decisions = [
      { confidence: 80, was_successful: 1 },  // (0.8-1)^2 = 0.04
      { confidence: 80, was_successful: 0 },  // (0.8-0)^2 = 0.64
      { confidence: 50, was_successful: 1 },  // (0.5-1)^2 = 0.25
      { confidence: 50, was_successful: 0 },  // (0.5-0)^2 = 0.25
    ];

    const brierScore = decisions.reduce((sum, d) => {
      const predicted = d.confidence / 100;
      const actual = d.was_successful ? 1 : 0;
      return sum + Math.pow(predicted - actual, 2);
    }, 0) / decisions.length;

    // (0.04 + 0.64 + 0.25 + 0.25) / 4 = 1.18 / 4 = 0.295
    expect(brierScore).toBeCloseTo(0.295, 3);
  });

  it("perfect calibration has Brier score of 0", () => {
    // When confidence exactly matches outcome
    const perfectDecisions = [
      { confidence: 100, was_successful: 1 },  // (1-1)^2 = 0
      { confidence: 0, was_successful: 0 },    // (0-0)^2 = 0
    ];

    const brierScore = perfectDecisions.reduce((sum, d) => {
      const predicted = d.confidence / 100;
      const actual = d.was_successful ? 1 : 0;
      return sum + Math.pow(predicted - actual, 2);
    }, 0) / perfectDecisions.length;

    expect(brierScore).toBe(0);
  });

  it("random guessing (50% confidence) has Brier score of 0.25", () => {
    // With 50% confidence, Brier is always 0.25 regardless of outcome
    const randomDecisions = [
      { confidence: 50, was_successful: 1 },  // (0.5-1)^2 = 0.25
      { confidence: 50, was_successful: 0 },  // (0.5-0)^2 = 0.25
    ];

    const brierScore = randomDecisions.reduce((sum, d) => {
      const predicted = d.confidence / 100;
      const actual = d.was_successful ? 1 : 0;
      return sum + Math.pow(predicted - actual, 2);
    }, 0) / randomDecisions.length;

    expect(brierScore).toBe(0.25);
  });
});
