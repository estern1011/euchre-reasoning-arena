import { generateObject } from "ai";
import { z } from "zod";
import type { ToolRequest, ToolResult, AskPartnerResult, ToolCallbacks } from "./types";
import { getToolCost } from "./types";
import { getModel, getModelConfig, withRetry, createTimeout } from "../ai-agent/config";
import { formatGameStateForCardPlay, formatTrumpSelectionForAI } from "../../../lib/game/game";
import { cardToString } from "../../../lib/game/card";
import type { Position } from "../../../lib/game/types";

/**
 * Ask Partner Tool - Request advice from your teammate
 *
 * The partner can see the game state (current trick, trump, etc.) but NOT the requesting agent's hand.
 * This simulates legal table talk in some Euchre variants.
 */

const PARTNER_POSITIONS: Record<Position, Position> = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

const PartnerAdviceSchema = z.object({
  advice: z.string().describe("Your advice to your partner"),
  confidence: z.number().min(0).max(100).describe("How confident you are in this advice (0-100)"),
  reasoning: z.string().describe("Brief explanation of your reasoning"),
});

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

function getPartnerPosition(playerPosition: Position): Position {
  return PARTNER_POSITIONS[playerPosition];
}

function getModelDisplayName(modelId: string): string {
  // Extract a friendly name from the model ID
  const parts = modelId.split("/");
  const name = parts[parts.length - 1] ?? modelId;
  // Capitalize and clean up
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .substring(0, 30);
}

function buildPartnerPrompt(request: ToolRequest, partnerPosition: Position): string {
  const { context } = request;

  // Build context WITHOUT showing the requesting player's hand
  let gameContext: string;

  if (context.decisionType === "trump_bid") {
    // For trump bidding, show the turned-up card and bidding state
    gameContext = formatTrumpSelectionForAI(context.gameState, partnerPosition);
  } else {
    // For card play, show the trick state
    gameContext = formatGameStateForCardPlay(context.gameState, partnerPosition);
  }

  const situationDesc = context.decisionType === "trump_bid"
    ? "trump bidding decision"
    : context.decisionType === "discard"
      ? "which card to discard"
      : "which card to play";

  return `Your partner (${request.player}) is asking for your advice on their ${situationDesc}.

IMPORTANT: You CANNOT see your partner's hand. Give advice based on what you know:
- The current game state
- Your own hand (if applicable)
- General Euchre strategy

Game State:
${gameContext}

What advice would you give your partner? Be concise and strategic.`;
}

export async function executeAskPartner(
  request: ToolRequest,
  callbacks?: ToolCallbacks,
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("ask_partner");

  const partnerPosition = getPartnerPosition(request.player);
  const partnerPlayer = request.context.gameState.players.find(
    (p) => p.position === partnerPosition
  );

  if (!partnerPlayer) {
    return {
      tool: "ask_partner",
      success: false,
      result: {
        partnerPosition,
        partnerModelId: "unknown",
        partnerModelName: "Unknown",
        question: "What should I do?",
        partnerAdvice: "Partner not found",
        partnerConfidence: 0,
      },
      cost,
      duration: Date.now() - startTime,
    };
  }

  const partnerModelId = partnerPlayer.modelId;
  const partnerModelName = getModelDisplayName(partnerModelId);

  callbacks?.onToolProgress?.(`Asking ${partnerModelName} for advice...`);

  const timeout = createTimeout();

  try {
    const prompt = buildPartnerPrompt(request, partnerPosition);

    const { object } = await withRetry(
      () =>
        generateObject({
          model: getModel(partnerModelId),
          schema: PartnerAdviceSchema,
          schemaName: "PartnerAdvice",
          schemaDescription: "Advice from partner in Euchre",
          ...getModelConfig(partnerModelId),
          abortSignal: timeout.signal,
          messages: [
            {
              role: "system",
              content: `You are playing Euchre and your partner is asking for advice.
Give helpful, strategic advice. Be concise - you're at a card table, not writing an essay.
Remember: You cannot see your partner's hand, so give general strategic guidance.`,
            },
            { role: "user", content: prompt },
          ],
        }),
      `Ask Partner ${partnerModelName}`,
    );

    callbacks?.onToolProgress?.(`${partnerModelName} responded`);

    const result: AskPartnerResult = {
      partnerPosition,
      partnerModelId,
      partnerModelName,
      question: "What should I do?",
      partnerAdvice: truncate(object.advice, 200),
      partnerConfidence: object.confidence,
    };

    return {
      tool: "ask_partner",
      success: true,
      result,
      cost,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[Ask Partner] ${partnerModelName} failed:`, error);
    return {
      tool: "ask_partner",
      success: false,
      result: {
        partnerPosition,
        partnerModelId,
        partnerModelName,
        question: "What should I do?",
        partnerAdvice: "Partner was unable to respond",
        partnerConfidence: 0,
      },
      cost,
      duration: Date.now() - startTime,
    };
  } finally {
    timeout.cleanup();
  }
}
