import {
  createNewGame,
  makeTrumpBid,
  playCard,
  getNextPlayer,
  isGameComplete,
} from "../../lib/game/game";
import type {
  GameState,
  Position,
  Suit,
  TrumpBidAction,
} from "../../lib/game/types";
import { PlayNextRoundRequestSchema } from "../schemas/game-schemas";
import { getDefaultModelIdsArray } from "../../lib/config/defaults";

/**
 * API endpoint to advance the game by one round
 * Handles:
 * - Trump selection round 1 (order up or pass)
 * - Trump selection round 2 (call trump or pass)
 * - Playing one trick (all 4 or 3 players play a card)
 */

interface AIDecision {
  player: Position;
  modelId: string;
  reasoning: string;
  duration: number; // Response time in ms
}

interface TrumpBidDecision extends AIDecision {
  action: TrumpBidAction;
  suit?: Suit;
  goingAlone: boolean;
}

interface CardPlayDecision extends AIDecision {
  card: { suit: Suit; rank: string };
}

interface PlayNextRoundResponse {
  gameState: GameState;
  phase:
    | "trump_selection_round_1"
    | "trump_selection_round_2"
    | "playing_trick"
    | "game_complete";
  decisions: (TrumpBidDecision | CardPlayDecision)[];
  roundSummary: string;
}

export default defineEventHandler(
  async (event): Promise<PlayNextRoundResponse> => {
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

    const decisions: (TrumpBidDecision | CardPlayDecision)[] = [];

    // Determine what phase we're in
    if (game.phase === "trump_selection") {
      // Trump selection phase
      const round = game.trumpSelection!.round;
      const phase =
        round === 1 ? "trump_selection_round_1" : "trump_selection_round_2";

      // Get all 4 bids for this round
      const bidsNeeded = 4;
      const currentRoundBids =
        round === 1
          ? game.trumpSelection!.bids.filter(
              (b: { action: TrumpBidAction }) =>
                b.action === "order_up" || b.action === "pass",
            )
          : game.trumpSelection!.bids.slice(4); // Round 2 bids

      for (let i = currentRoundBids.length; i < bidsNeeded; i++) {
        const currentBidder = game.trumpSelection!.currentBidder;

        // Call AI model to make bid decision
        const playerObj = game.players.find(
          (p: { position: Position }) => p.position === currentBidder,
        )!;
        const { makeTrumpBidDecision } = await import("../services/ai-agent");

        const bidResult = await makeTrumpBidDecision(
          game,
          currentBidder,
          playerObj.modelId,
        );

        const aiDecision: TrumpBidDecision = {
          player: currentBidder,
          modelId: playerObj.modelId,
          action: bidResult.action,
          suit: bidResult.suit,
          goingAlone: bidResult.goingAlone,
          reasoning: bidResult.reasoning,
          duration: bidResult.duration,
        };

        decisions.push(aiDecision);

        // Apply the bid
        game = makeTrumpBid(
          game,
          currentBidder,
          aiDecision.action,
          aiDecision.suit,
          aiDecision.goingAlone,
          aiDecision.reasoning,
        );

        // If someone called trump or ordered up, break early
        if (game.phase === "playing") {
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

      return {
        gameState: game,
        phase,
        decisions,
        roundSummary,
      };
    } else if (game.phase === "playing") {
      // Playing phase - play one trick
      const expectedPlays = game.goingAlone ? 3 : 4;

      for (let i = 0; i < expectedPlays; i++) {
        const currentPlayer = getNextPlayer(game);

        // Call AI model to select card
        const playerObj = game.players.find(
          (p: { position: Position }) => p.position === currentPlayer,
        )!;
        const { makeCardPlayDecision } = await import("../services/ai-agent");

        const playResult = await makeCardPlayDecision(
          game,
          currentPlayer,
          playerObj.modelId,
        );

        const aiDecision: CardPlayDecision = {
          player: currentPlayer,
          modelId: playerObj.modelId,
          card: playResult.card,
          reasoning: playResult.reasoning,
          duration: playResult.duration,
        };

        decisions.push(aiDecision);

        // Play the card
        game = playCard(
          game,
          currentPlayer,
          playResult.card,
          aiDecision.reasoning,
        );
      }

      const lastTrick = game.completedTricks[game.completedTricks.length - 1]!;
      const roundSummary = `Trick ${game.completedTricks.length} complete. Winner: ${lastTrick.winner}`;

      if (isGameComplete(game)) {
        const finalState = { ...game, phase: "game_complete" as const };
        return {
          gameState: finalState,
          phase: "game_complete",
          decisions,
          roundSummary: `Game complete. Final score: Team 0: ${finalState.scores[0]}, Team 1: ${finalState.scores[1]}`,
        };
      }

      return {
        gameState: game,
        phase: "playing_trick",
        decisions,
        roundSummary,
      };
    }

    // Game is complete
    return {
      gameState: game,
      phase: "game_complete",
      decisions: [],
      roundSummary: `Game complete. Final score: Team 0: ${game.scores[0]}, Team 1: ${game.scores[1]}`,
    };
  },
);
