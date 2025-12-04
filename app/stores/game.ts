import { defineStore } from 'pinia'
import type { GameState } from '~/lib/game/types'

export type ViewMode = 'arena' | 'intelligence'

export const useGameStore = defineStore('game', {
  state: () => ({
    gameState: null as GameState | null,
    modelIds: {
      north: 'anthropic/claude-haiku-4.5',
      east: 'google/gemini-2.5-flash',
      south: 'openai/gpt-5-mini',
      west: 'xai/grok-4.1-fast-non-reasoning',
    },
    isInitialized: false,
    viewMode: 'arena' as ViewMode,
  }),

  getters: {
    trump: (state) => state.gameState?.trump || null,
    scores: (state) => state.gameState?.scores || [0, 0],
    phase: (state) => state.gameState?.phase || 'trump_selection',
    completedTricks: (state) => state.gameState?.completedTricks || [],
    modelIdsArray(): [string, string, string, string] {
      return [
        this.modelIds.north,
        this.modelIds.east,
        this.modelIds.south,
        this.modelIds.west,
      ]
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

    reset() {
      this.clearGameState()
      this.viewMode = 'arena'
      this.modelIds = {
        north: 'anthropic/claude-haiku-4.5',
        east: 'google/gemini-2.5-flash',
        south: 'openai/gpt-5-mini',
        west: 'xai/grok-4.1-fast-non-reasoning',
      }
    },
  },
})
