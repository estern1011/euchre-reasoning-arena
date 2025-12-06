import { generateObject } from "ai";
import { z } from "zod";
import type { ToolRequest, ToolResult, AskAudienceResult, AudienceOpinion, ToolCallbacks } from "./types";
import { getToolCost } from "./types";
import { getModel, getModelConfig, withRetry, createTimeout } from "../ai-agent/config";
import { formatGameStateForCardPlay, formatTrumpSelectionForAI } from "../../../lib/game/game";
import { cardToString } from "../../../lib/game/card";

/**
 * Ask Audience Tool - Poll 3 fast models for their opinions
 * Models: gpt-4o-mini, claude-3-haiku, gemini-flash
 */

const AUDIENCE_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "anthropic/claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
];

const AudienceResponseSchema = z.object({
  decision: z.string().describe("The recommended card or action (e.g., 'ace of hearts' or 'order_up')"),
  confidence: z.number().min(0).max(100).describe("How confident you are in this recommendation (0-100)"),
  briefReasoning: z.string().max(100).describe("One sentence explaining why"),
});

async function pollSingleModel(
  modelConfig: (typeof AUDIENCE_MODELS)[number],
  prompt: string,
  callbacks?: ToolCallbacks,
): Promise<AudienceOpinion | null> {
  const timeout = createTimeout();

  try {
    callbacks?.onToolProgress?.(`Asking ${modelConfig.name}...`);

    const { object } = await withRetry(
      () =>
        generateObject({
          model: getModel(modelConfig.id),
          schema: AudienceResponseSchema,
          schemaName: "AudienceResponse",
          schemaDescription: "A quick recommendation for a Euchre decision",
          ...getModelConfig(modelConfig.id),
          abortSignal: timeout.signal,
          messages: [
            {
              role: "system",
              content: `You are a quick Euchre advisor. Give a brief, confident recommendation. Keep reasoning under 100 characters.`,
            },
            { role: "user", content: prompt },
          ],
        }),
      `Audience poll ${modelConfig.name}`,
    );

    return {
      modelId: modelConfig.id,
      modelName: modelConfig.name,
      decision: object.decision,
      confidence: object.confidence,
      briefReasoning: object.briefReasoning,
    };
  } catch (error) {
    console.error(`[Ask Audience] ${modelConfig.name} failed:`, error);
    return null;
  } finally {
    timeout.cleanup();
  }
}

function buildAudiencePrompt(request: ToolRequest): string {
  const { context } = request;

  if (context.decisionType === "trump_bid") {
    const gameContext = formatTrumpSelectionForAI(context.gameState, context.player);
    return `Quick! What should I do in this trump bidding situation?\n\n${gameContext}\n\nGive your recommendation (order_up, pass, or call a suit).`;
  }

  if (context.decisionType === "card_play") {
    const gameContext = formatGameStateForCardPlay(context.gameState, context.player);
    const validCards = context.hand.map(cardToString).join(", ");
    return `Quick! Which card should I play?\n\n${gameContext}\n\nMy valid cards: ${validCards}\n\nRecommend one card.`;
  }

  if (context.decisionType === "discard") {
    const handStr = context.hand.map(cardToString).join(", ");
    return `Quick! Which card should I discard after picking up trump (${context.trump})?\n\nMy hand: ${handStr}\n\nRecommend one card to discard.`;
  }

  return "What should I do?";
}

function calculateConsensus(opinions: AudienceOpinion[]): { decision: string; agreementRate: number } {
  if (opinions.length === 0) {
    return { decision: "no_consensus", agreementRate: 0 };
  }

  // Normalize decisions (lowercase, trim)
  const normalizedDecisions = opinions.map((o) => o.decision.toLowerCase().trim());

  // Find the most common decision
  const decisionCounts = new Map<string, number>();
  for (const decision of normalizedDecisions) {
    decisionCounts.set(decision, (decisionCounts.get(decision) || 0) + 1);
  }

  let maxCount = 0;
  let consensusDecision = opinions[0]!.decision;
  for (const [decision, count] of decisionCounts) {
    if (count > maxCount) {
      maxCount = count;
      // Find the original casing from opinions
      consensusDecision = opinions.find((o) => o.decision.toLowerCase().trim() === decision)?.decision ?? decision;
    }
  }

  const agreementRate = (maxCount / opinions.length) * 100;

  return { decision: consensusDecision, agreementRate };
}

export async function executeAskAudience(
  request: ToolRequest,
  callbacks?: ToolCallbacks,
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("ask_audience");

  callbacks?.onToolProgress?.("Polling the audience...");

  const prompt = buildAudiencePrompt(request);

  // Poll all models in parallel
  const results = await Promise.all(
    AUDIENCE_MODELS.map((model) => pollSingleModel(model, prompt, callbacks)),
  );

  // Filter out failed polls
  const opinions = results.filter((r): r is AudienceOpinion => r !== null);

  callbacks?.onToolProgress?.(`Got ${opinions.length} responses`);

  const consensus = calculateConsensus(opinions);

  const result: AskAudienceResult = {
    opinions,
    consensus,
  };

  return {
    tool: "ask_audience",
    success: opinions.length > 0,
    result,
    cost,
    duration: Date.now() - startTime,
  };
}
