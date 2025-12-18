<template>
    <div class="analysis-container">
        <header class="analysis-header">
            <div class="header-left">
                <NuxtLink to="/" class="logo-link">
                    <h1><span class="bracket">&lt;</span>euchre.<span class="accent">arena</span><span class="bracket"> /&gt;</span></h1>
                </NuxtLink>
            </div>
            <div class="header-center">
                <div class="mode-switcher">
                    <NuxtLink
                        to="/game"
                        class="mode-tab"
                    >
                        // Arena
                    </NuxtLink>
                    <NuxtLink
                        to="/analysis"
                        class="mode-tab active"
                    >
                        // Analysis
                    </NuxtLink>
                </div>
            </div>
            <div class="header-right">
                <GameControls
                    v-if="!gameStore.isGameComplete"
                    :disabled="!gameStore.gameState || gameStore.isStreaming"
                    class="header-controls"
                    @play-next="handlePlayNext"
                />
                <a href="https://github.com/estern1011/euchre-reasoning-arena" target="_blank" rel="noopener" class="github-link" title="View on GitHub">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
            </div>
        </header>

        <div class="analysis-content">
            <!-- Left: Game Insights (full column) -->
            <div class="left-column">
                <div class="panel panel-insights">
                    <GameInsightsPanel
                        :insights="gameStore.evolvedInsights"
                        :hand-summary="gameStore.latestHandSummary"
                        :hand-number="gameStore.completedHandsCount"
                        :model-ids="gameStore.modelIds"
                        :is-analyzing="gameStore.isAnalyzing"
                    />
                </div>
            </div>

            <!-- Middle: Stacked panels -->
            <div class="middle-column">
                <!-- Performance Scoreboard -->
                <div class="panel panel-scoreboard">
                    <PerformanceScoreboard
                        :current-player="gameStore.currentThinkingPlayer"
                        :show-scoring-info="true"
                        @show-scoring-rules="showScoringModal = true"
                    />
                </div>

                <!-- Hand Strength -->
                <div class="panel panel-strength">
                    <HandStrengthPanel
                        :hands="gameStore.playerHands"
                        :trump-suit="potentialTrumpSuit"
                        :show-matrix="isRoundTwo"
                        :show-help="true"
                        @show-help="showHandStrengthModal = true"
                    />
                </div>

                <!-- Tool Economy -->
                <div class="panel panel-tools">
                    <ToolPanel :show-available-tools="true" :show-phase-indicator="false" />
                </div>
            </div>

            <!-- Right: Activity Log / Game State -->
            <aside class="activity-sidebar">
                <div class="sidebar-header">
                    <span class="comment">// </span>activity_log
                    <span class="entry-count">{{ activityEntries.length }} events</span>
                </div>

                <!-- Game State Summary -->
                <div class="game-state-box">
                    <div class="state-row">
                        <span class="state-label">hand:</span>
                        <span class="state-value">{{ gameStore.handNumber }}</span>
                    </div>
                    <div class="state-row">
                        <span class="state-label">score:</span>
                        <span class="state-value score-ns">NS {{ gameStore.gameScores?.[0] || 0 }}</span>
                        <span class="state-sep">-</span>
                        <span class="state-value score-ew">{{ gameStore.gameScores?.[1] || 0 }} EW</span>
                    </div>
                    <div class="state-row">
                        <span class="state-label">trump:</span>
                        <span class="state-value" :class="trumpSuitClass">{{ trumpDisplay }}</span>
                    </div>
                    <div class="state-row">
                        <span class="state-label">tricks:</span>
                        <span class="state-value">{{ tricksDisplay }}</span>
                    </div>
                    <div class="state-row">
                        <span class="state-label">phase:</span>
                        <span class="state-value phase">{{ phaseDisplay }}</span>
                    </div>
                    <div class="state-row status-row" v-if="gameStore.statusText">
                        <span class="state-label">status:</span>
                        <span class="state-value status" :class="{ streaming: gameStore.isStreaming }">{{ gameStore.statusText }}</span>
                    </div>
                </div>

                <!-- Activity Feed -->
                <div class="activity-feed">
                    <div
                        v-for="(entry, index) in activityEntries"
                        :key="index"
                        class="activity-entry"
                        :class="entry.type"
                    >
                        <span class="entry-step">{{ entry.step.toString().padStart(3, '0') }}</span>
                        <span class="entry-content">
                            <!-- Hand start marker -->
                            <span v-if="entry.kind === 'hand-start'" class="hand-marker">
                                {{ entry.text }}
                            </span>

                            <!-- Trump decision -->
                            <template v-else-if="entry.kind === 'trump-decision'">
                                <span :class="entry.playerClass">{{ entry.player }}</span>
                                {{ entry.action }}
                                <span v-if="entry.suit" :class="entry.suitClass">{{ entry.suit }}</span>
                                <span v-if="entry.toolUsed" class="tool-used" :title="entry.toolTitle">
                                    [{{ entry.toolIcon }}]
                                </span>
                            </template>

                            <!-- Card play -->
                            <template v-else-if="entry.kind === 'card-play'">
                                <span :class="entry.playerClass">{{ entry.player }}</span>
                                {{ ' played ' }}
                                <span class="card">{{ entry.card }}</span>
                                <span v-if="entry.toolUsed" class="tool-used" :title="entry.toolTitle">
                                    [{{ entry.toolIcon }}]
                                </span>
                            </template>

                            <!-- Trick complete -->
                            <template v-else-if="entry.kind === 'trick-complete'">
                                <span class="trick-win">{{ entry.trickText }}</span>
                                {{ ' won by ' }}
                                <span :class="entry.winnerClass">{{ entry.winner }}</span>
                            </template>
                        </span>
                    </div>
                    <div v-if="activityEntries.length === 0" class="empty-state">
                        <span class="comment">// awaiting game events...</span>
                    </div>
                </div>

                <!-- Reasoning History Button -->
                <div class="history-action">
                    <button
                        class="history-button"
                        type="button"
                        @click="showReasoningModal = true"
                    >
                        <span class="fn">viewHistory</span><span class="parens">()</span>
                        <span class="badge">{{ gameStore.totalDecisions }}</span>
                    </button>
                </div>
            </aside>
        </div>

        <!-- Reasoning Modal -->
        <ReasoningModal
            :is-open="showReasoningModal"
            @close="showReasoningModal = false"
        />

        <!-- Scoring Rules Modal -->
        <ScoringModal
            :is-open="showScoringModal"
            @close="showScoringModal = false"
        />

        <!-- Hand Strength Modal -->
        <HandStrengthModal
            :is-open="showHandStrengthModal"
            @close="showHandStrengthModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import ReasoningModal from "~/components/ReasoningModal.vue";
import ScoringModal from "~/components/ScoringModal.vue";
import HandStrengthModal from "~/components/HandStrengthModal.vue";
import PerformanceScoreboard from "~/components/PerformanceScoreboard.vue";
import ToolPanel from "~/components/ToolPanel.vue";
import HandStrengthPanel from "~/components/HandStrengthPanel.vue";
import GameInsightsPanel from "~/components/GameInsightsPanel.vue";
import GameControls from "~/components/GameControls.vue";
import { useGameStore } from "~/stores/game";
import { formatSuit } from "../../lib/game/formatting";
import { useGameStreaming } from "~/composables/useGameStreaming";
import { startNewHand } from "../../lib/game/game";
import type { Position, Suit } from "../../lib/game/types";

const gameStore = useGameStore();

// Modals
const showReasoningModal = ref(false);
const showScoringModal = ref(false);
const showHandStrengthModal = ref(false);

// Computed values for hand strength panel
const potentialTrumpSuit = computed(() => {
    if (gameStore.trump) {
        return gameStore.trump;
    }
    if (gameStore.turnedUpCard) {
        return gameStore.turnedUpCard.suit;
    }
    return null;
});

const isRoundTwo = computed(() => {
    return gameStore.gameState?.trumpSelection?.round === 2;
});

// Game state display values
const trumpDisplay = computed(() => {
    if (!gameStore.trump) return "?";
    return formatSuit(gameStore.trump);
});

const trumpSuitClass = computed(() => {
    if (!gameStore.trump) return "";
    return gameStore.trump === "hearts" || gameStore.trump === "diamonds" ? "red" : "black";
});

const tricksDisplay = computed(() => {
    const scores = gameStore.scores || [0, 0];
    return `NS ${scores[0]} - ${scores[1]} EW`;
});

const phaseDisplay = computed(() => {
    const phase = gameStore.phase;
    if (!phase) return "initializing";
    return phase.replace(/_/g, " ");
});

// Game streaming
const { streamGameRound } = useGameStreaming();

// Handle playing next round with SSE streaming
const handlePlayNextRound = async () => {
    if (!gameStore.gameState || gameStore.isStreaming) return;

    gameStore.clearStreamingState();
    gameStore.startStreaming();

    try {
        for await (const message of streamGameRound(gameStore.gameState)) {
            switch (message.type) {
                case "player_thinking":
                    gameStore.setThinkingPlayer(message.player!);
                    break;

                case "reasoning_token":
                    if (message.player && message.token) {
                        gameStore.appendReasoning(message.player, message.token);
                    }
                    break;

                case "tool_request":
                    if (message.tool && message.cost !== undefined) {
                        gameStore.setToolRequest(message.tool, message.cost);
                    }
                    break;

                case "tool_progress":
                    if (message.message) {
                        gameStore.setToolProgress(message.message);
                    }
                    break;

                case "tool_result":
                    if (message.tool && message.result !== undefined) {
                        gameStore.setToolResult(
                            message.tool,
                            message.result,
                            message.cost || 0,
                            message.duration || 0
                        );
                    }
                    break;

                case "decision_made":
                    const reasoning = message.reasoning || gameStore.streamingReasoning[message.player!] || "No reasoning provided";

                    if (message.confidence !== undefined) {
                        gameStore.setLastConfidence(message.confidence);
                    }

                    if (message.card && message.action !== "discard") {
                        gameStore.recordCardPlayed(message.player!, message.card);
                        gameStore.recordPlay({
                            player: message.player!,
                            card: message.card,
                            modelId: message.modelId!,
                            reasoning,
                            duration: message.duration!,
                            confidence: message.confidence,
                            toolUsed: gameStore.toolResult ? {
                                tool: gameStore.toolResult.tool,
                                cost: gameStore.toolResult.cost,
                                result: gameStore.toolResult.result,
                            } : undefined,
                        });
                    } else if (!message.card) {
                        const trumpSuit = message.action === "order_up"
                            ? gameStore.turnedUpCard?.suit
                            : message.suit;

                        if (message.action === "pass" || message.action === "order_up" || message.action === "call_trump") {
                            gameStore.recordTrumpDecision({
                                player: message.player!,
                                modelId: message.modelId!,
                                action: message.action as "pass" | "order_up" | "call_trump",
                                suit: trumpSuit as Suit | undefined,
                                goingAlone: message.goingAlone,
                                reasoning,
                                duration: message.duration!,
                                confidence: message.confidence,
                                toolUsed: gameStore.toolResult ? {
                                    tool: gameStore.toolResult.tool,
                                    cost: gameStore.toolResult.cost,
                                    result: gameStore.toolResult.result,
                                } : undefined,
                            });
                        }
                    }
                    break;

                case "round_complete":
                    gameStore.setGameState(message.gameState!);
                    gameStore.commitPendingPlays();

                    if (message.trickNumber && message.trickWinner) {
                        gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                    }

                    if (message.phase === "hand_complete" || message.phase === "game_complete") {
                        const winningTeam = (message.handScores?.[0] ?? 0) > (message.handScores?.[1] ?? 0) ? "NS" : "EW";
                        gameStore.recordHandComplete(winningTeam, message.handScores || [0, 0]);
                    }
                    break;

                case "error":
                    console.error("Stream error:", message.message);
                    throw new Error(message.message);
            }
        }
    } catch (error) {
        console.error("Streaming Error:", error);
        gameStore.rollbackPendingPlays();
    } finally {
        gameStore.stopStreaming();
    }
};

// Handle starting a new hand
const handleStartNextHand = () => {
    if (!gameStore.gameState || gameStore.phase !== "hand_complete") return;

    try {
        const newGameState = startNewHand(gameStore.gameState);
        gameStore.setGameState(newGameState);
        gameStore.clearStreamingState();
        gameStore.startNewHandRecord(
            newGameState.handNumber,
            newGameState.dealer,
            newGameState.trumpSelection?.turnedUpCard || null
        );
    } catch (error) {
        console.error("Failed to start new hand:", error);
    }
};

// Unified play handler
const handlePlayNext = async () => {
    if (!gameStore.gameState || gameStore.isStreaming) return;

    if (gameStore.phase === "hand_complete") {
        handleStartNextHand();
        if (!gameStore.autoMode) return;
    }

    await handlePlayNextRound();
};

// Auto-mode orchestration
let autoModeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleNextAutoPlay = () => {
    if (!gameStore.autoMode || gameStore.isStreaming || gameStore.isGameComplete) {
        return;
    }

    if (autoModeTimeoutId) {
        clearTimeout(autoModeTimeoutId);
    }

    autoModeTimeoutId = setTimeout(async () => {
        if (gameStore.autoMode && !gameStore.isStreaming && !gameStore.isGameComplete) {
            await handlePlayNext();
        }
    }, gameStore.autoModeDelay);
};

// Watch for auto-mode changes and streaming completion
watch(
    () => [gameStore.autoMode, gameStore.isStreaming] as const,
    ([autoMode, isStreaming]) => {
        if (autoMode && !isStreaming && !gameStore.isGameComplete) {
            scheduleNextAutoPlay();
        }
    },
    { immediate: true }
);

// Redirect to setup page if no active game
onMounted(() => {
    if (!gameStore.gameState) {
        navigateTo('/');
    }
});

// Cleanup on unmount
onUnmounted(() => {
    if (autoModeTimeoutId) {
        clearTimeout(autoModeTimeoutId);
    }
});

// Activity entry types
type HandStartEntry = {
    kind: "hand-start";
    step: number;
    type: string;
    text: string;
};

type TrumpDecisionEntry = {
    kind: "trump-decision";
    step: number;
    type: string;
    player: string;
    playerClass: string;
    action: string;
    suit?: string;
    suitClass?: string;
    toolUsed?: boolean;
    toolIcon?: string;
    toolTitle?: string;
};

type CardPlayEntry = {
    kind: "card-play";
    step: number;
    type: string;
    player: string;
    playerClass: string;
    card: string;
    toolUsed?: boolean;
    toolIcon?: string;
    toolTitle?: string;
};

type TrickCompleteEntry = {
    kind: "trick-complete";
    step: number;
    type: string;
    trickText: string;
    winner: string;
    winnerClass: string;
};

type ActivityEntry = HandStartEntry | TrumpDecisionEntry | CardPlayEntry | TrickCompleteEntry;

// Convert activity log entries to structured format - accumulates ALL events
const activityEntries = computed(() => {
    const entries: ActivityEntry[] = [];
    let step = 1;

    // Process ALL hands in game history
    for (const hand of gameStore.gameHistory.hands) {
        // Hand start marker
        if (hand.handNumber > 1) {
            entries.push({
                kind: "hand-start",
                step,
                text: `Hand ${hand.handNumber} started`,
                type: "hand-start",
            });
            step++;
        }

        // Trump decisions
        for (const decision of hand.trumpDecisions) {
            const playerClass = getPlayerClass(decision.player);
            const suitDisplay = decision.suit ? formatSuit(decision.suit) : "?";
            const suitClass = decision.suit && (decision.suit === "hearts" || decision.suit === "diamonds") ? "red" : "black";

            let actionText: string;
            let suit: string | undefined;

            if (decision.action === "pass") {
                actionText = " passed";
            } else if (decision.action === "order_up") {
                actionText = " ordered up ";
                suit = suitDisplay;
            } else {
                actionText = " called ";
                suit = suitDisplay;
            }

            const baseType = decision.action === "pass" ? "pass" : "trump-call";
            const entryType = decision.toolUsed ? `${baseType} tool-used-entry` : baseType;

            entries.push({
                kind: "trump-decision",
                step,
                type: entryType,
                player: decision.player,
                playerClass,
                action: actionText,
                suit,
                suitClass,
                toolUsed: !!decision.toolUsed,
                toolIcon: decision.toolUsed ? getToolIcon(decision.toolUsed.tool) : undefined,
                toolTitle: decision.toolUsed ? `Used ${decision.toolUsed.tool} (cost: ${decision.toolUsed.cost})` : undefined,
            });
            step++;
        }

        // Tricks
        for (const trick of hand.tricks) {
            for (const play of trick.plays) {
                const playerClass = getPlayerClass(play.player);
                const cardText = `${play.card.rank}${formatSuit(play.card.suit)}`;

                entries.push({
                    kind: "card-play",
                    step,
                    type: play.toolUsed ? "card-play tool-used-entry" : "card-play",
                    player: play.player,
                    playerClass,
                    card: cardText,
                    toolUsed: !!play.toolUsed,
                    toolIcon: play.toolUsed ? getToolIcon(play.toolUsed.tool) : undefined,
                    toolTitle: play.toolUsed ? `Used ${play.toolUsed.tool} (cost: ${play.toolUsed.cost})` : undefined,
                });
                step++;
            }

            if (trick.winner) {
                const winnerClass = getPlayerClass(trick.winner);
                entries.push({
                    kind: "trick-complete",
                    step,
                    type: "trick-complete",
                    trickText: `Trick ${trick.trickNumber}`,
                    winner: trick.winner,
                    winnerClass,
                });
                step++;
            }
        }
    }

    return entries.reverse(); // Most recent first
});

function getPlayerClass(player: Position): string {
    return player === "north" || player === "south" ? "team-ns" : "team-ew";
}

function getToolIcon(tool: string): string {
    switch (tool) {
        case "ask_audience":
            return "👥";
        case "ask_partner":
            return "🤝";
        case "fifty_fifty":
            return "50/50";
        default:
            return "🔧";
    }
}
</script>

<style scoped>
.analysis-container {
    height: 100vh;
    overflow: hidden;
    background:
        linear-gradient(90deg, rgba(56, 189, 186, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(56, 189, 186, 0.08) 1px, transparent 1px);
    background-size: 30px 30px;
    background-color: #0a1414;
    color: #fff;
    font-family: "Courier New", Consolas, Monaco, monospace;
    display: flex;
    flex-direction: column;
}

.analysis-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    z-index: 1;
}

.analysis-container > * {
    position: relative;
    z-index: 2;
}

/* Header - Match game page exactly */
.analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1;
}

.logo-link {
    text-decoration: none;
    transition: opacity 0.15s ease;
}

.logo-link:hover {
    opacity: 0.8;
}

.header-left h1 {
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin: 0;
    color: var(--color-text);
    white-space: nowrap;
}

.bracket {
    color: var(--color-text-muted);
}

.accent {
    color: #38bdb8;
}

.header-center {
    flex: 1;
    display: flex;
    justify-content: center;
}

.mode-switcher {
    display: flex;
    gap: 0;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(56, 189, 186, 0.2);
    border-radius: 8px;
    padding: 2px;
}

.mode-tab {
    padding: 0.6rem 1.25rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: transparent;
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
    letter-spacing: 0.025em;
}

.mode-tab:hover:not(.active) {
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.1);
    border-color: rgba(56, 189, 186, 0.3);
}

.mode-tab.active {
    color: #0a1414;
    background: #38bdb8;
    border-color: #38bdb8;
    box-shadow: 0 0 20px rgba(56, 189, 186, 0.5);
    text-shadow: none;
}

.comment {
    color: var(--color-text-muted);
}

.header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
}

.github-link {
    color: var(--color-text-muted);
    transition: color 0.15s ease;
    display: flex;
    align-items: center;
}

.github-link:hover {
    color: var(--color-accent);
}

/* Content Layout - 3 columns: Insights | Stacked Panels | Activity */
.analysis-content {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(360px, 420px) 320px;
    gap: 0.75rem;
    padding: 0.75rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

/* Left column - Game Insights takes full height */
.left-column {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.left-column .panel {
    flex: 1;
    min-height: 0;
}

/* Middle column - stacked panels */
.middle-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
    overflow: hidden;
}

.panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

/* Stacked panels in middle column - distribute space */
.middle-column .panel-scoreboard {
    flex: 0 0 auto;
}

.middle-column .panel-strength {
    flex: 0 0 auto;
}

.middle-column .panel-tools {
    flex: 0 0 auto;
}

/* Let components handle their own styling */
.panel > :deep(*) {
    flex: 1;
    min-height: 0;
}

/* Activity Sidebar */
.activity-sidebar {
    background: rgba(10, 20, 20, 0.85);
    border: 1px solid rgba(56, 189, 186, 0.25);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.sidebar-header {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--color-text-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.entry-count {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    background: rgba(56, 189, 186, 0.1);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
}

/* Game State Box */
.game-state-box {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
}

.state-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    padding: 0.2rem 0;
}

.state-label {
    color: var(--color-text-muted);
    min-width: 50px;
}

.state-value {
    color: var(--color-text-secondary);
    font-weight: 500;
}

.state-value.red {
    color: #f87171;
}

.state-value.black {
    color: var(--color-text);
}

.state-value.phase {
    color: #38bdb8;
    text-transform: capitalize;
}

.status-row {
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.state-value.status {
    color: var(--color-text-muted);
    font-size: 0.6875rem;
    line-height: 1.3;
}

.state-value.status.streaming {
    color: #38bdb8;
}

.state-sep {
    color: var(--color-text-muted);
}

.score-ns {
    color: #a3e635;
}

.score-ew {
    color: #60a5fa;
}

/* Activity Feed */
.activity-feed {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    min-height: 0;
}

.activity-entry {
    display: flex;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    font-size: 0.6875rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    line-height: 1.4;
}

.activity-entry:last-child {
    border-bottom: none;
}

.entry-step {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    min-width: 24px;
    opacity: 0.6;
}

.entry-content {
    flex: 1;
    color: var(--color-text-secondary);
}

.entry-content .team-ns {
    color: #a3e635;
    font-weight: 500;
}

.entry-content .team-ew {
    color: #60a5fa;
    font-weight: 500;
}

.entry-content .card {
    color: #fbbf24;
    font-weight: 600;
}

.entry-content .trick-win {
    color: #38bdb8;
}

.entry-content .red {
    color: #f87171;
}

.entry-content .black {
    color: var(--color-text);
}

.activity-entry.trump-call {
    background: rgba(56, 189, 186, 0.05);
}

.activity-entry.trick-complete {
    background: rgba(163, 230, 53, 0.05);
}

.activity-entry.hand-start {
    background: rgba(56, 189, 186, 0.08);
    border-left: 2px solid #38bdb8;
    margin: 0.25rem 0;
}

.activity-entry.tool-used-entry {
    background: rgba(251, 191, 36, 0.08);
    border-left: 2px solid #fbbf24;
}

.entry-content .hand-marker {
    color: #38bdb8;
    font-weight: 600;
}

.entry-content .tool-used {
    color: #fbbf24;
    font-size: 0.625rem;
    font-weight: 600;
    margin-left: 0.25rem;
    cursor: help;
    background: rgba(251, 191, 36, 0.15);
    padding: 0.1rem 0.25rem;
    border-radius: 3px;
}

.empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.75rem;
}

/* History Action */
.history-action {
    padding: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
}

.history-button {
    width: 100%;
    padding: 0.6rem 1rem;
    font-family: "Courier New", monospace;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.05);
    border: 1px solid rgba(56, 189, 186, 0.25);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.history-button:hover {
    background: rgba(56, 189, 186, 0.1);
    border-color: rgba(56, 189, 186, 0.4);
    color: #fff;
}

.history-button .fn {
    color: #fbbf24;
}

.history-button .parens {
    color: var(--color-text-muted);
}

.history-button .badge {
    background: rgba(56, 189, 186, 0.15);
    border: 1px solid rgba(56, 189, 186, 0.25);
    padding: 0.1rem 0.4rem;
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
}
</style>
