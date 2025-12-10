import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewGame, createGameWithTrump } from "../../../../lib/game/game";
import type { StreamContext, DecisionRecord } from "../types";
import type { TrackedGameState } from "../../game-tracker";
import type { GameState, Position, Card } from "../../../../lib/game/types";

/**
 * Tests for SSE stream phase handlers
 */

// Mock the AI agent functions
vi.mock("../../ai-agent", () => ({
  makeTrumpBidDecisionStreaming: vi.fn(),
  makeCardPlayDecisionStreaming: vi.fn(),
  makeDiscardDecisionStreaming: vi.fn(),
}));

// Mock the game tracker functions
vi.mock("../../game-tracker", () => ({
  ensureTracking: vi.fn((game) => ({ ...game, _tracking: {} })),
  logTrumpBidDecision: vi.fn(),
  logDiscardDecision: vi.fn(),
  logCardPlayDecision: vi.fn(),
  updateTrickOutcomes: vi.fn(),
  updateTrumpBidOutcomes: vi.fn(),
  startNewHand: vi.fn((game) => ({ ...game, phase: "trump_selection" })),
  completeHandTracking: vi.fn(),
  completeGameTracking: vi.fn(),
}));

// Mock game functions used in playing phase to avoid validation errors
vi.mock("../../../../lib/game/game", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../lib/game/game")>();
  return {
    ...actual,
    // Mock playCard to skip validation and simulate trick completion
    playCard: vi.fn((game: GameState, player: Position, card: Card, reasoning?: string) => {
      // Remove card from player's hand
      const playerIndex = game.players.findIndex((p) => p.position === player);
      const playerObj = game.players[playerIndex]!;
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...playerObj,
        hand: playerObj.hand.filter((c) => !(c.rank === card.rank && c.suit === card.suit)),
      };

      // Add to current trick
      const updatedTrick = {
        ...game.currentTrick,
        plays: [...game.currentTrick.plays, { player, card, reasoning }],
      };

      // Check if trick complete (4 plays or 3 if going alone)
      const expectedPlays = game.goingAlone ? 3 : 4;
      if (updatedTrick.plays.length === expectedPlays) {
        // Trick complete - add to completed tricks with winner
        return {
          ...game,
          players: updatedPlayers,
          currentTrick: { leadPlayer: player, plays: [], winner: undefined },
          completedTricks: [
            ...game.completedTricks,
            { ...updatedTrick, winner: player },
          ],
        };
      }

      return {
        ...game,
        players: updatedPlayers,
        currentTrick: updatedTrick,
      };
    }),
    // Mock getNextPlayer to cycle through positions based on leadPlayer
    getNextPlayer: vi.fn((game: GameState): Position => {
      const positions: Position[] = ["north", "east", "south", "west"];
      const currentPlays = game.currentTrick.plays.length;
      const leadPlayer = (game.currentTrick as any).leadPlayer as Position;
      const leaderIndex = positions.indexOf(leadPlayer);
      return positions[(leaderIndex + currentPlays) % 4];
    }),
  };
});

const modelIds: [string, string, string, string] = ["model-1", "model-2", "model-3", "model-4"];

function createMockContext(): { ctx: StreamContext; events: Array<{ type: string; data: any }> } {
  const events: Array<{ type: string; data: any }> = [];
  const ctx: StreamContext = {
    sendEvent: (type: string, data: any) => {
      events.push({ type, data });
    },
    game: createNewGame(modelIds) as TrackedGameState,
  };
  return { ctx, events };
}

function createPlayingContext(): { ctx: StreamContext; events: Array<{ type: string; data: any }> } {
  const events: Array<{ type: string; data: any }> = [];
  const game = createGameWithTrump(modelIds, "hearts") as TrackedGameState;
  const ctx: StreamContext = {
    sendEvent: (type: string, data: any) => {
      events.push({ type, data });
    },
    game,
  };
  return { ctx, events };
}

describe("Stream Handler Types", () => {
  it("StreamContext should have required properties", () => {
    const { ctx } = createMockContext();
    expect(ctx).toHaveProperty("sendEvent");
    expect(ctx).toHaveProperty("game");
    expect(typeof ctx.sendEvent).toBe("function");
  });

  it("sendEvent should capture events", () => {
    const { ctx, events } = createMockContext();
    ctx.sendEvent("test_event", { foo: "bar" });
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: "test_event", data: { foo: "bar" } });
  });
});

describe("Trump Selection Handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should import and export handleTrumpSelection", async () => {
    const { handleTrumpSelection } = await import("../trump-selection");
    expect(handleTrumpSelection).toBeDefined();
    expect(typeof handleTrumpSelection).toBe("function");
  });

  it("should send player_thinking event for each bidder", async () => {
    const { makeTrumpBidDecisionStreaming } = await import("../../ai-agent");
    const { handleTrumpSelection } = await import("../trump-selection");

    // Mock AI to pass on all bids (triggers round 2)
    (makeTrumpBidDecisionStreaming as any).mockResolvedValue({
      action: "pass",
      goingAlone: false,
      reasoning: "Test pass",
      confidence: 50,
      duration: 100,
    });

    const { ctx, events } = createMockContext();
    await handleTrumpSelection(ctx);

    const thinkingEvents = events.filter((e) => e.type === "player_thinking");
    expect(thinkingEvents.length).toBeGreaterThan(0);
    expect(thinkingEvents[0].data).toHaveProperty("player");
    expect(thinkingEvents[0].data).toHaveProperty("modelId");
  });

  it("should send decision_made event after each bid", async () => {
    const { makeTrumpBidDecisionStreaming } = await import("../../ai-agent");
    const { handleTrumpSelection } = await import("../trump-selection");

    (makeTrumpBidDecisionStreaming as any).mockResolvedValue({
      action: "pass",
      goingAlone: false,
      reasoning: "Weak hand",
      confidence: 30,
      duration: 150,
    });

    const { ctx, events } = createMockContext();
    await handleTrumpSelection(ctx);

    const decisionEvents = events.filter((e) => e.type === "decision_made");
    expect(decisionEvents.length).toBeGreaterThan(0);
    expect(decisionEvents[0].data).toHaveProperty("action");
    expect(decisionEvents[0].data).toHaveProperty("reasoning");
    expect(decisionEvents[0].data).toHaveProperty("confidence");
  });

  it("should send round_complete event at the end", async () => {
    const { makeTrumpBidDecisionStreaming } = await import("../../ai-agent");
    const { handleTrumpSelection } = await import("../trump-selection");

    (makeTrumpBidDecisionStreaming as any).mockResolvedValue({
      action: "pass",
      goingAlone: false,
      reasoning: "Pass",
      confidence: 50,
      duration: 100,
    });

    const { ctx, events } = createMockContext();
    await handleTrumpSelection(ctx);

    const roundCompleteEvents = events.filter((e) => e.type === "round_complete");
    expect(roundCompleteEvents.length).toBe(1);
    expect(roundCompleteEvents[0].data).toHaveProperty("gameState");
    expect(roundCompleteEvents[0].data).toHaveProperty("phase");
    expect(roundCompleteEvents[0].data).toHaveProperty("decisions");
  });
});

describe("Playing Phase Handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should import and export handlePlayingPhase", async () => {
    const { handlePlayingPhase } = await import("../playing");
    expect(handlePlayingPhase).toBeDefined();
    expect(typeof handlePlayingPhase).toBe("function");
  });

  it("should send player_thinking for each player in trick", async () => {
    const { makeCardPlayDecisionStreaming } = await import("../../ai-agent");
    const { handlePlayingPhase } = await import("../playing");

    // Mock card play decisions
    (makeCardPlayDecisionStreaming as any).mockImplementation(
      async (game: any, player: string) => {
        const playerObj = game.players.find((p: any) => p.position === player);
        return {
          card: playerObj?.hand[0] || { suit: "hearts", rank: "9" },
          reasoning: "Playing a card",
          confidence: 60,
          duration: 200,
        };
      }
    );

    const { ctx, events } = createPlayingContext();
    await handlePlayingPhase(ctx);

    const thinkingEvents = events.filter((e) => e.type === "player_thinking");
    // Should have 4 thinking events (one per player, or 3 if going alone)
    expect(thinkingEvents.length).toBeGreaterThanOrEqual(3);
  });

  it("should send tool events when tools are used", async () => {
    const { makeCardPlayDecisionStreaming } = await import("../../ai-agent");
    const { handlePlayingPhase } = await import("../playing");

    // Mock with tool usage
    (makeCardPlayDecisionStreaming as any).mockImplementation(
      async (game: any, player: string, modelId: string, onToken: any, prompt: any, callbacks: any) => {
        // Simulate tool request
        if (callbacks?.onToolRequest) {
          callbacks.onToolRequest({ tool: "ask_audience", player, cost: 2 });
        }
        if (callbacks?.onToolResult) {
          callbacks.onToolResult({ tool: "ask_audience", result: {}, cost: 2, duration: 500 });
        }

        const playerObj = game.players.find((p: any) => p.position === player);
        return {
          card: playerObj?.hand[0] || { suit: "hearts", rank: "9" },
          reasoning: "Used tool to decide",
          confidence: 80,
          duration: 700,
          toolUsed: { tool: "ask_audience", cost: 2 },
        };
      }
    );

    const { ctx, events } = createPlayingContext();
    await handlePlayingPhase(ctx);

    const toolRequestEvents = events.filter((e) => e.type === "tool_request");
    const toolResultEvents = events.filter((e) => e.type === "tool_result");

    expect(toolRequestEvents.length).toBeGreaterThan(0);
    expect(toolResultEvents.length).toBeGreaterThan(0);
  });

  it("should send illegal_attempt event when AI picks illegal card", async () => {
    const { makeCardPlayDecisionStreaming } = await import("../../ai-agent");
    const { handlePlayingPhase } = await import("../playing");

    let callCount = 0;
    (makeCardPlayDecisionStreaming as any).mockImplementation(
      async (game: any, player: string) => {
        callCount++;
        const playerObj = game.players.find((p: any) => p.position === player);
        return {
          card: playerObj?.hand[0] || { suit: "hearts", rank: "9" },
          reasoning: "Corrected play",
          confidence: 50,
          duration: 300,
          // Only first player had illegal attempt
          illegalAttempt: callCount === 1 ? { card: { suit: "clubs", rank: "ace" }, reasoning: "Tried illegal" } : undefined,
          isFallback: callCount === 1,
        };
      }
    );

    const { ctx, events } = createPlayingContext();
    await handlePlayingPhase(ctx);

    const illegalEvents = events.filter((e) => e.type === "illegal_attempt");
    expect(illegalEvents.length).toBe(1);
    expect(illegalEvents[0].data).toHaveProperty("attemptedCard");
    expect(illegalEvents[0].data).toHaveProperty("isFallback");
  });

  it("should send round_complete with trick winner", async () => {
    const { makeCardPlayDecisionStreaming } = await import("../../ai-agent");
    const { handlePlayingPhase } = await import("../playing");

    (makeCardPlayDecisionStreaming as any).mockImplementation(
      async (game: any, player: string) => {
        const playerObj = game.players.find((p: any) => p.position === player);
        return {
          card: playerObj?.hand[0] || { suit: "hearts", rank: "9" },
          reasoning: "Playing",
          confidence: 50,
          duration: 100,
        };
      }
    );

    const { ctx, events } = createPlayingContext();
    await handlePlayingPhase(ctx);

    const roundCompleteEvents = events.filter((e) => e.type === "round_complete");
    expect(roundCompleteEvents.length).toBe(1);
    expect(roundCompleteEvents[0].data).toHaveProperty("trickWinner");
    expect(roundCompleteEvents[0].data).toHaveProperty("trickNumber");
  });
});

describe("Completion Handlers", () => {
  it("should import and export handleHandComplete", async () => {
    const { handleHandComplete } = await import("../completion");
    expect(handleHandComplete).toBeDefined();
    expect(typeof handleHandComplete).toBe("function");
  });

  it("should import and export handleGameComplete", async () => {
    const { handleGameComplete } = await import("../completion");
    expect(handleGameComplete).toBeDefined();
    expect(typeof handleGameComplete).toBe("function");
  });

  it("handleHandComplete should send round_complete with hand info", async () => {
    const { handleHandComplete } = await import("../completion");
    const { startNewHand } = await import("../../game-tracker");

    const events: Array<{ type: string; data: any }> = [];
    const game = createNewGame(modelIds) as TrackedGameState;
    game.phase = "hand_complete";
    game.scores = [2, 1];
    game.gameScores = [4, 2];
    game.handNumber = 2;

    const ctx: StreamContext = {
      sendEvent: (type, data) => events.push({ type, data }),
      game,
    };

    await handleHandComplete(ctx);

    expect(startNewHand).toHaveBeenCalled();
    const roundComplete = events.find((e) => e.type === "round_complete");
    expect(roundComplete).toBeDefined();
    expect(roundComplete?.data.phase).toBe("hand_complete");
    expect(roundComplete?.data).toHaveProperty("handScores");
    expect(roundComplete?.data).toHaveProperty("gameScores");
  });

  it("handleGameComplete should send round_complete with winner", async () => {
    const { handleGameComplete } = await import("../completion");
    const { completeGameTracking } = await import("../../game-tracker");

    const events: Array<{ type: string; data: any }> = [];
    const game = createNewGame(modelIds) as TrackedGameState;
    game.phase = "game_complete";
    game.gameScores = [10, 6];

    const ctx: StreamContext = {
      sendEvent: (type, data) => events.push({ type, data }),
      game,
    };

    await handleGameComplete(ctx);

    expect(completeGameTracking).toHaveBeenCalled();
    const roundComplete = events.find((e) => e.type === "round_complete");
    expect(roundComplete).toBeDefined();
    expect(roundComplete?.data.phase).toBe("game_complete");
    expect(roundComplete?.data.winningTeam).toBe(0); // Team 0 has higher score
  });
});

describe("DecisionRecord type", () => {
  it("should match expected structure", () => {
    const decision: DecisionRecord = {
      player: "north",
      modelId: "test-model",
      action: "order_up",
      reasoning: "Strong hand",
      duration: 150,
    };

    expect(decision.player).toBe("north");
    expect(decision.modelId).toBe("test-model");
    expect(decision.action).toBe("order_up");
    expect(decision.reasoning).toBe("Strong hand");
    expect(decision.duration).toBe(150);
  });

  it("should allow optional card property", () => {
    const decision: DecisionRecord = {
      player: "east",
      modelId: "model-2",
      card: { rank: "ace", suit: "hearts" },
      reasoning: "Playing ace",
      duration: 200,
    };

    expect(decision.card).toEqual({ rank: "ace", suit: "hearts" });
  });
});
