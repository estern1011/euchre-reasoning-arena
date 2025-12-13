import { describe, it, expect } from "vitest";
import {
  buildTrumpBidSystemPrompt,
  buildCardPlaySystemPrompt,
  buildDiscardSystemPrompt,
  type PromptOptions,
} from "../ai-agent/prompts";

/**
 * Tests for AI agent prompts, especially reflection injection
 */

describe("Agent Prompts", () => {
  describe("buildTrumpBidSystemPrompt", () => {
    it("should build basic round 1 prompt without reflections", () => {
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false);
      expect(prompt).toContain("ROUND 1");
      expect(prompt).toContain("hearts");
      expect(prompt).toContain("order_up");
      expect(prompt).toContain("METACOGNITION");
      expect(prompt).not.toContain("WHAT YOU LEARNED");
    });

    it("should build round 2 prompt", () => {
      const prompt = buildTrumpBidSystemPrompt(2, "spades", false);
      expect(prompt).toContain("ROUND 2");
      expect(prompt).toContain("spades was turned down");
      expect(prompt).toContain("call_trump");
    });

    it("should build dealer must call prompt", () => {
      const prompt = buildTrumpBidSystemPrompt(2, "clubs", true);
      expect(prompt).toContain("MUST call trump");
      expect(prompt).toContain("EXCEPT clubs");
    });

    it("should include reflections when provided", () => {
      const options: PromptOptions = {
        agentReflections: {
          north: [
            "Calling trump with weak hands cost me.",
            "Leading trump early worked well.",
          ],
        },
      };
      const prompt = buildTrumpBidSystemPrompt(1, "diamonds", false, options, "north");
      expect(prompt).toContain("WHAT YOU LEARNED FROM PREVIOUS HANDS");
      expect(prompt).toContain("weak hands");
      expect(prompt).toContain("Leading trump early");
      expect(prompt).toContain("Apply these lessons");
    });

    it("should not include reflections for other players", () => {
      const options: PromptOptions = {
        agentReflections: {
          north: ["North's reflection"],
        },
      };
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false, options, "east");
      expect(prompt).not.toContain("WHAT YOU LEARNED");
      expect(prompt).not.toContain("North's reflection");
    });

    it("should limit reflections to last 3", () => {
      const options: PromptOptions = {
        agentReflections: {
          south: [
            "Reflection 1",
            "Reflection 2",
            "Reflection 3",
            "Reflection 4",
          ],
        },
      };
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false, options, "south");
      expect(prompt).toContain("Reflection 2");
      expect(prompt).toContain("Reflection 3");
      expect(prompt).toContain("Reflection 4");
      expect(prompt).not.toContain("Reflection 1");
    });

    it("should respect strategyHints option", () => {
      const promptWithHints = buildTrumpBidSystemPrompt(1, "hearts", false, { strategyHints: true });
      const promptWithoutHints = buildTrumpBidSystemPrompt(1, "hearts", false, { strategyHints: false });
      expect(promptWithHints).toContain("Strategy:");
      expect(promptWithoutHints).not.toContain("Strategy:");
    });
  });

  describe("buildCardPlaySystemPrompt", () => {
    const validCards = "ACE of hearts, KING of spades";

    it("should build basic prompt without reflections", () => {
      const prompt = buildCardPlaySystemPrompt(validCards);
      expect(prompt).toContain("VALID CARDS:");
      expect(prompt).toContain(validCards);
      expect(prompt).toContain("METACOGNITION");
      expect(prompt).not.toContain("WHAT YOU LEARNED");
    });

    it("should include reflections when provided", () => {
      const options: PromptOptions = {
        agentReflections: {
          west: ["Save high trump for critical moments."],
        },
      };
      const prompt = buildCardPlaySystemPrompt(validCards, options, "west");
      expect(prompt).toContain("WHAT YOU LEARNED FROM PREVIOUS HANDS");
      expect(prompt).toContain("Save high trump");
    });

    it("should respect strategyHints option", () => {
      const promptWithHints = buildCardPlaySystemPrompt(validCards, { strategyHints: true });
      const promptWithoutHints = buildCardPlaySystemPrompt(validCards, { strategyHints: false });
      expect(promptWithHints).toContain("Strategy:");
      expect(promptWithoutHints).not.toContain("Strategy:");
    });
  });

  describe("buildDiscardSystemPrompt", () => {
    const hand = "ACE of hearts, KING of hearts, 9 of clubs";
    const trump = "hearts";

    it("should build basic prompt without reflections", () => {
      const prompt = buildDiscardSystemPrompt(hand, trump);
      expect(prompt).toContain("6 cards");
      expect(prompt).toContain("Discard one");
      expect(prompt).toContain(`Trump: ${trump}`);
      expect(prompt).toContain("METACOGNITION");
      expect(prompt).not.toContain("WHAT YOU LEARNED");
    });

    it("should include reflections when provided", () => {
      const options: PromptOptions = {
        agentReflections: {
          north: ["Never discard trump worked well."],
        },
      };
      const prompt = buildDiscardSystemPrompt(hand, trump, options, "north");
      expect(prompt).toContain("WHAT YOU LEARNED FROM PREVIOUS HANDS");
      expect(prompt).toContain("Never discard trump");
    });

    it("should respect strategyHints option", () => {
      const promptWithHints = buildDiscardSystemPrompt(hand, trump, { strategyHints: true });
      const promptWithoutHints = buildDiscardSystemPrompt(hand, trump, { strategyHints: false });
      expect(promptWithHints).toContain("Strategy:");
      expect(promptWithoutHints).not.toContain("Strategy:");
    });
  });

  describe("Reflection formatting", () => {
    it("should format multiple reflections as bullet points", () => {
      const options: PromptOptions = {
        agentReflections: {
          east: [
            "First lesson learned.",
            "Second lesson learned.",
          ],
        },
      };
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false, options, "east");
      expect(prompt).toContain("- First lesson learned.");
      expect(prompt).toContain("- Second lesson learned.");
    });

    it("should handle empty reflections array", () => {
      const options: PromptOptions = {
        agentReflections: {
          north: [],
        },
      };
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false, options, "north");
      expect(prompt).not.toContain("WHAT YOU LEARNED");
    });

    it("should handle undefined reflections", () => {
      const options: PromptOptions = {
        agentReflections: {},
      };
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false, options, "north");
      expect(prompt).not.toContain("WHAT YOU LEARNED");
    });

    it("should handle no player specified", () => {
      const options: PromptOptions = {
        agentReflections: {
          north: ["Some reflection"],
        },
      };
      // No player specified - should not include reflections
      const prompt = buildTrumpBidSystemPrompt(1, "hearts", false, options);
      expect(prompt).not.toContain("WHAT YOU LEARNED");
    });
  });
});
