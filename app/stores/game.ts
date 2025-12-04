import { defineStore } from 'pinia'
import type { GameState, Position, Card } from '../../lib/game/types'
import { formatSuit } from '../../lib/game/formatting'
import { DEFAULT_MODEL_IDS } from '../../lib/config/defaults'

export type ViewMode = 'arena' | 'intelligence'

export const useGameStore = defineStore('game', {
  state: () => ({
    gameState: null as GameState | null,
    modelIds: { ...DEFAULT_MODEL_IDS },
    isInitialized: false,
    viewMode: 'arena' as ViewMode,

    // Streaming state
    isStreaming: false,
    currentThinkingPlayer: null as Position | null,
    displayedReasoningPlayer: null as Position | null, // Player whose reasoning is shown (persists)
    streamingReasoning: {} as Record<Position, string>,
    streamingPlayedCards: {
      north: null,
      east: null,
      south: null,
      west: null,
    } as Record<Position, Card | null>,
    // Cards played this round (to remove from visible hands)
    cardsPlayedThisRound: [] as Array<{ player: Position; card: Card }>,
    lastTrickWinner: null as Position | null,
  }),

  getters: {
    trump: (state) => state.gameState?.trump || null,
    scores: (state) => state.gameState?.scores || [0, 0],
    phase: (state) => state.gameState?.phase || 'trump_selection',
    completedTricks: (state) => state.gameState?.completedTricks || [],
    goingAlone: (state) => state.gameState?.goingAlone || null,
    dealer: (state) => state.gameState?.dealer || null,
    turnedUpCard: (state) => state.gameState?.trumpSelection?.turnedUpCard || null,

    modelIdsArray(): [string, string, string, string] {
      return [
        this.modelIds.north,
        this.modelIds.east,
        this.modelIds.south,
        this.modelIds.west,
      ]
    },

    // Get model name for a position (short form)
    getModelName: (state) => (position: Position): string => {
      const modelId = state.modelIds[position as keyof typeof state.modelIds]
      const parts = modelId.split('/')
      return parts[parts.length - 1] || modelId
    },

    // Dynamic status text based on game state and streaming state
    statusText(): string {
      // If streaming and we have a thinking player
      if (this.isStreaming && this.currentThinkingPlayer) {
        const playerName = this.currentThinkingPlayer.toUpperCase()
        const modelName = this.getModelName(this.currentThinkingPlayer)

        if (this.phase === 'trump_selection') {
          const round = this.gameState?.trumpSelection?.round || 1
          const turnedUpSuit = this.gameState?.trumpSelection?.turnedUpCard?.suit
          if (round === 1 && turnedUpSuit) {
            return `${playerName} (${modelName}) is deciding whether to order up ${formatSuit(turnedUpSuit)}...`
          }
          return `${playerName} (${modelName}) is selecting trump...`
        }

        if (this.phase === 'playing') {
          return `${playerName} (${modelName}) is playing a card...`
        }
      }

      // Not streaming - show last result or current state
      if (this.lastTrickWinner) {
        return `${this.lastTrickWinner.toUpperCase()} won the trick!`
      }

      if (this.phase === 'trump_selection') {
        const round = this.gameState?.trumpSelection?.round || 1
        return `Trump Selection - Round ${round}`
      }

      if (this.phase === 'playing') {
        const trickNum = (this.gameState?.completedTricks?.length || 0) + 1
        return `Playing - Trick ${trickNum} of 5`
      }

      if (this.phase === 'complete') {
        const scores = this.scores as [number, number]
        return `Game Complete - Team 1: ${scores[0]}, Team 2: ${scores[1]}`
      }

      return 'Ready to play'
    },

    // Combined played cards (streaming takes priority)
    activePlayedCards(): Record<Position, Card | null> {
      const hasStreamingCards = this.streamingPlayedCards.north ||
                                this.streamingPlayedCards.east ||
                                this.streamingPlayedCards.south ||
                                this.streamingPlayedCards.west
      if (hasStreamingCards) {
        return { ...this.streamingPlayedCards }
      }
      return {
        north: null,
        east: null,
        south: null,
        west: null,
      }
    },

    // Player hands from game state (with played cards removed)
    playerHands(): { north: Card[]; south: Card[]; east: Card[]; west: Card[] } {
      if (!this.gameState) {
        return { north: [], east: [], south: [], west: [] }
      }
      const hands: { north: Card[]; south: Card[]; east: Card[]; west: Card[] } = {
        north: [], east: [], south: [], west: []
      }
      this.gameState.players.forEach((player: { position: Position; hand: Card[] }) => {
        // Filter out cards that have been played this round
        const playedByThisPlayer = this.cardsPlayedThisRound
          .filter(p => p.player === player.position)
          .map(p => p.card)
        hands[player.position] = player.hand.filter((card: Card) =>
          !playedByThisPlayer.some(played =>
            played.suit === card.suit && played.rank === card.rank
          )
        )
      })
      return hands
    },
  },

  actions: {
    setGameState(gameState: GameState) {
      this.gameState = gameState
      this.isInitialized = true
    },

    setModelIds(modelIds: {
      north: string
      east: string
      south: string
      west: string
    }) {
      this.modelIds = modelIds
    },

    setModelId(position: 'north' | 'east' | 'south' | 'west', modelId: string) {
      this.modelIds[position] = modelId
    },

    clearGameState() {
      this.gameState = null
      this.isInitialized = false
    },

    setViewMode(mode: ViewMode) {
      this.viewMode = mode
    },

    // Streaming actions
    startStreaming() {
      this.isStreaming = true
      this.lastTrickWinner = null
      // Don't clear reasoning here - keep previous visible until new tokens arrive
    },

    stopStreaming() {
      this.isStreaming = false
      // Keep currentThinkingPlayer and reasoning visible after streaming stops
      // They will be cleared on next startStreaming or when user clicks play
    },

    setThinkingPlayer(player: Position) {
      // Don't clear previous player's reasoning - it stays visible
      // Only set new current player and initialize their reasoning buffer
      this.currentThinkingPlayer = player
      // Initialize empty string for new player, but don't clear others
      if (!this.streamingReasoning[player]) {
        this.streamingReasoning[player] = ''
      }
    },

    appendReasoning(player: Position, token: string) {
      if (!this.streamingReasoning[player]) {
        this.streamingReasoning[player] = ''
      }
      this.streamingReasoning[player] += token
      // Update displayed reasoning player when first token arrives
      // This ensures we keep showing previous player's reasoning until new one has content
      if (this.streamingReasoning[player].length === token.length) {
        // First token for this player
        this.displayedReasoningPlayer = player
      }
    },

    recordCardPlayed(player: Position, card: Card) {
      this.streamingPlayedCards[player] = card
      // Track for hand removal
      this.cardsPlayedThisRound.push({ player, card })
    },

    setTrickWinner(winner: Position) {
      this.lastTrickWinner = winner
    },

    clearStreamingState() {
      this.streamingPlayedCards = {
        north: null,
        east: null,
        south: null,
        west: null,
      }
      this.cardsPlayedThisRound = []
      this.lastTrickWinner = null
      // Clear reasoning for fresh start
      this.streamingReasoning = {}
      this.displayedReasoningPlayer = null
      this.currentThinkingPlayer = null
    },

    reset() {
      this.clearGameState()
      this.viewMode = 'arena'
      this.isStreaming = false
      this.currentThinkingPlayer = null
      this.displayedReasoningPlayer = null
      this.streamingReasoning = {}
      this.cardsPlayedThisRound = []
      this.clearStreamingState()
      this.modelIds = { ...DEFAULT_MODEL_IDS }
    },
  },
})
