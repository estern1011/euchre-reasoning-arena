import {
  createNewGame,
  makeTrumpBid,
  dealerDiscard,
  playCard,
  getNextPlayer,
} from "../../lib/game/game";
import type {
  GameState,
  Position,
  TrumpBidAction,
} from "../../lib/game/types";
import { getDefaultModelIdsArray } from "../../lib/config/defaults";
import { PlayNextRoundRequestSchema } from "../schemas/game-schemas";
import {
  ensureTracking,
  logTrumpBidDecision,
  logDiscardDecision,
  logCardPlayDecision,
  updateTrickOutcomes,
  updateTrumpBidOutcomes,
  startNewHand,
  completeHandTracking,
  completeGameTracking,
  type TrackedGameState,
} from "../services/game-tracker";

/**
 * SSE streaming endpoint for real-time AI reasoning
 * Returns pure structured data - frontend handles display formatting
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

  // Initialize game state - always defined after this point
  const initialGame: GameState = body.gameState
    ? (body.gameState as GameState)
    : createNewGame(body.modelIds || getDefaultModelIdsArray());

  // Use a mutable reference for game state updates with tracking
  let game: TrackedGameState = ensureTracking(initialGame, body.presetName);

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
              confidence: bidResult.confidence,
              duration: bidResult.duration,
            });

            // Log trump bid to database
            logTrumpBidDecision(game, currentBidder, playerObj.modelId, {
              action: bidResult.action,
              suit: bidResult.suit,
              goingAlone: bidResult.goingAlone,
              reasoning: bidResult.reasoning,
              confidence: bidResult.confidence,
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
              // Update trump bid outcomes - maker's bid was successful
              if (game.trumpCaller) {
                updateTrumpBidOutcomes(game, game.trumpCaller);
              }

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
                  confidence: discardResult.confidence,
                  duration: discardResult.duration,
                });

                // Log discard to database
                logDiscardDecision(game, game.dealer, dealerObj.modelId, {
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

                game = dealerDiscard(game, discardResult.card);
              }

              break;
            }
          }

          // Send structured data for trump selection round completion
          sendEvent("round_complete", {
            gameState: game,
            phase: round === 1 ? "trump_selection_round_1" : "trump_selection_round_2",
            decisions,
            // Structured data instead of formatted string
            trumpSelectionResult: game.phase === "playing" ? {
              trumpCaller: game.trumpCaller,
              trump: game.trump,
              goingAlone: game.goingAlone || null,
            } : null,
            allPassed: game.phase !== "playing",
            selectionRound: round,
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

            // Tool callbacks for Metacognition Arena
            const toolCallbacks = {
              onToolRequest: (request: { tool: string; player: Position; cost: number }) => {
                sendEvent("tool_request", {
                  player: currentPlayer,
                  modelId: playerObj.modelId,
                  tool: request.tool,
                  cost: request.cost,
                });
              },
              onToolProgress: (message: string) => {
                sendEvent("tool_progress", {
                  player: currentPlayer,
                  message,
                });
              },
              onToolResult: (result: any) => {
                sendEvent("tool_result", {
                  player: currentPlayer,
                  tool: result.tool,
                  result: result.result,
                  cost: result.cost,
                  duration: result.duration,
                });
              },
              onResponsePhase: () => {
                sendEvent("response_phase", {
                  player: currentPlayer,
                });
              },
            };

            const playResult = await makeCardPlayDecisionStreaming(
              game,
              currentPlayer,
              playerObj.modelId,
              (token) => {
                sendEvent("reasoning_token", {
                  player: currentPlayer,
                  token,
                });
              },
              undefined, // customPrompt
              toolCallbacks,
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
              confidence: playResult.confidence,
              duration: playResult.duration,
              illegalAttempt: playResult.illegalAttempt,
              isFallback: playResult.isFallback,
              toolUsed: playResult.toolUsed,
            });

            // Log card play to database
            logCardPlayDecision(game, currentPlayer, playerObj.modelId, {
              card: playResult.card,
              reasoning: playResult.reasoning,
              confidence: playResult.confidence,
              duration: playResult.duration,
              toolUsed: playResult.toolUsed?.tool, // Extract tool name from ToolResult
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
          if (!lastTrick) {
            throw new Error("No completed trick found after playing cards");
          }
          const trickWinner = lastTrick.winner as Position;
          const trickNumber = game.completedTricks.length;

          // Update decision outcomes now that we know who won the trick
          updateTrickOutcomes(game, trickWinner, trickNumber);

          // Check if this trick completed a hand or game
          if (game.phase === "game_complete") {
            // Complete hand tracking first
            completeHandTracking(
              game,
              game.scores[0],
              game.scores[1],
              game.scores[0], // Last hand points = tricks won
              game.scores[1]
            );

            // Complete game tracking with calibration calculation
            completeGameTracking(game, game.gameScores[0], game.gameScores[1]);

            // Game is fully complete - a team reached the winning score
            sendEvent("round_complete", {
              gameState: game,
              phase: "game_complete",
              decisions,
              trickWinner,
              trickNumber,
              handScores: game.scores,
              gameScores: game.gameScores,
              handNumber: game.handNumber,
              winningTeam: game.gameScores[0] > game.gameScores[1] ? 0 : 1,
            });
          } else if (game.phase === "hand_complete") {
            // Complete hand tracking
            completeHandTracking(
              game,
              game.scores[0],
              game.scores[1],
              game.scores[0],
              game.scores[1]
            );

            // Hand is complete but game continues
            sendEvent("round_complete", {
              gameState: game,
              phase: "hand_complete",
              decisions,
              trickWinner,
              trickNumber,
              handScores: game.scores,
              gameScores: game.gameScores,
              handNumber: game.handNumber,
            });
          } else {
            // Normal trick complete, hand continues
            sendEvent("round_complete", {
              gameState: game,
              phase: "playing_trick",
              decisions,
              trickWinner,
              trickNumber,
            });
          }
        } else if (game.phase === "hand_complete") {
          // Hand is complete, need to start a new hand
          // Start tracking new hand in database
          game = startNewHand(game);

          sendEvent("round_complete", {
            gameState: game,
            phase: "hand_complete",
            decisions: [],
            handScores: game.scores,
            gameScores: game.gameScores,
            handNumber: game.handNumber,
          });
        } else if (game.phase === "game_complete") {
          // Complete game tracking if not already done
          completeGameTracking(game, game.gameScores[0], game.gameScores[1]);

          // Game is complete
          sendEvent("round_complete", {
            gameState: game,
            phase: "game_complete",
            decisions: [],
            gameScores: game.gameScores,
            winningTeam: game.gameScores[0] > game.gameScores[1] ? 0 : 1,
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
