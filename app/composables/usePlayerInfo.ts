import { computed } from "vue";
import { useGameStore } from "../stores/game";
import type { Position } from "../../lib/game/types";

/**
 * Player information composable
 * Handles player model names, current player detection, and team info
 */

export function usePlayerInfo() {
  const gameStore = useGameStore();

  /**
   * Get model ID for a specific position
   */
  function getModelId(position: Position): string {
    if (!gameStore.gameState) return "";
    const player = gameStore.gameState.players.find((p: { position: Position }) => p.position === position);
    return player?.modelId || "";
  }

  /**
   * Get formatted model name for display
   * Converts "google/gemini-2.5-flash" to "GEMINI-2.5-FLASH"
   */
  function getFormattedModelName(position: Position): string {
    const modelId = getModelId(position);
    if (!modelId) return "";

    // Remove provider prefix and convert to uppercase
    const parts = modelId.split("/");
    const modelName = parts.length > 1 ? parts[1]! : parts[0]!;
    return modelName.toUpperCase();
  }

  /**
   * Get team number for a position
   */
  function getTeam(position: Position): 0 | 1 | null {
    if (!gameStore.gameState) return null;
    const player = gameStore.gameState.players.find((p: { position: Position }) => p.position === position);
    return player?.team ?? null;
  }

  /**
   * Get current player who needs to make a decision
   */
  const currentPlayer = computed<Position | null>(() => {
    if (!gameStore.gameState) return null;

    // During trump selection, use the current bidder
    if (gameStore.gameState.phase === "trump_selection") {
      return gameStore.gameState.trumpSelection?.currentBidder ?? null;
    }

    // During playing, determine next player based on current trick
    if (gameStore.gameState.phase === "playing") {
      const trick = gameStore.gameState.currentTrick;
      if (!trick) return null;

      const expectedPlays = gameStore.gameState.goingAlone ? 3 : 4;
      if (trick.plays.length >= expectedPlays) {
        return null; // Trick is complete
      }

      // If no plays yet, lead player plays first
      if (trick.plays.length === 0) {
        return trick.leadPlayer;
      }

      // Determine next player in rotation
      const positions: Position[] = ["north", "east", "south", "west"];
      const leadIndex = positions.indexOf(trick.leadPlayer);
      const nextIndex = (leadIndex + trick.plays.length) % 4;
      const nextPlayer = positions[nextIndex];
      if (!nextPlayer) return null;

      // Skip if player's partner is going alone
      const goingAlonePosition = gameStore.gameState.goingAlone;
      if (goingAlonePosition) {
        const alonePlayer = gameStore.gameState.players.find(
          (p: { position: Position }) => p.position === goingAlonePosition,
        );
        if (alonePlayer) {
          const partnerTeam = alonePlayer.team;
          const nextPlayerObj = gameStore.gameState.players.find(
            (p: { position: Position }) => p.position === nextPlayer,
          );
          if (nextPlayerObj?.team === partnerTeam && nextPlayer !== goingAlonePosition) {
            // This player sits out, find next player
            const afterNextIndex = (nextIndex + 1) % 4;
            return positions[afterNextIndex] ?? null;
          }
        }
      }

      return nextPlayer;
    }

    return null;
  });

  /**
   * Check if a specific position is the current player
   */
  function isCurrentPlayer(position: Position): boolean {
    return currentPlayer.value === position;
  }

  /**
   * Get all model IDs mapped by position
   */
  const modelsByPosition = computed(() => ({
    north: getModelId("north"),
    east: getModelId("east"),
    south: getModelId("south"),
    west: getModelId("west"),
  }));

  /**
   * Get all formatted model names mapped by position
   */
  const formattedModelsByPosition = computed(() => ({
    north: getFormattedModelName("north"),
    east: getFormattedModelName("east"),
    south: getFormattedModelName("south"),
    west: getFormattedModelName("west"),
  }));

  /**
   * Get dealer position
   */
  const dealer = computed<Position | null>(() => gameStore.gameState?.dealer || null);

  /**
   * Get trump caller position
   */
  const trumpCaller = computed<Position | null>(() => gameStore.gameState?.trumpCaller || null);

  /**
   * Get player going alone (if any)
   */
  const goingAlone = computed<Position | null>(() => gameStore.gameState?.goingAlone || null);

  return {
    // Functions
    getModelId,
    getFormattedModelName,
    getTeam,
    isCurrentPlayer,

    // Computed
    currentPlayer,
    modelsByPosition,
    formattedModelsByPosition,
    dealer,
    trumpCaller,
    goingAlone,
  };
}
