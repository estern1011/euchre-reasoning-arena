import type { ToolOption } from "../ai-agent/schemas";
import type { ToolRequest, ToolResult, ToolContext, ToolCallbacks } from "./types";
import { TOOL_DEFINITIONS, getToolCost } from "./types";
import { executeAskAudience } from "./ask-audience";
import { executeAskPartner } from "./ask-partner";
import { executeFiftyFifty } from "./fifty-fifty";

/**
 * Tool Registry for Metacognition Arena
 * Manages tool execution with cost tracking and streaming callbacks
 */

export { TOOL_DEFINITIONS, getToolCost };
export type { ToolRequest, ToolResult, ToolContext, ToolCallbacks };

/**
 * Execute a tool and return the result
 */
export async function executeTool(
  request: ToolRequest,
  callbacks?: ToolCallbacks,
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost(request.tool);

  // Notify that tool execution is starting
  callbacks?.onToolRequest?.({
    tool: request.tool,
    player: request.player,
    cost,
  });

  try {
    let result: ToolResult;

    switch (request.tool) {
      case "ask_audience":
        result = await executeAskAudience(request, callbacks);
        break;
      case "ask_partner":
        result = await executeAskPartner(request, callbacks);
        break;
      case "fifty_fifty":
        result = await executeFiftyFifty(request, callbacks);
        break;
      default:
        throw new Error(`Unknown tool: ${request.tool}`);
    }

    callbacks?.onToolResult?.(result);
    return result;
  } catch (error) {
    const errorResult: ToolResult = {
      tool: request.tool,
      success: false,
      result: {
        opinions: [],
        consensus: { decision: "error", agreementRate: 0 },
      },
      cost,
      duration: Date.now() - startTime,
    };
    callbacks?.onToolResult?.(errorResult);
    return errorResult;
  }
}

/**
 * Check if a tool should be used based on the request
 */
export function shouldUseTool(toolOption: ToolOption): toolOption is Exclude<ToolOption, "none"> {
  return toolOption !== "none";
}

/**
 * Build tool context from game state
 */
export function buildToolContext(
  gameState: import("../../../lib/game/types").GameState,
  player: import("../../../lib/game/types").Position,
  decisionType: "trump_bid" | "card_play" | "discard",
): ToolContext {
  const playerObj = gameState.players.find((p) => p.position === player);
  const hand = playerObj?.hand ?? [];

  const context: ToolContext = {
    gameState,
    player,
    hand,
    decisionType,
  };

  if (decisionType === "card_play" && gameState.currentTrick) {
    context.currentTrick = gameState.currentTrick.plays.map((p) => p.card);
    // Get lead suit from first play if available
    if (gameState.currentTrick.plays.length > 0) {
      context.leadSuit = gameState.currentTrick.plays[0]!.card.suit;
    }
    context.trump = gameState.trump ?? undefined;
  }

  if (decisionType === "trump_bid" && gameState.trumpSelection) {
    context.turnedUpCard = gameState.trumpSelection.turnedUpCard;
    context.biddingRound = gameState.trumpSelection.round;
    context.trump = gameState.trump ?? undefined;
  }

  return context;
}
