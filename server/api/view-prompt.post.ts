import { formatTrumpSelectionForAI, formatGameStateForCardPlay, getValidCardsForPlay } from "../../lib/game/game";
import { buildTrumpBidSystemPrompt, buildCardPlaySystemPrompt, buildDiscardSystemPrompt, type PromptOptions } from "../services/ai-agent/prompts";
import type { GameState, Position, Card } from "../../lib/game/types";

// Format card for display in prompts
function formatCardForPrompt(card: Card): string {
  const suitSymbols: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

interface ViewPromptRequest {
  gameState: GameState;
  player: Position;
  strategyHints?: boolean;
}

interface PromptSection {
  label: string;
  content: string;
}

interface ViewPromptResponse {
  success: boolean;
  phase: string;
  decisionType: string;
  sections: PromptSection[];
  error?: string;
}

export default defineEventHandler(async (event): Promise<ViewPromptResponse> => {
  const body = await readBody<ViewPromptRequest>(event);

  if (!body.gameState || !body.player) {
    return {
      success: false,
      phase: "unknown",
      decisionType: "unknown",
      sections: [],
      error: "Missing gameState or player",
    };
  }

  const { gameState, player, strategyHints = true } = body;
  const promptOptions: PromptOptions = { strategyHints };

  try {
    const sections: PromptSection[] = [];
    let decisionType = "unknown";

    if (gameState.phase === "trump_selection") {
      // Trump bidding prompt
      const trumpSelection = gameState.trumpSelection!;
      const isDealer = player === trumpSelection.dealer;
      const bidsInRound2 = trumpSelection.bids.length > 4 ? trumpSelection.bids.length - 4 : 0;
      const isDealerMustCall = trumpSelection.round === 2 && isDealer && bidsInRound2 === 3;

      decisionType = trumpSelection.round === 1 ? "trump_bid_round_1" : "trump_bid_round_2";

      const systemPrompt = buildTrumpBidSystemPrompt(
        trumpSelection.round as 1 | 2,
        trumpSelection.turnedUpCard.suit,
        isDealerMustCall,
        promptOptions
      );

      const gameContext = formatTrumpSelectionForAI(gameState, player);

      sections.push(
        { label: "System Prompt", content: systemPrompt },
        { label: "User Message (Game Context)", content: gameContext }
      );
    } else if (gameState.phase === "playing") {
      // Card play prompt
      decisionType = "card_play";

      const playerData = gameState.players.find(p => p.position === player);
      if (!playerData) {
        throw new Error(`Player ${player} not found`);
      }

      const validCards = getValidCardsForPlay(gameState, player);
      const validCardsList = validCards.map(formatCardForPrompt).join(", ");

      const systemPrompt = buildCardPlaySystemPrompt(validCardsList, promptOptions);
      const gameContext = formatGameStateForCardPlay(gameState, player);

      sections.push(
        { label: "System Prompt", content: systemPrompt },
        { label: "User Message (Game Context)", content: gameContext },
        { label: "Valid Cards", content: validCardsList }
      );
    } else if (gameState.phase === "hand_complete" || gameState.phase === "game_complete") {
      decisionType = "none";
      sections.push({
        label: "Status",
        content: gameState.phase === "game_complete"
          ? "Game is complete. No decisions pending."
          : "Hand is complete. Waiting for next hand to start."
      });
    } else {
      decisionType = "unknown";
      sections.push({
        label: "Status",
        content: `Unknown phase: ${gameState.phase}`
      });
    }

    return {
      success: true,
      phase: gameState.phase,
      decisionType,
      sections,
    };
  } catch (error) {
    return {
      success: false,
      phase: gameState.phase,
      decisionType: "error",
      sections: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
