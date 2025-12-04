import { computed } from "vue";
import { useGameStore } from "../stores/game";
import type { Card, Position } from "../../lib/game/types";

/**
 * Card display composable
 * Handles display logic for played cards in the current trick
 */

export interface PlayedCards {
  north: Card | null;
  east: Card | null;
  south: Card | null;
  west: Card | null;
  center: Card | null;
}

export function useCardDisplay() {
  const gameStore = useGameStore();

  /**
   * Get played cards from the current trick
   * Returns cards mapped to their positions in the diamond formation
   */
  const playedCards = computed<PlayedCards>(() => {
    const emptyCards: PlayedCards = {
      north: null,
      east: null,
      south: null,
      west: null,
      center: null,
    };

    if (!gameStore.gameState?.currentTrick) {
      return emptyCards;
    }

    const trick = gameStore.gameState.currentTrick;
    const cards: PlayedCards = { ...emptyCards };

    // Map each play to its position
    trick.plays.forEach((play) => {
      cards[play.player] = play.card;
    });

    // Determine center card (lead card or winning card)
    if (trick.plays.length > 0) {
      const leadPlay = trick.plays[0];
      cards.center = leadPlay.card;
    }

    return cards;
  });

  /**
   * Get the lead card of the current trick
   */
  const leadCard = computed<Card | null>(() => {
    if (!gameStore.gameState?.currentTrick || gameStore.gameState.currentTrick.plays.length === 0) {
      return null;
    }
    return gameStore.gameState.currentTrick.plays[0].card;
  });

  /**
   * Get the lead player of the current trick
   */
  const leadPlayer = computed<Position | null>(() => {
    return gameStore.gameState?.currentTrick?.leadPlayer || null;
  });

  /**
   * Check if a position has played a card in the current trick
   */
  function hasPlayedCard(position: Position): boolean {
    if (!gameStore.gameState?.currentTrick) return false;
    return gameStore.gameState.currentTrick.plays.some(
      (play) => play.player === position,
    );
  }

  /**
   * Get the card played by a specific position
   */
  function getCardForPosition(position: Position): Card | null {
    if (!gameStore.gameState?.currentTrick) return null;
    const play = gameStore.gameState.currentTrick.plays.find(
      (p) => p.player === position,
    );
    return play?.card || null;
  }

  /**
   * Get player's hand cards
   */
  function getPlayerHand(position: Position): Card[] {
    if (!gameStore.gameState) return [];
    const player = gameStore.gameState.players.find((p) => p.position === position);
    return player?.hand || [];
  }

  /**
   * Check if the current trick is complete
   */
  const isTrickComplete = computed(() => {
    if (!gameStore.gameState?.currentTrick) return false;
    const expectedPlays = gameStore.gameState.goingAlone ? 3 : 4;
    return gameStore.gameState.currentTrick.plays.length >= expectedPlays;
  });

  return {
    // Computed
    playedCards,
    leadCard,
    leadPlayer,
    isTrickComplete,

    // Functions
    hasPlayedCard,
    getCardForPosition,
    getPlayerHand,
  };
}
