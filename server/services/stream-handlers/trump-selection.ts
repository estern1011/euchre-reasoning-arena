import type { Position, TrumpBidAction, GameState } from "../../../lib/game/types";
import { makeTrumpBid, dealerDiscard } from "../../../lib/game/game";
import type { StreamContext, PhaseResult, DecisionRecord } from "./types";

/**
 * Handle trump selection phase (rounds 1 and 2)
 * Processes all bids until trump is called or round ends
 */
export async function handleTrumpSelection(ctx: StreamContext): Promise<PhaseResult> {
  let game = ctx.game;
  const decisions: DecisionRecord[] = [];

  if (!game.trumpSelection) {
    throw new Error("Trump selection phase not initialized");
  }

  const round = game.trumpSelection.round;
  const bidsNeeded = 4;

  const currentRoundBids =
    round === 1
      ? game.trumpSelection.bids.filter(
          (b: { action: TrumpBidAction }) =>
            b.action === "order_up" || b.action === "pass"
        )
      : game.trumpSelection.bids.slice(4);

  for (let i = currentRoundBids.length; i < bidsNeeded; i++) {
    if (!game.trumpSelection) {
      throw new Error("Trump selection phase not initialized during bidding");
    }

    const currentBidder = game.trumpSelection.currentBidder;
    const playerObj = game.players.find(
      (p: { position: Position }) => p.position === currentBidder
    );

    if (!playerObj) {
      throw new Error(`Player not found for position: ${currentBidder}`);
    }

    ctx.sendEvent("player_thinking", {
      player: currentBidder,
      modelId: playerObj.modelId,
    });

    const { makeTrumpBidDecisionStreaming } = await import("../ai-agent");

    const bidResult = await makeTrumpBidDecisionStreaming(
      game,
      currentBidder,
      playerObj.modelId,
      (token) => {
        ctx.sendEvent("reasoning_token", {
          player: currentBidder,
          token,
        });
      },
      undefined, // customPrompt
      ctx.promptOptions
    );

    ctx.sendEvent("decision_made", {
      player: currentBidder,
      modelId: playerObj.modelId,
      action: bidResult.action,
      suit: bidResult.suit,
      goingAlone: bidResult.goingAlone,
      reasoning: bidResult.reasoning,
      confidence: bidResult.confidence,
      duration: bidResult.duration,
    });

    decisions.push({
      player: currentBidder,
      modelId: playerObj.modelId,
      action: bidResult.action,
      suit: bidResult.suit,
      goingAlone: bidResult.goingAlone,
      reasoning: bidResult.reasoning,
      duration: bidResult.duration,
    });

    game = makeTrumpBid(
      game,
      currentBidder,
      bidResult.action,
      bidResult.suit,
      bidResult.goingAlone,
      bidResult.reasoning
    );

    // If trump was set and dealer has 6 cards, they need to discard
    if (game.phase === "playing") {
      game = await handleDealerDiscard(ctx, game, decisions);
      break;
    }
  }

  // Send structured data for trump selection round completion
  ctx.sendEvent("round_complete", {
    gameState: game,
    phase: round === 1 ? "trump_selection_round_1" : "trump_selection_round_2",
    decisions,
    trumpSelectionResult:
      game.phase === "playing"
        ? {
            trumpCaller: game.trumpCaller,
            trump: game.trump,
            goingAlone: game.goingAlone || null,
          }
        : null,
    allPassed: game.phase !== "playing",
    selectionRound: round,
  });

  return { game, decisions };
}

/**
 * Handle dealer discard when they pick up the turned card
 */
async function handleDealerDiscard(
  ctx: StreamContext,
  game: GameState,
  decisions: DecisionRecord[]
): Promise<GameState> {
  const dealerObj = game.players.find(
    (p: { position: Position }) => p.position === game.dealer
  );

  if (!dealerObj) {
    throw new Error(`Dealer not found for position: ${game.dealer}`);
  }

  if (dealerObj.hand.length !== 6) {
    return game;
  }

  ctx.sendEvent("player_thinking", {
    player: game.dealer,
    modelId: dealerObj.modelId,
    action: "discard",
  });

  const { makeDiscardDecisionStreaming } = await import("../ai-agent");

  const discardResult = await makeDiscardDecisionStreaming(
    game,
    dealerObj.modelId,
    (token) => {
      ctx.sendEvent("reasoning_token", {
        player: game.dealer,
        token,
      });
    },
    ctx.promptOptions
  );

  ctx.sendEvent("decision_made", {
    player: game.dealer,
    modelId: dealerObj.modelId,
    action: "discard",
    card: discardResult.card,
    reasoning: discardResult.reasoning,
    confidence: discardResult.confidence,
    duration: discardResult.duration,
  });

  decisions.push({
    player: game.dealer,
    modelId: dealerObj.modelId,
    action: "discard",
    card: discardResult.card,
    reasoning: discardResult.reasoning,
    duration: discardResult.duration,
  });

  return dealerDiscard(game, discardResult.card);
}
