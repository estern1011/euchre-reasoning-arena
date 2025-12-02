<template>
    <div class="game-container">
        <header class="game-header">
            <h1><span class="bracket">&lt;</span>euchre.<span class="accent">arena</span><span class="bracket"> /&gt;</span></h1>
            <span class="live-badge">
                <span class="live-dot"></span>
                LIVE
            </span>
        </header>

        <div class="game-content">
            <!-- Left Panel: Arena -->
            <div class="arena-panel">
                <div class="panel-header">
                    <span class="comment">// </span>arena
                </div>

                <!-- Game State Header -->
                <div class="game-state-header">
                    <div class="state-info">
                        <span class="state-item"
                            ><span class="state-label">phase:</span> <span class="state-value">"{{ currentPhase.toLowerCase() }}"</span></span
                        >
                        <span class="divider">,</span>
                        <span class="state-item"
                            ><span class="state-label">trick:</span> <span class="state-value">{{ currentTrick }}</span></span
                        >
                        <span class="divider">,</span>
                        <span class="state-item"
                            ><span class="state-label">trump:</span> <span class="trump-suit">{{
                                trumpSuit
                            }}</span></span
                        >
                        <span class="divider">,</span>
                        <span class="state-item"
                            ><span class="state-label">winner:</span> <span class="state-value">"{{ lastTrickWinner.toLowerCase() }}"</span></span
                        >
                    </div>
                </div>

                <!-- Table View -->
                <div class="table-view">
                    <div class="table-header"><span class="keyword">const</span> table = {</div>

                    <div class="card-table">
                        <!-- North Position -->
                        <div class="player-position north">
                            <div class="thinking-box">
                                <div class="position-label">NORTH</div>
                                <div class="thinking-text">THINKING...</div>
                            </div>
                        </div>

                        <!-- West Position -->
                        <div class="player-position west">
                            <button class="prompt-button" type="button">
                                <svg
                                    class="gear-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path
                                        d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.515 15.879m12.728 0l-4.243-4.243m-6.364 0L3.515 8.121"
                                    ></path>
                                </svg>
                                PROMPT
                            </button>
                            <div class="played-card">
                                <Card
                                    :suit="playedCards.west.suit"
                                    :rank="playedCards.west.rank"
                                />
                            </div>
                            <div class="player-info">
                                <div class="player-name">WEST</div>
                                <div class="model-name">FAST-MODEL-V2</div>
                                <div class="status">STATUS</div>
                            </div>
                        </div>

                        <!-- Center - Played Cards Area -->
                        <div class="center-area">
                            <div class="center-card">
                                <Card
                                    :suit="playedCards.center.suit"
                                    :rank="playedCards.center.rank"
                                />
                            </div>
                        </div>

                        <!-- East Position -->
                        <div class="player-position east">
                            <button class="prompt-button" type="button">
                                <svg
                                    class="gear-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path
                                        d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.515 15.879m12.728 0l-4.243-4.243m-6.364 0L3.515 8.121"
                                    ></path>
                                </svg>
                                PROMPT
                            </button>
                            <div class="played-card">
                                <Card
                                    :suit="playedCards.east.suit"
                                    :rank="playedCards.east.rank"
                                />
                            </div>
                            <div class="player-info">
                                <div class="player-name">EAST</div>
                                <div class="model-name">FAST-MODEL-V2</div>
                                <div class="status">STATUS</div>
                            </div>
                        </div>

                        <!-- South Position -->
                        <div class="player-position south">
                            <button class="prompt-button" type="button">
                                <svg
                                    class="gear-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path
                                        d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.515 15.879m12.728 0l-4.243-4.243m-6.364 0L3.515 8.121"
                                    ></path>
                                </svg>
                                PROMPT
                            </button>
                            <div class="player-info">
                                <div class="player-name">SOUTH</div>
                                <div class="model-name">
                                    EXPERIMENTAL-CLAUDE-3
                                </div>
                                <div class="status">STATUS</div>
                            </div>
                        </div>
                    </div>

                    <!-- Game Controls -->
                    <div class="game-controls">
                        <div v-if="error" class="alert error mb-4">
                            {{ error }}
                        </div>
                        <button
                            class="primary-button"
                            type="button"
                            @click="playNextTrick"
                            :disabled="!gameState || isLoading"
                        >
                            <span class="button-text">playNextTrick()</span>
                            <span class="button-arrow">→</span>
                        </button>
                    </div>
                    <div class="closing-brace">}</div>
                </div>
            </div>

            <!-- Right Panel: Intelligence -->
            <div class="intelligence-panel">
                <div class="panel-header">
                    <span class="comment">// </span>intelligence
                </div>

                <!-- Activity Log -->
                <div class="activity-log">
                    <div class="log-header">
                        <span class="keyword">const</span> activityLog = [
                    </div>
                    <div class="log-entries">
                        <div
                            v-for="(entry, index) in activityLog"
                            :key="index"
                            class="log-entry"
                        >
                            {{ entry }}
                        </div>
                        <div v-if="activityLog.length === 0" class="log-entry">
                            Waiting for game to start...
                        </div>
                    </div>
                </div>

                <!-- Live Model Reasoning -->
                <div class="live-reasoning">
                    <div class="reasoning-header">
                        <span class="keyword">const</span> reasoning = {
                    </div>

                    <div class="reasoning-content">
                        <div
                            v-for="(decision, index) in decisions"
                            :key="index"
                            :class="[
                                'model-reasoning',
                                { active: index === decisions.length - 1 },
                            ]"
                        >
                            <div class="model-header">
                                <span class="model-position">{{
                                    decision.player.toUpperCase()
                                }}</span>
                                <span
                                    :class="[
                                        'indicator',
                                        {
                                            active:
                                                index === decisions.length - 1,
                                        },
                                    ]"
                                    >●</span
                                >
                            </div>
                            <div class="model-details">
                                <div class="model-id">
                                    MODEL: {{ decision.modelId }} | DURATION:
                                    {{ (decision.duration / 1000).toFixed(2) }}s
                                </div>
                                <div class="action">
                                    <template v-if="'card' in decision">
                                        ACTION: PLAYED {{ decision.card.rank
                                        }}{{
                                            decision.card.suit === "hearts"
                                                ? "♥"
                                                : decision.card.suit ===
                                                    "diamonds"
                                                  ? "♦"
                                                  : decision.card.suit ===
                                                      "clubs"
                                                    ? "♣"
                                                    : "♠"
                                        }}
                                    </template>
                                    <template v-else>
                                        ACTION:
                                        {{ decision.action.toUpperCase() }}
                                    </template>
                                </div>
                            </div>
                            <div class="reasoning-text">
                                <p>{{ decision.reasoning }}</p>
                            </div>
                        </div>
                        <div
                            v-if="decisions.length === 0"
                            class="model-reasoning"
                        >
                            <div class="reasoning-text">
                                <p>
                                    No reasoning available yet. Click "Play Next
                                    Trick" to start.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Card from "~/components/Card.vue";

// Game state from API
const gameState = ref<any>(null);
const decisions = ref<any[]>([]);
const activityLog = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Get model assignments from route or use defaults
const route = useRoute();
const modelIds = ref([
    route.query.north || "anthropic/claude-haiku-4.5",
    route.query.east || "google/gemini-2.5-flash",
    route.query.south || "openai/gpt-5-mini",
    route.query.west || "xai/grok-4.1-fast-non-reasoning",
]);

// Computed values for display
const currentPhase = computed(() => {
    if (!gameState.value) return "LOADING";
    if (gameState.value.phase === "trump_selection") return "TRUMP SELECTION";
    if (gameState.value.phase === "playing") return "PLAYING";
    return "COMPLETE";
});

const currentTrick = computed(() => {
    return gameState.value?.completedTricks?.length || 0;
});

const trumpSuit = computed(() => {
    if (!gameState.value?.trump) return "?";
    const symbols: Record<string, string> = {
        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
        spades: "♠",
    };
    return symbols[gameState.value.trump] || gameState.value.trump;
});

const lastTrickWinner = computed(() => {
    const tricks = gameState.value?.completedTricks || [];
    if (tricks.length === 0) return "N/A";
    return tricks[tricks.length - 1]?.winner?.toUpperCase() || "N/A";
});

// Sample cards for demonstration (will be replaced with actual game state)
const playedCards = ref({
    west: { suit: "clubs" as const, rank: "9" as const },
    east: { suit: "hearts" as const, rank: "Q" as const },
    south: { suit: "hearts" as const, rank: "J" as const },
    center: { suit: "hearts" as const, rank: "J" as const },
});

// Initialize game
const initializeGame = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        const response = await $fetch("/api/new-game", {
            method: "POST",
            body: {
                modelIds: modelIds.value,
            },
        });

        gameState.value = response.gameState;
        activityLog.value.push(`Game started - ${response.message}`);
    } catch (e: any) {
        error.value = e.message || "Failed to initialize game";
        console.error("Failed to initialize game:", e);
    } finally {
        isLoading.value = false;
    }
};

// Play next round (trick or trump selection)
const playNextTrick = async () => {
    if (!gameState.value || isLoading.value) return;

    isLoading.value = true;
    error.value = null;

    try {
        const response = await $fetch("/api/play-next-round", {
            method: "POST",
            body: {
                gameState: gameState.value,
                modelIds: modelIds.value,
            },
        });

        gameState.value = response.gameState;
        decisions.value = response.decisions;

        // Add decisions to activity log
        response.decisions.forEach((decision: any, index: number) => {
            const step = activityLog.value.length + 1;
            const player = decision.player.toUpperCase();

            if ("card" in decision) {
                // Card play
                const card = `${decision.card.rank}${decision.card.suit === "hearts" ? "♥" : decision.card.suit === "diamonds" ? "♦" : decision.card.suit === "clubs" ? "♣" : "♠"}`;
                activityLog.value.push(
                    `${String(step).padStart(2, "0")} | [${player}] ACTION: PLAYED ${card}`,
                );
            } else {
                // Trump bid
                activityLog.value.push(
                    `${String(step).padStart(2, "0")} | [${player}] ACTION: ${decision.action.toUpperCase()}`,
                );
            }
        });

        activityLog.value.push(response.roundSummary);
    } catch (e: any) {
        error.value = e.message || "Failed to play next round";
        console.error("Failed to play next round:", e);
    } finally {
        isLoading.value = false;
    }
};

// Initialize game on mount
onMounted(() => {
    initializeGame();
});
</script>

<style scoped>
.game-container {
    min-height: 100vh;
    position: relative;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
        linear-gradient(rgba(255, 255, 255, 0.1) 2px, transparent 2px);
    background-size: 20px 20px;
    background-color: #0a0a0a;
    color: #fff;
    font-family: "Courier New", Consolas, Monaco, monospace;
}

.game-container::before {
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

.game-container > * {
    position: relative;
    z-index: 2;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.game-header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin: 0;
    color: #e5e7eb;
}

.bracket {
    color: #6b7280;
}

.accent {
    color: #a3e635;
}

.live-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    letter-spacing: 1px;
}

.live-dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}

.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid rgba(59, 130, 246, 0.5);
    padding: 0.5rem 1rem;
    border-radius: 0px;
    font-family: "Courier New", monospace;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    box-shadow: 4px 4px 0px rgba(59, 130, 246, 0.2);
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.game-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    height: calc(100vh - 65px);
    overflow: hidden;
}

/* Panel Styling */
.arena-panel,
.intelligence-panel {
    border: 3px solid rgba(163, 230, 53, 0.3);
    border-radius: 0px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        8px 8px 0px rgba(163, 230, 53, 0.2),
        0 0 40px rgba(0, 0, 0, 0.8);
    position: relative;
}

.arena-panel::before,
.intelligence-panel::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: linear-gradient(45deg,
        rgba(163, 230, 53, 0.1) 0%,
        transparent 50%,
        rgba(192, 132, 252, 0.1) 100%
    );
    z-index: -1;
    pointer-events: none;
}

.panel-header {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #9ca3af;
}

.comment {
    color: #6b7280;
}

.keyword {
    color: #c084fc;
}

.prompt-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.7rem;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    background: rgba(10, 10, 10, 0.8);
    color: #9ca3af;
    border: 2px solid rgba(107, 114, 128, 0.5);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 3px 3px 0px rgba(75, 85, 99, 0.3);
}

.prompt-button:hover {
    background: rgba(75, 85, 99, 0.3);
    border-color: #9ca3af;
    color: #e5e7eb;
    box-shadow: 4px 4px 0px rgba(75, 85, 99, 0.4);
    transform: translate(-1px, -1px);
}

.prompt-button:active {
    box-shadow: 1px 1px 0px rgba(75, 85, 99, 0.3);
    transform: translate(2px, 2px);
}

.prompt-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.primary-button {
    width: 100%;
    padding: 1.25rem 1.5rem;
    font-family: "Courier New", monospace;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    color: #a3e635;
    background: rgba(163, 230, 53, 0.08);
    border: 3px solid rgba(163, 230, 53, 0.5);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 8px 8px 0px rgba(163, 230, 53, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.primary-button:hover:not(:disabled) {
    background: rgba(163, 230, 53, 0.12);
    border-color: rgba(163, 230, 53, 0.7);
    box-shadow: 12px 12px 0px rgba(163, 230, 53, 0.4);
    transform: translate(-4px, -4px);
    color: #fff;
}

.primary-button:active:not(:disabled) {
    box-shadow: 4px 4px 0px rgba(163, 230, 53, 0.3);
    transform: translate(4px, 4px);
}

.primary-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.button-text {
    font-size: 1rem;
}

.button-arrow {
    font-size: 1.5rem;
    transition: transform 0.2s ease;
}

.primary-button:hover:not(:disabled) .button-arrow {
    transform: translateX(4px);
}

.alert {
    padding: 0.85rem 1rem;
    border-radius: 0.5rem;
    font-family: "Courier New", monospace;
    border: 1px solid;
}

.alert.error {
    background: rgba(248, 113, 113, 0.08);
    border-color: #f87171;
    color: #fecdd3;
}

/* Game State Header */
.game-state-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.2);
}

.state-info {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.state-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.state-label {
    color: #a3e635;
    font-weight: 500;
}

.state-value {
    color: #fbbf24;
}

.divider {
    color: #6b7280;
}

.trump-suit {
    color: #ef4444;
    font-size: 1rem;
    font-weight: 600;
}

/* Table View */
.table-view {
    flex: 1;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
}

.table-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    padding: 0 1rem;
    color: #e5e7eb;
}

.closing-brace {
    font-size: 0.875rem;
    color: #e5e7eb;
    padding: 1rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.card-table {
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 0px;
    flex: 1;
    display: grid;
    grid-template-areas:
        ". north ."
        "west center east"
        ". south .";
    grid-template-columns: 130px 1fr 130px;
    grid-template-rows: 80px 1fr 80px;
    padding: 0.5rem;
    gap: 0.5rem;
}

.player-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
}

.played-card {
    position: absolute;
}

.player-position.north .played-card {
    bottom: -70px;
    left: 50%;
    transform: translateX(-50%);
}

.player-position.south .played-card {
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
}

.player-position.west .played-card {
    right: -85px;
    top: 50%;
    transform: translateY(-50%);
}

.player-position.east .played-card {
    left: -85px;
    top: 50%;
    transform: translateY(-50%);
}

.player-position.north {
    grid-area: north;
}

.player-position.west {
    grid-area: west;
}

.player-position.east {
    grid-area: east;
}

.player-position.south {
    grid-area: south;
}

.center-area {
    grid-area: center;
    display: grid;
    grid-template-areas:
        ". card-north ."
        "card-west . card-east"
        ". card-south .";
    grid-template-columns: 90px 90px 90px;
    grid-template-rows: 120px 120px 120px;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.center-card {
    grid-area: card-north;
}

.thinking-box {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    border: 3px solid #3b82f6;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    box-shadow:
        0 0 40px rgba(59, 130, 246, 0.6),
        0 0 80px rgba(59, 130, 246, 0.4),
        inset 0 0 30px rgba(59, 130, 246, 0.2);
    text-align: center;
    position: relative;
    animation: thinkingGlow 2s ease-in-out infinite;
}

@keyframes thinkingGlow {
    0%, 100% {
        box-shadow:
            0 0 40px rgba(59, 130, 246, 0.6),
            0 0 80px rgba(59, 130, 246, 0.4),
            inset 0 0 30px rgba(59, 130, 246, 0.2);
    }
    50% {
        box-shadow:
            0 0 60px rgba(59, 130, 246, 0.8),
            0 0 120px rgba(59, 130, 246, 0.5),
            inset 0 0 40px rgba(59, 130, 246, 0.3);
    }
}

.position-label {
    color: #93c5fd;
    font-size: 0.75rem;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
}

.thinking-text {
    font-size: 1.25rem;
    font-weight: bold;
    letter-spacing: 2px;
}

.gear-icon {
    width: 16px;
    height: 16px;
    stroke-width: 2;
}

.card-placeholder {
    width: 80px;
    height: 112px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid #444;
    border-radius: 4px;
}

.player-info {
    text-align: center;
    font-size: 0.75rem;
}

.player-name {
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 0.25rem;
}

.model-name {
    color: #9ca3af;
    margin-bottom: 0.25rem;
}

.status {
    color: #6b7280;
    font-size: 0.7rem;
}

/* Intelligence Panel */
.intelligence-panel {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 80px);
}

.activity-log {
    border-bottom: 1px solid #333;
    padding: 1rem;
}

.log-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #e5e7eb;
}

.log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.log-entry {
    color: #d1d5db;
}

.live-reasoning {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
}

.reasoning-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    color: #e5e7eb;
}

.reasoning-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.model-reasoning {
    border: 1px solid #374151;
    border-radius: 4px;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
}

.model-reasoning.active {
    border-color: rgba(163, 230, 53, 0.3);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.15);
    background: rgba(163, 230, 53, 0.03);
}

.model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.model-position {
    font-weight: bold;
    letter-spacing: 1px;
}

.indicator {
    color: #6b7280;
    font-size: 1.5rem;
}

.indicator.active {
    color: #a3e635;
    animation: pulse 2s ease-in-out infinite;
}

.model-details {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 0.75rem;
}

.model-id {
    margin-bottom: 0.25rem;
}

.action {
    color: #d1d5db;
}

.reasoning-text {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #e5e7eb;
}

.reasoning-text p {
    margin-bottom: 0.5rem;
}

/* Game Controls */
.game-controls {
    padding: 1.5rem 2rem;
}

.error-message {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #fca5a5;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    text-align: center;
}
</style>
