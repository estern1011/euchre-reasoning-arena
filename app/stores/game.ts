import { defineStore } from 'pinia'
import type { GameState, Position, Card, Suit } from '../../lib/game/types'
import { formatSuit } from '../../lib/game/formatting'
import { DEFAULT_MODEL_IDS } from '../../lib/config/defaults'
import {
  type AgentPerformance,
  type DecisionOutcome,
  createInitialPerformance,
  calculateDecisionScore,
  updatePerformance,
} from '../../lib/scoring/calibration'
import type { EvolvedInsights } from '../../server/services/analysis/types'

export type ViewMode = 'arena' | 'analysis'

// Tool usage record for history
export interface ToolUsageRecord {
  tool: string
  cost: number
  result: unknown
}

// Game history types
export interface PlayRecord {
  player: Position
  card: Card
  modelId: string
  reasoning: string
  duration: number
  confidence?: number  // 0-100, for Metacognition Arena scoring
  toolUsed?: ToolUsageRecord
}

export interface TrickRecord {
  trickNumber: number
  plays: PlayRecord[]
  winner: Position | null
}

export interface TrumpDecisionRecord {
  player: Position
  modelId: string
  action: 'pass' | 'order_up' | 'call_trump'
  suit?: Suit  // For order_up (turned up card) or call_trump
  goingAlone?: boolean
  reasoning: string
  duration: number
  confidence?: number  // 0-100, for Metacognition Arena scoring
  toolUsed?: ToolUsageRecord
}

export interface HandRecord {
  handNumber: number
  dealer: Position
  turnedUpCard: Card | null
  trumpSuit: Suit | null
  trumpCaller: Position | null
  goingAlone: Position | null
  trumpDecisions: TrumpDecisionRecord[]  // All trump selection decisions
  tricks: TrickRecord[]
  winningTeam: 'NS' | 'EW' | null
  pointsScored: [number, number]  // [team0, team1] for this hand
}

export interface GameHistory {
  hands: HandRecord[]
  currentHandIndex: number  // Index into hands array for the current hand
}

export const useGameStore = defineStore('game', {
  state: () => ({
    gameState: null as GameState | null,
    modelIds: { ...DEFAULT_MODEL_IDS },
    isInitialized: false,
    viewMode: 'arena' as ViewMode,
    configuredWinningScore: 10, // User-configured winning score
    strategyHints: true, // Include strategy hints in prompts

    // Game history
    gameHistory: {
      hands: [],
      currentHandIndex: -1,
    } as GameHistory,

    // Transaction tracking for error recovery
    // Plays are added to tricks immediately for UI, but tracked here until committed
    pendingPlayKeys: new Set<string>(),

    // Auto-mode state
    autoMode: false,
    autoModeDelay: 2000, // 2 seconds between rounds

    // Streaming state
    isStreaming: false,
    currentThinkingPlayer: null as Position | null,
    displayedReasoningPlayer: null as Position | null, // Player whose reasoning is shown (persists)
    streamingReasoning: {} as Partial<Record<Position, string>>,
    streamingPlayedCards: {
      north: null,
      east: null,
      south: null,
      west: null,
    } as Record<Position, Card | null>,
    // Cards played this round (to remove from visible hands)
    cardsPlayedThisRound: [] as Array<{ player: Position; card: Card }>,
    lastTrickWinner: null as Position | null,

    // Tool state (Metacognition Arena)
    currentToolRequest: null as { tool: string; cost: number } | null,
    toolProgress: '' as string,
    toolResult: null as { tool: string; result: unknown; cost: number; duration: number } | null,
    lastConfidence: null as number | null, // Confidence from last decision

    // ReACT flow phases: thought → action → observation → response
    reactPhase: 'thought' as 'thought' | 'action' | 'observation' | 'response',
    initialThought: '' as string, // First reasoning before tool use

    // Metacognition Arena - Performance tracking
    agentPerformance: {} as Partial<Record<Position, AgentPerformance>>,

    // Evolving Game Insights
    evolvedInsights: null as EvolvedInsights | null,
    latestHandSummary: null as string | null,
    isAnalyzing: false,
    completedHandsCount: 0,
  }),

  getters: {
    trump: (state) => state.gameState?.trump || null,
    scores: (state) => state.gameState?.scores || [0, 0],
    phase: (state) => state.gameState?.phase || 'trump_selection',
    completedTricks: (state) => state.gameState?.completedTricks || [],
    goingAlone: (state) => state.gameState?.goingAlone || null,
    dealer: (state) => state.gameState?.dealer || null,
    turnedUpCard: (state) => state.gameState?.trumpSelection?.turnedUpCard || null,

    // Multi-hand game getters
    gameScores: (state) => state.gameState?.gameScores || [0, 0],
    handNumber: (state) => state.gameState?.handNumber || 1,
    winningScore: (state) => state.gameState?.winningScore || 10,
    isHandComplete: (state) => state.gameState?.phase === 'hand_complete',
    isGameComplete: (state) => state.gameState?.phase === 'game_complete',

    // Total decisions across all hands (trump decisions + card plays)
    totalDecisions: (state) => {
      let count = 0
      for (const hand of state.gameHistory.hands) {
        count += hand.trumpDecisions.length
        for (const trick of hand.tricks) {
          count += trick.plays.length
        }
      }
      return count
    },

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
      // Game complete takes priority
      if (this.phase === 'game_complete') {
        const gameScores = this.gameState?.gameScores || [0, 0]
        const winner = gameScores[0] > gameScores[1] ? 'Team 1' : 'Team 2'
        return `${winner} won the game!`
      }

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

      if (this.phase === 'hand_complete') {
        const handScores = this.scores as [number, number]
        const gameScores = this.gameState?.gameScores || [0, 0]
        return `Hand Complete! Team 1: +${handScores[0]} (${gameScores[0]}), Team 2: +${handScores[1]} (${gameScores[1]})`
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
    // Optimized: Uses Set for O(1) lookup instead of O(n) array scan
    playerHands(): { north: Card[]; south: Card[]; east: Card[]; west: Card[] } {
      if (!this.gameState) {
        return { north: [], east: [], south: [], west: [] }
      }

      // Build a Set of played card keys for O(1) lookup per position
      const playedCardSets = new Map<Position, Set<string>>()
      for (const { player, card } of this.cardsPlayedThisRound) {
        if (!playedCardSets.has(player)) {
          playedCardSets.set(player, new Set())
        }
        playedCardSets.get(player)!.add(`${card.suit}-${card.rank}`)
      }

      const hands: { north: Card[]; south: Card[]; east: Card[]; west: Card[] } = {
        north: [], east: [], south: [], west: []
      }

      for (const player of this.gameState.players) {
        const playedSet = playedCardSets.get(player.position)
        if (!playedSet || playedSet.size === 0) {
          hands[player.position] = player.hand
        } else {
          hands[player.position] = player.hand.filter(
            (card: Card) => !playedSet.has(`${card.suit}-${card.rank}`)
          )
        }
      }

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

    setWinningScore(score: number) {
      this.configuredWinningScore = score
    },

    setStrategyHints(enabled: boolean) {
      this.strategyHints = enabled
    },

    // Auto-mode actions
    toggleAutoMode() {
      this.autoMode = !this.autoMode
    },

    setAutoMode(enabled: boolean) {
      this.autoMode = enabled
    },

    setAutoModeDelay(delay: number) {
      this.autoModeDelay = delay
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
      // Clear tool state
      this.currentToolRequest = null
      this.toolProgress = ''
      this.toolResult = null
      this.lastConfidence = null
      // Clear ReACT state
      this.reactPhase = 'thought'
      this.initialThought = ''
    },

    // Tool actions (Metacognition Arena)
    setToolRequest(tool: string, cost: number) {
      // Save current reasoning as initial thought before tool use
      const currentPlayer = this.currentThinkingPlayer
      if (currentPlayer && this.streamingReasoning[currentPlayer]) {
        this.initialThought = this.streamingReasoning[currentPlayer]
      }
      this.currentToolRequest = { tool, cost }
      this.toolProgress = ''
      this.toolResult = null
      this.reactPhase = 'action'
    },

    setToolProgress(message: string) {
      this.toolProgress = message
    },

    setToolResult(tool: string, result: unknown, cost: number, duration: number) {
      this.toolResult = { tool, result, cost, duration }
      this.reactPhase = 'observation'
    },

    startResponsePhase() {
      this.reactPhase = 'response'
      // Clear the streaming reasoning for the new response
      const currentPlayer = this.currentThinkingPlayer
      if (currentPlayer) {
        this.streamingReasoning[currentPlayer] = ''
      }
    },

    clearToolState() {
      this.currentToolRequest = null
      this.toolProgress = ''
      this.toolResult = null
      this.reactPhase = 'thought'
      this.initialThought = ''
    },

    setLastConfidence(confidence: number) {
      this.lastConfidence = confidence
    },

    // Game history actions
    startNewHandRecord(handNumber: number, dealer: Position, turnedUpCard: Card | null) {
      // Guard against duplicate hands
      const existingIndex = this.gameHistory.hands.findIndex(h => h.handNumber === handNumber)
      if (existingIndex !== -1) {
        // Hand already exists, just update the current index
        this.gameHistory.currentHandIndex = existingIndex
        return
      }

      const newHand: HandRecord = {
        handNumber,
        dealer,
        turnedUpCard,
        trumpSuit: null,
        trumpCaller: null,
        goingAlone: null,
        trumpDecisions: [],
        tricks: [],
        winningTeam: null,
        pointsScored: [0, 0],
      }
      this.gameHistory.hands.push(newHand)
      this.gameHistory.currentHandIndex = this.gameHistory.hands.length - 1
    },

    recordTrumpDecision(decision: TrumpDecisionRecord) {
      const hand = this.gameHistory.hands[this.gameHistory.currentHandIndex]
      if (!hand) {
        console.warn('[GameStore] recordTrumpDecision: No active hand at index', this.gameHistory.currentHandIndex)
        return
      }
      
      hand.trumpDecisions.push(decision)
      
      // If trump was called, record it
      if (decision.action === 'order_up' || decision.action === 'call_trump') {
        hand.trumpSuit = decision.suit || null
        hand.trumpCaller = decision.player
        hand.goingAlone = decision.goingAlone ? decision.player : null
      }
    },

    recordPlay(play: PlayRecord) {
      const hand = this.gameHistory.hands[this.gameHistory.currentHandIndex]
      if (!hand) {
        console.warn('[GameStore] recordPlay: No active hand at index', this.gameHistory.currentHandIndex)
        return
      }

      // Guard: Don't record plays after hand should be complete (5 tricks with 4 plays each = 20 plays)
      const totalPlays = hand.tricks.reduce((sum, t) => sum + t.plays.length, 0)
      if (totalPlays >= 20) {
        console.warn('[GameStore] recordPlay: Hand already has 20 plays, ignoring additional play')
        return
      }

      // Guard: Check for duplicate play (same card already played in this hand)
      const cardKey = `${hand.handNumber}-${play.card.rank}-${play.card.suit}`
      const allPlaysInHand = hand.tricks.flatMap(t => t.plays)
      const isDuplicate = allPlaysInHand.some(
        p => `${hand.handNumber}-${p.card.rank}-${p.card.suit}` === cardKey
      )
      if (isDuplicate) {
        console.warn('[GameStore] recordPlay: Duplicate card detected, ignoring')
        return
      }

      // Get or create current trick
      let currentTrick = hand.tricks[hand.tricks.length - 1]
      if (!currentTrick || currentTrick.plays.length === 4) {
        currentTrick = {
          trickNumber: hand.tricks.length + 1,
          plays: [],
          winner: null,
        }
        hand.tricks.push(currentTrick)
      }

      currentTrick.plays.push(play)

      // Track this play as pending until round_complete confirms it
      this.pendingPlayKeys.add(cardKey)
    },

    // Commit pending plays - called when round_complete confirms the plays
    commitPendingPlays() {
      this.pendingPlayKeys.clear()
    },

    // Rollback pending plays - called when an error occurs mid-round
    rollbackPendingPlays() {
      if (this.pendingPlayKeys.size === 0) return

      const hand = this.gameHistory.hands[this.gameHistory.currentHandIndex]
      if (!hand) {
        this.pendingPlayKeys.clear()
        return
      }

      // Remove plays that are still pending from tricks
      for (const trick of hand.tricks) {
        trick.plays = trick.plays.filter(p => {
          const key = `${hand.handNumber}-${p.card.rank}-${p.card.suit}`
          return !this.pendingPlayKeys.has(key)
        })
      }

      // Remove empty tricks
      hand.tricks = hand.tricks.filter(t => t.plays.length > 0)

      this.pendingPlayKeys.clear()
    },

    recordTrickWinner(trickNumber: number, winner: Position) {
      const hand = this.gameHistory.hands[this.gameHistory.currentHandIndex]
      if (!hand) {
        console.warn('[GameStore] recordTrickWinner: No active hand at index', this.gameHistory.currentHandIndex)
        return
      }
      
      const trick = hand.tricks.find(t => t.trickNumber === trickNumber)
      if (trick) {
        trick.winner = winner
      }
    },

    recordHandComplete(winningTeam: 'NS' | 'EW', pointsScored: [number, number]) {
      const hand = this.gameHistory.hands[this.gameHistory.currentHandIndex]
      if (!hand) {
        console.warn('[GameStore] recordHandComplete: No active hand at index', this.gameHistory.currentHandIndex)
        return
      }
      
      hand.winningTeam = winningTeam
      hand.pointsScored = pointsScored
    },

    getCurrentHand(): HandRecord | null {
      return this.gameHistory.hands[this.gameHistory.currentHandIndex] || null
    },

    // Performance tracking actions (Metacognition Arena)
    initializePerformance() {
      const positions: Position[] = ['north', 'east', 'south', 'west']
      for (const pos of positions) {
        this.agentPerformance[pos] = createInitialPerformance(
          this.modelIds[pos],
          pos
        )
      }
    },

    recordDecisionOutcome(
      player: Position,
      confidence: number,
      wasCorrect: boolean,
      toolUsed: { tool: string; cost: number } | null,
      decisionType?: 'card_play' | 'trump_call' | 'trump_pass',
      pointsScored?: number
    ) {
      // Initialize if needed
      if (!this.agentPerformance[player]) {
        this.agentPerformance[player] = createInitialPerformance(
          this.modelIds[player],
          player
        )
      }

      const outcome: DecisionOutcome = {
        confidence,
        toolUsed,
        wasCorrect,
        decisionType,
        pointsScored,
      }

      const score = calculateDecisionScore(outcome)
      this.agentPerformance[player] = updatePerformance(
        this.agentPerformance[player],
        outcome,
        score
      )

      return score
    },

    getAgentPerformance(player: Position): AgentPerformance | null {
      return this.agentPerformance[player] || null
    },

    // Evolving Game Insights actions
    setAnalyzing(analyzing: boolean) {
      this.isAnalyzing = analyzing
    },

    updateInsights(insights: EvolvedInsights, handSummary: string) {
      this.evolvedInsights = insights
      this.latestHandSummary = handSummary
    },

    incrementHandCount() {
      this.completedHandsCount++
    },

    reset() {
      this.clearGameState()
      this.viewMode = 'arena'
      this.autoMode = false
      this.isStreaming = false
      this.currentThinkingPlayer = null
      this.displayedReasoningPlayer = null
      this.streamingReasoning = {}
      this.cardsPlayedThisRound = []
      this.gameHistory = { hands: [], currentHandIndex: -1 }
      this.pendingPlayKeys = new Set()
      this.clearStreamingState()
      this.modelIds = { ...DEFAULT_MODEL_IDS }
      this.agentPerformance = {}
      this.evolvedInsights = null
      this.latestHandSummary = null
      this.isAnalyzing = false
      this.completedHandsCount = 0
    },
  },
})
