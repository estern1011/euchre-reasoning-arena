import {
  createNewGame,
  makeTrumpBid,
  dealerDiscard,
  playCard,
  getNextPlayer,
  isGameComplete,
} from "../../lib/game/game";
import type {
  Position,
  TrumpBidAction,
} from "../../lib/game/types";
import { getDefaultModelIdsArray } from "../../lib/config/defaults";
import { PlayNextRoundRequestSchema } from "../schemas/game-schemas";

/**
 * SSE streaming endpoint for real-time AI reasoning
 */

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event);

  // Validate request body with Zod
  const parseResult = PlayNextRoundRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: parseResult.error.flatten(),
    });
  }

  const body = parseResult.data;

  // Create new game if no game state provided
  let game = body.gameState;
  if (!game) {
    const modelIds = body.modelIds || getDefaultModelIdsArray();
    game = createNewGame(modelIds);
  }

  const decisions: any[] = [];

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send SSE message
      const sendEvent = (type: string, data: any) => {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Determine what phase we're in
        if (game.phase === "trump_selection") {
          const round = game.trumpSelection!.round;
          const bidsNeeded = 4;
          const currentRoundBids =
            round === 1
              ? game.trumpSelection!.bids.filter(
                  (b: { action: TrumpBidAction }) =>
                    b.action === "order_up" || b.action === "pass"
                )
              : game.trumpSelection!.bids.slice(4);

          for (let i = currentRoundBids.length; i < bidsNeeded; i++) {
            const currentBidder = game.trumpSelection!.currentBidder;
            const playerObj = game.players.find(
              (p: { position: Position }) => p.position === currentBidder
            )!;

            sendEvent("player_thinking", {
              player: currentBidder,
              modelId: playerObj.modelId,
            });

            const { makeTrumpBidDecisionStreaming } = await import("../services/ai-agent");

            const bidResult = await makeTrumpBidDecisionStreaming(
              game,
              currentBidder,
              playerObj.modelId,
              (token) => {
                sendEvent("reasoning_token", {
                  player: currentBidder,
                  token,
                });
              }
            );
            sendEvent("decision_made", {
              player: currentBidder,
              modelId: playerObj.modelId,
              action: bidResult.action,
              suit: bidResult.suit,
              goingAlone: bidResult.goingAlone,
              reasoning: bidResult.reasoning,
              duration: bidResult.duration,
            });

            const aiDecision = {
              player: currentBidder,
              modelId: playerObj.modelId,
              action: bidResult.action,
              suit: bidResult.suit,
              goingAlone: bidResult.goingAlone,
              reasoning: bidResult.reasoning,
              duration: bidResult.duration,
            };

            decisions.push(aiDecision);

            game = makeTrumpBid(
              game,
              currentBidder,
              aiDecision.action,
              aiDecision.suit,
              aiDecision.goingAlone,
              aiDecision.reasoning
            );

            // If trump was set and dealer has 6 cards, they need to discard
            if (game.phase === "playing") {
              const dealerObj = game.players.find(
                (p: { position: Position }) => p.position === game.dealer
              )!;

              if (dealerObj.hand.length === 6) {
                // Dealer needs to discard
                sendEvent("player_thinking", {
                  player: game.dealer,
                  modelId: dealerObj.modelId,
                  action: "discard",
                });

                const { makeDiscardDecisionStreaming } = await import("../services/ai-agent");

                const discardResult = await makeDiscardDecisionStreaming(
                  game,
                  dealerObj.modelId,
                  (token) => {
                    sendEvent("reasoning_token", {
                      player: game.dealer,
                      token,
                    });
                  }
                );

                sendEvent("decision_made", {
                  player: game.dealer,
                  modelId: dealerObj.modelId,
                  action: "discard",
                  card: discardResult.card,
                  reasoning: discardResult.reasoning,
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

                game = dealerDiscard(game, discardResult.card);
              }

              break;
            }
          }

          const roundSummary = `Trump selection round ${round} complete. ${
            game.phase === "playing"
              ? `${game.trumpCaller} called ${game.trump} as trump${game.goingAlone ? " and is going alone" : ""}`
              : round === 1
                ? "All passed, moving to round 2"
                : "Round 2 complete"
          }`;

          sendEvent("round_complete", {
            gameState: game,
            phase:
              round === 1 ? "trump_selection_round_1" : "trump_selection_round_2",
            decisions,
            roundSummary,
          });
        } else if (game.phase === "playing") {
          const expectedPlays = game.goingAlone ? 3 : 4;

          for (let i = 0; i < expectedPlays; i++) {
            const currentPlayer = getNextPlayer(game);
            const playerObj = game.players.find(
              (p: { position: Position }) => p.position === currentPlayer
            )!;

            sendEvent("player_thinking", {
              player: currentPlayer,
              modelId: playerObj.modelId,
            });

            const { makeCardPlayDecisionStreaming } = await import("../services/ai-agent");

            const playResult = await makeCardPlayDecisionStreaming(
              game,
              currentPlayer,
              playerObj.modelId,
              (token) => {
                sendEvent("reasoning_token", {
                  player: currentPlayer,
                  token,
                });
              }
            );

            // Send illegal attempt event if one occurred
            if (playResult.illegalAttempt) {
              sendEvent("illegal_attempt", {
                player: currentPlayer,
                modelId: playerObj.modelId,
                attemptedCard: playResult.illegalAttempt.card,
                isFallback: playResult.isFallback,
              });
            }

            sendEvent("decision_made", {
              player: currentPlayer,
              modelId: playerObj.modelId,
              card: playResult.card,
              reasoning: playResult.reasoning,
              duration: playResult.duration,
              illegalAttempt: playResult.illegalAttempt,
              isFallback: playResult.isFallback,
            });

            const aiDecision = {
              player: currentPlayer,
              modelId: playerObj.modelId,
              card: playResult.card,
              reasoning: playResult.reasoning,
              duration: playResult.duration,
            };

            decisions.push(aiDecision);

            game = playCard(
              game,
              currentPlayer,
              playResult.card,
              aiDecision.reasoning
            );
          }

          const lastTrick = game.completedTricks[game.completedTricks.length - 1];
          const trickWinner = lastTrick.winner as Position;
          const roundSummary = `Trick ${game.completedTricks.length} complete. Winner: ${trickWinner}`;

          if (isGameComplete(game)) {
            const finalState = { ...game, phase: "complete" as const };
            sendEvent("round_complete", {
              gameState: finalState,
              phase: "game_complete",
              decisions,
              roundSummary: `Game complete. Final score: Team 0: ${finalState.scores[0]}, Team 1: ${finalState.scores[1]}`,
              trickWinner,
            });
          } else {
            sendEvent("round_complete", {
              gameState: game,
              phase: "playing_trick",
              decisions,
              roundSummary,
              trickWinner,
            });
          }
        } else {
          sendEvent("round_complete", {
            gameState: game,
            phase: "game_complete",
            decisions: [],
            roundSummary: `Game complete. Final score: Team 0: ${game.scores[0]}, Team 1: ${game.scores[1]}`,
          });
        }

        controller.close();
      } catch (error: any) {
        console.error('SSE Stream Error:', error);
        const errorMessage = `data: ${JSON.stringify({
          type: "error",
          message: error.message || "An error occurred",
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    },
  });

  // Return the stream with proper headers
  return sendStream(event, stream);
});
