import { describe, it, expect } from "vitest";
import { buildReflectionPrompt, REFLECTION_SYSTEM_PROMPT } from "../prompts";
import type { HandSummaryForAgent } from "../types";

/**
 * Tests for Agent Reflection system ("What I Learned")
 */

describe("Reflection Prompts", () => {
  describe("REFLECTION_SYSTEM_PROMPT", () => {
    it("should provide guidance for reflections", () => {
      expect(REFLECTION_SYSTEM_PROMPT).toContain("ONE or TWO sentences");
      expect(REFLECTION_SYSTEM_PROMPT).toContain("first person");
      expect(REFLECTION_SYSTEM_PROMPT).toContain("specific");
    });

    it("should include good and bad examples", () => {
      expect(REFLECTION_SYSTEM_PROMPT).toContain("Good reflections");
      expect(REFLECTION_SYSTEM_PROMPT).toContain("Bad reflections");
    });
  });

  describe("buildReflectionPrompt", () => {
    const baseSummary: HandSummaryForAgent = {
      handNumber: 1,
      position: "north",
      modelId: "anthropic/claude-3-haiku",
      trumpDecision: null,
      tricksWon: 3,
      toolUsed: null,
      outcome: {
        winningTeam: "NS",
        callingTeam: "NS",
        wasEuchred: false,
        wasMarch: false,
        points: 1,
      },
      isOnCallingTeam: true,
      teamWon: true,
    };

    it("should include hand number and position", () => {
      const prompt = buildReflectionPrompt(baseSummary, []);
      expect(prompt).toContain("Hand 1");
      expect(prompt).toContain("NORTH");
    });

    it("should show team information", () => {
      const prompt = buildReflectionPrompt(baseSummary, []);
      expect(prompt).toContain("Your team: NS");
      expect(prompt).toContain("WON");
    });

    it("should include trump decision when present", () => {
      const summaryWithTrump: HandSummaryForAgent = {
        ...baseSummary,
        trumpDecision: {
          action: "call_trump",
          suit: "hearts",
          confidence: 75,
          wasSuccessful: true,
        },
      };
      const prompt = buildReflectionPrompt(summaryWithTrump, []);
      expect(prompt).toContain("Called hearts");
      expect(prompt).toContain("75% confidence");
      expect(prompt).toContain("succeeded");
    });

    it("should handle pass trump decision", () => {
      const summaryWithPass: HandSummaryForAgent = {
        ...baseSummary,
        trumpDecision: {
          action: "pass",
          confidence: 60,
          wasSuccessful: true,
        },
      };
      const prompt = buildReflectionPrompt(summaryWithPass, []);
      expect(prompt).toContain("Passed");
      expect(prompt).toContain("60% confidence");
    });

    it("should show tricks won", () => {
      const prompt = buildReflectionPrompt(baseSummary, []);
      expect(prompt).toContain("3/5 tricks");
    });

    it("should highlight euchre when player was on calling team", () => {
      const euchredSummary: HandSummaryForAgent = {
        ...baseSummary,
        outcome: {
          ...baseSummary.outcome,
          wasEuchred: true,
          winningTeam: "EW",
        },
        teamWon: false,
      };
      const prompt = buildReflectionPrompt(euchredSummary, []);
      expect(prompt).toContain("EUCHRED");
    });

    it("should highlight march when team won all tricks", () => {
      const marchSummary: HandSummaryForAgent = {
        ...baseSummary,
        tricksWon: 5,
        outcome: {
          ...baseSummary.outcome,
          wasMarch: true,
          points: 2,
        },
      };
      const prompt = buildReflectionPrompt(marchSummary, []);
      expect(prompt).toContain("MARCHED");
    });

    it("should include tool usage when present", () => {
      const summaryWithTool: HandSummaryForAgent = {
        ...baseSummary,
        toolUsed: { tool: "ask_audience", cost: 2 },
      };
      const prompt = buildReflectionPrompt(summaryWithTool, []);
      expect(prompt).toContain("ask_audience");
      expect(prompt).toContain("-2 points");
    });

    it("should include previous reflections when present", () => {
      const previousReflections = [
        "Leading trump early worked well.",
        "Should be more careful about calling with weak hands.",
      ];
      const prompt = buildReflectionPrompt(baseSummary, previousReflections);
      expect(prompt).toContain("Previous Reflections");
      expect(prompt).toContain("Leading trump early worked well.");
      expect(prompt).toContain("weak hands");
      expect(prompt).toContain("Don't repeat");
    });

    it("should limit previous reflections to last 3", () => {
      const manyReflections = [
        "Reflection 1",
        "Reflection 2",
        "Reflection 3",
        "Reflection 4",
        "Reflection 5",
      ];
      const prompt = buildReflectionPrompt(baseSummary, manyReflections);
      // Should only include last 3
      expect(prompt).toContain("Reflection 3");
      expect(prompt).toContain("Reflection 4");
      expect(prompt).toContain("Reflection 5");
      expect(prompt).not.toContain("Reflection 1");
      expect(prompt).not.toContain("Reflection 2");
    });

    it("should not include previous reflections section when empty", () => {
      const prompt = buildReflectionPrompt(baseSummary, []);
      expect(prompt).not.toContain("Previous Reflections");
    });

    it("should prompt for specific learning", () => {
      const prompt = buildReflectionPrompt(baseSummary, []);
      expect(prompt).toContain("What did you learn");
      expect(prompt).toContain("1-2 sentences");
      expect(prompt).toContain("specific");
    });

    it("should handle losing team scenario", () => {
      const losingSummary: HandSummaryForAgent = {
        ...baseSummary,
        position: "east",
        outcome: {
          ...baseSummary.outcome,
          winningTeam: "NS",
          callingTeam: "EW",
        },
        isOnCallingTeam: true,
        teamWon: false,
        tricksWon: 2,
      };
      const prompt = buildReflectionPrompt(losingSummary, []);
      expect(prompt).toContain("EAST");
      expect(prompt).toContain("EW");
      expect(prompt).toContain("LOST");
    });
  });
});

describe("Reflection Types", () => {
  it("should have correct HandSummaryForAgent structure", () => {
    const summary: HandSummaryForAgent = {
      handNumber: 1,
      position: "north",
      modelId: "test-model",
      trumpDecision: {
        action: "order_up",
        suit: "spades",
        confidence: 80,
        wasSuccessful: true,
      },
      tricksWon: 4,
      toolUsed: { tool: "fifty_fifty", cost: 3 },
      outcome: {
        winningTeam: "NS",
        callingTeam: "NS",
        wasEuchred: false,
        wasMarch: false,
        points: 1,
      },
      isOnCallingTeam: true,
      teamWon: true,
    };

    expect(summary.handNumber).toBe(1);
    expect(summary.position).toBe("north");
    expect(summary.trumpDecision?.action).toBe("order_up");
    expect(summary.toolUsed?.tool).toBe("fifty_fifty");
  });
});
