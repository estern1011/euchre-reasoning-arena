import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGameStreaming } from "../useGameStreaming";
import type { SSEMessage } from "../useGameStreaming";
import type { GameState } from "~/types/game";

// Helper to access message at index with type assertion for tests
// This is safe in tests since we control the mock data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMsg(arr: SSEMessage[], index: number): any {
  const m = arr[index];
  if (!m) throw new Error(`No message at index ${index}`);
  return m;
}

// Mock game state for testing
const createMockGameState = (): GameState => ({
  id: "test-game",
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
  scores: [0, 0],
  handNumber: 1,
  gameScores: [0, 0],
  winningScore: 10,
});

// Helper to create SSE formatted string
const createSSEMessage = (data: any): string => {
  return `data: ${JSON.stringify(data)}\n`;
};

// Helper to encode text
const encodeText = (text: string): Uint8Array => {
  return new TextEncoder().encode(text);
};

// Mock ReadableStream reader
const createMockReader = (chunks: string[]) => {
  let index = 0;
  return {
    read: vi.fn(async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined };
      }
      const chunk = chunks[index]!;
      const value = encodeText(chunk);
      index++;
      return { done: false, value };
    }),
  };
};

describe("useGameStreaming", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("basic streaming", () => {
    it("should stream single SSE message", async () => {
      const playerThinkingMsg = createSSEMessage({
        type: "player_thinking",
        player: "north",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader([playerThinkingMsg]),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const messages: SSEMessage[] = [];

      for await (const msg of streamGameRound(createMockGameState())) {
        messages.push(msg);
      }

      expect(messages).toHaveLength(1);
      expect(getMsg(messages, 0).type).toBe("player_thinking");
      expect(getMsg(messages, 0).player).toBe("north");
    });

    it("should stream multiple SSE messages", async () => {
      const messages = [
        createSSEMessage({ type: "player_thinking", player: "north" }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "I " }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "will " }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "play " }),
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader(messages),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const msg of streamGameRound(createMockGameState())) {
        received.push(msg);
      }

      expect(received).toHaveLength(4);
      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(getMsg(received, 1).type).toBe("reasoning_token");
      expect(getMsg(received, 1).token).toBe("I ");
      expect(getMsg(received, 2).token).toBe("will ");
      expect(getMsg(received, 3).token).toBe("play ");
    });

    it("should stream complete decision sequence", async () => {
      const messages = [
        createSSEMessage({ type: "player_thinking", player: "north" }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "Analyzing..." }),
        createSSEMessage({
          type: "decision_made",
          player: "north",
          card: { rank: "ace", suit: "hearts" },
          reasoning: "Playing ace of hearts",
          modelId: "m1",
          duration: 1500,
        }),
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader(messages),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const msg of streamGameRound(createMockGameState())) {
        received.push(msg);
      }

      expect(received).toHaveLength(3);
      expect(getMsg(received, 2).type).toBe("decision_made");
      expect(getMsg(received, 2).card).toEqual({ rank: "ace", suit: "hearts" });
    });
  });

  describe("buffer management", () => {
    it("should handle incomplete SSE messages across chunks", async () => {
      // Split a message across multiple chunks
      const fullMessage = createSSEMessage({ type: "player_thinking", player: "north" });
      const chunks = [
        fullMessage.substring(0, 10),  // "data: {\"ty"
        fullMessage.substring(10, 30), // "pe\":\"player_think"
        fullMessage.substring(30),     // "ing\",\"player\":\"north\"}\n"
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader(chunks),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(received).toHaveLength(1);
      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(getMsg(received, 0).player).toBe("north");
    });

    it("should handle multiple messages in single chunk", async () => {
      const chunk = 
        createSSEMessage({ type: "player_thinking", player: "north" }) +
        createSSEMessage({ type: "reasoning_token", player: "north", token: "Test" }) +
        createSSEMessage({ type: "decision_made", player: "north", card: { rank: "9", suit: "hearts" } });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader([chunk]),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const msg of streamGameRound(createMockGameState())) {
        received.push(msg);
      }

      expect(received).toHaveLength(3);
      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(getMsg(received, 1).type).toBe("reasoning_token");
      expect(getMsg(received, 2).type).toBe("decision_made");
    });

    it("should handle empty lines and whitespace", async () => {
      const chunk =
        "\n" +
        createSSEMessage({ type: "player_thinking", player: "north" }) +
        "   \n" +
        "\n\n" +
        createSSEMessage({ type: "reasoning_token", player: "north", token: "Test" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader([chunk]),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(received).toHaveLength(2);
      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(getMsg(received, 1).type).toBe("reasoning_token");
    });

    it("should ignore non-data lines", async () => {
      const chunk = 
        ": comment line\n" +
        createSSEMessage({ type: "player_thinking", player: "north" }) +
        "event: custom\n" +
        createSSEMessage({ type: "reasoning_token", player: "north", token: "Test" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader([chunk]),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const msg of streamGameRound(createMockGameState())) {
        received.push(msg);
      }

      // Should only parse lines starting with "data: "
      expect(received).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("should handle HTTP error responses", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { streamGameRound } = useGameStreaming();

      let errorThrown = false;
      try {
        for await (const msg of streamGameRound(createMockGameState())) {
          // Should not reach here
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("HTTP error! status: 500");
      }

      expect(errorThrown).toBe(true);
    });

    it("should handle missing response body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      const { streamGameRound } = useGameStreaming();

      let errorThrown = false;
      try {
        for await (const msg of streamGameRound(createMockGameState())) {
          // Should not reach here
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("No response body");
      }

      expect(errorThrown).toBe(true);
    });

    it("should handle malformed JSON gracefully", async () => {
      const chunks = [
        "data: {invalid json}\n",
        createSSEMessage({ type: "player_thinking", player: "north" }),
      ];

      // Mock console.error to suppress error output during test
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader(chunks),
        },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const msg of streamGameRound(createMockGameState())) {
        received.push(msg);
      }

      // Should skip malformed message but continue with valid ones
      expect(received).toHaveLength(1);
      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SSE Parse Error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const { streamGameRound } = useGameStreaming();

      let errorThrown = false;
      try {
        for await (const msg of streamGameRound(createMockGameState())) {
          // Should not reach here
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Network timeout");
      }

      expect(errorThrown).toBe(true);
    });

    it("should handle reader errors", async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: encodeText(createSSEMessage({ type: "player_thinking", player: "north" })) })
          .mockRejectedValueOnce(new Error("Read error")),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { streamGameRound } = useGameStreaming();

      let errorThrown = false;
      let messagesReceived = 0;
      try {
        for await (const msg of streamGameRound(createMockGameState())) {
          messagesReceived++;
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Read error");
      }

      expect(messagesReceived).toBe(1); // Should have processed first message
      expect(errorThrown).toBe(true);
    });
  });

  describe("message types", () => {
    it("should handle player_thinking messages", async () => {
      const msg = createSSEMessage({
        type: "player_thinking",
        player: "east",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([msg]) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(getMsg(received, 0).player).toBe("east");
    });

    it("should handle reasoning_token messages", async () => {
      const msg = createSSEMessage({
        type: "reasoning_token",
        player: "south",
        token: "I think ",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([msg]) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(getMsg(received, 0).type).toBe("reasoning_token");
      expect(getMsg(received, 0).player).toBe("south");
      expect(getMsg(received, 0).token).toBe("I think ");
    });

    it("should handle illegal_attempt messages", async () => {
      const msg = createSSEMessage({
        type: "illegal_attempt",
        player: "west",
        attemptedCard: { rank: "ace", suit: "clubs" },
        isFallback: false,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([msg]) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(getMsg(received, 0).type).toBe("illegal_attempt");
      expect(getMsg(received, 0).player).toBe("west");
      expect(getMsg(received, 0).attemptedCard).toEqual({ rank: "ace", suit: "clubs" });
      expect(getMsg(received, 0).isFallback).toBe(false);
    });

    it("should handle decision_made messages", async () => {
      const msg = createSSEMessage({
        type: "decision_made",
        player: "north",
        card: { rank: "king", suit: "hearts" },
        reasoning: "Playing king",
        modelId: "m1",
        duration: 2000,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([msg]) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(getMsg(received, 0).type).toBe("decision_made");
      expect(getMsg(received, 0).card).toEqual({ rank: "king", suit: "hearts" });
      expect(getMsg(received, 0).reasoning).toBe("Playing king");
      expect(getMsg(received, 0).modelId).toBe("m1");
      expect(getMsg(received, 0).duration).toBe(2000);
    });

    it("should handle round_complete messages", async () => {
      const msg = createSSEMessage({
        type: "round_complete",
        gameState: createMockGameState(),
        phase: "playing",
        trickWinner: "north",
        trickNumber: 1,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([msg]) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(getMsg(received, 0).type).toBe("round_complete");
      expect(getMsg(received, 0).gameState).toBeDefined();
      expect(getMsg(received, 0).trickWinner).toBe("north");
      expect(getMsg(received, 0).trickNumber).toBe(1);
    });

    it("should handle error messages", async () => {
      const errorMsg = createSSEMessage({
        type: "error",
        message: "AI model failed",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([errorMsg]) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(getMsg(received, 0).type).toBe("error");
      expect(getMsg(received, 0).message).toBe("AI model failed");
    });
  });

  describe("isStreaming state", () => {
    it("should be false initially", () => {
      const { isStreaming } = useGameStreaming();
      expect(isStreaming.value).toBe(false);
    });

    it("should be true during streaming", async () => {
      const msg = createSSEMessage({ type: "player_thinking", player: "north" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => {
            let called = false;
            return {
              read: async () => {
                if (called) return { done: true, value: undefined };
                called = true;
                return { done: false, value: encodeText(msg) };
              },
            };
          },
        },
      });

      const { isStreaming, streamGameRound } = useGameStreaming();
      
      expect(isStreaming.value).toBe(false);

      const streamPromise = (async () => {
        for await (const m of streamGameRound(createMockGameState())) {
          // During iteration, isStreaming should be true
          expect(isStreaming.value).toBe(true);
        }
      })();

      await streamPromise;
      expect(isStreaming.value).toBe(false);
    });

    it("should be false after streaming completes", async () => {
      const msg = createSSEMessage({ type: "player_thinking", player: "north" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader([msg]) },
      });

      const { isStreaming, streamGameRound } = useGameStreaming();

      for await (const m of streamGameRound(createMockGameState())) {
        // Process messages
      }

      expect(isStreaming.value).toBe(false);
    });

    it("should be false after error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const { isStreaming, streamGameRound } = useGameStreaming();

      try {
        for await (const m of streamGameRound(createMockGameState())) {
          // Should not reach here
        }
      } catch (e) {
        // Expected error
      }

      expect(isStreaming.value).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    it("should stream complete game round", async () => {
      const messages = [
        createSSEMessage({ type: "player_thinking", player: "north" }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "I " }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "will " }),
        createSSEMessage({ type: "reasoning_token", player: "north", token: "lead " }),
        createSSEMessage({
          type: "decision_made",
          player: "north",
          card: { rank: "ace", suit: "hearts" },
          reasoning: "I will lead with ace of hearts",
          modelId: "m1",
          duration: 1500,
        }),
        createSSEMessage({ type: "player_thinking", player: "east" }),
        createSSEMessage({ type: "reasoning_token", player: "east", token: "Following suit" }),
        createSSEMessage({
          type: "decision_made",
          player: "east",
          card: { rank: "9", suit: "hearts" },
          reasoning: "Following suit with 9",
          modelId: "m2",
          duration: 1200,
        }),
        createSSEMessage({
          type: "round_complete",
          gameState: createMockGameState(),
          phase: "playing",
          trickWinner: "north",
          trickNumber: 1,
        }),
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader(messages) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(received).toHaveLength(9);
      expect(getMsg(received, 0).type).toBe("player_thinking");
      expect(getMsg(received, 4).type).toBe("decision_made");
      expect(getMsg(received, 8).type).toBe("round_complete");
    });

    it("should handle illegal move retry scenario", async () => {
      const messages = [
        createSSEMessage({ type: "player_thinking", player: "south" }),
        createSSEMessage({ type: "reasoning_token", player: "south", token: "Playing ace" }),
        createSSEMessage({
          type: "illegal_attempt",
          player: "south",
          attemptedCard: { rank: "ace", suit: "clubs" },
          isFallback: false,
        }),
        createSSEMessage({ type: "reasoning_token", player: "south", token: "Retrying with different card" }),
        createSSEMessage({
          type: "decision_made",
          player: "south",
          card: { rank: "9", suit: "hearts" },
          reasoning: "Playing 9 of hearts instead",
          modelId: "m3",
          duration: 2500,
        }),
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => createMockReader(messages) },
      });

      const { streamGameRound } = useGameStreaming();
      const received: SSEMessage[] = [];

      for await (const m of streamGameRound(createMockGameState())) {
        received.push(m);
      }

      expect(received).toHaveLength(5);
      expect(getMsg(received, 2).type).toBe("illegal_attempt");
      expect(getMsg(received, 4).type).toBe("decision_made");
      expect(getMsg(received, 4).card?.rank).toBe("9");
    });
  });
});
