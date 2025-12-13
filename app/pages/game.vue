<template>
    <div class="game-container">
        <header class="game-header">
            <div class="header-left">
                <NuxtLink to="/" class="logo-link">
                    <h1><span class="bracket">&lt;</span>euchre.<span class="accent">arena</span><span class="bracket"> /&gt;</span></h1>
                </NuxtLink>
            </div>
            <div class="header-center">
                <div class="mode-switcher">
                    <NuxtLink
                        to="/game"
                        class="mode-tab active"
                    >
                        // Arena
                    </NuxtLink>
                    <NuxtLink
                        to="/analysis"
                        class="mode-tab"
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
            </div>
        </header>

        <div class="game-content">
            <!-- Left Panel: Arena View -->
            <main class="main-panel" aria-label="Game board">
                <BasePanelHeader title="arena" />

                <!-- Table View / Game Summary -->
                <div v-if="!gameStore.isGameComplete" class="table-view">
                        <!-- Game Info (top left) -->
                        <div class="game-info-overlay">
                            <div class="game-info-box" :class="{ 'game-complete': gameStore.isGameComplete }">
                                <LiveStatusBanner />
                                <GameMetaInfo />
                            </div>
                        </div>

                        <GameBoard
                            :player-hands="gameStore.playerHands"
                            :played-cards="gameStore.activePlayedCards"
                            :formatted-models="formattedModelsByPosition"
                            :turned-up-card="gameStore.turnedUpCard"
                            :current-player="gameStore.currentThinkingPlayer"
                            :is-streaming="gameStore.isStreaming"
                            :going-alone="gameStore.goingAlone"
                            :dealer="gameStore.dealer"
                            :tricks-won="tricksWonByPlayer"
                        />
                    </div>

                    <!-- Game Summary (shown when game is complete) -->
                    <GameSummary
                        v-else
                        :game-state="gameStore.gameState!"
                        :model-ids="gameStore.modelIds"
                        @new-game="handleNewGame"
                    />
            </main>

            <!-- Right Panel: Intelligence Sidebar -->
            <aside class="side-panel" aria-label="Game information">
                <BasePanelHeader title="intelligence" />

                <!-- Activity Log (on top) -->
                <ActivityLog :entries="activityLog" class="activity-log-fixed" />

                <!-- Tool Panel (Metacognition Arena) -->
                <ToolPanel class="tool-section-sidebar" />

                <!-- Real-Time Streaming Reasoning -->
                <StreamingReasoning
                    :player="gameStore.displayedReasoningPlayer"
                    :reasoning="gameStore.displayedReasoningPlayer ? (gameStore.streamingReasoning[gameStore.displayedReasoningPlayer] ?? '') : ''"
                    class="reasoning-fixed"
                />

                <!-- Action Buttons -->
                <div class="history-section">
                    <button
                        class="history-button prompt-button-action"
                        type="button"
                        :disabled="!gameStore.gameState"
                        @click="showPromptModal = true"
                    >
                        <span class="button-text">viewPrompt()</span>
                        <span class="cursor-prompt">&gt;_</span>
                    </button>
                    <button
                        class="history-button"
                        type="button"
                        @click="showReasoningModal = true"
                    >
                        <span class="button-text">viewHistory()</span>
                        <span class="cursor-prompt">&gt;_</span>
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

        <!-- Prompt Viewer Modal -->
        <PromptModal
            :is-open="showPromptModal"
            @close="showPromptModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import ReasoningModal from "~/components/ReasoningModal.vue";
import ScoringModal from "~/components/ScoringModal.vue";
import PromptModal from "~/components/PromptModal.vue";
import LiveStatusBanner from "~/components/LiveStatusBanner.vue";
import GameMetaInfo from "~/components/GameMetaInfo.vue";
import GameControls from "~/components/GameControls.vue";
import GameBoard from "~/components/GameBoard.vue";
import GameSummary from "~/components/GameSummary.vue";
import ActivityLog from "~/components/ActivityLog.vue";
import StreamingReasoning from "~/components/StreamingReasoning.vue";
import ToolPanel from "~/components/ToolPanel.vue";
import { usePlayerInfo } from "~/composables/usePlayerInfo";
import { useGameStore } from "~/stores/game";
import { useGameStreaming } from "~/composables/useGameStreaming";
import { useGameApi } from "~/composables/useGameApi";
import { formatSuit } from "../../lib/game/formatting";
import { startNewHand } from "../../lib/game/game";
import {
    formatCardPlayEntry,
    formatTrumpBidEntry,
    formatDiscardEntry,
    formatIllegalAttemptEntry,
    formatErrorEntry,
    formatTrumpSelectionComplete,
    formatTrickComplete,
    formatHandComplete,
    formatGameComplete,
    formatNewHandStart,
    formatGameInitialized,
} from "~/utils/activityLog";
import type { SSEMessage, SSERoundComplete } from "../../lib/types/sse";
import type { Position } from "../../lib/game/types";



// Pinia store - single source of truth
const gameStore = useGameStore();

// Composables
const { initializeGame, isCreatingGame } = useGameApi();
const { formattedModelsByPosition } = usePlayerInfo();
const { streamGameRound } = useGameStreaming();

// Helper to determine if two positions are on the same team
const sameTeam = (pos1: Position, pos2: Position): boolean => {
    const team1 = ['north', 'south'];
    const team2 = ['east', 'west'];
    return (team1.includes(pos1) && team1.includes(pos2)) ||
           (team2.includes(pos1) && team2.includes(pos2));
};

// Score card plays after a trick completes
const scoreTrickPlays = (trickNumber: number, trickWinner: Position) => {
    const currentHand = gameStore.getCurrentHand();
    if (!currentHand) return;

    const trick = currentHand.tricks.find(t => t.trickNumber === trickNumber);
    if (!trick) return;

    for (const play of trick.plays) {
        // Only score if we have confidence data
        if (play.confidence === undefined) continue;

        // Was this player's team the winner?
        const wasCorrect = sameTeam(play.player, trickWinner);

        // Record the decision outcome for scoring (card_play type)
        gameStore.recordDecisionOutcome(
            play.player,
            play.confidence,
            wasCorrect,
            play.toolUsed ? { tool: play.toolUsed.tool, cost: play.toolUsed.cost } : null,
            'card_play'
        );
    }
};

// Score trump decisions after a hand completes
// Trump calls are weighted higher and depend on points scored
const scoreTrumpDecisions = (handScores: [number, number]) => {
    const currentHand = gameStore.getCurrentHand();
    if (!currentHand || !currentHand.trumpCaller) return;

    // Determine which team called trump and if they made the bid
    const callerTeam = ['north', 'south'].includes(currentHand.trumpCaller) ? 0 : 1;
    const callerMadeBid = handScores[callerTeam] > 0;
    const pointsForCaller = callerMadeBid ? handScores[callerTeam] : -2; // Euchred = -2

    for (const decision of currentHand.trumpDecisions) {
        if (decision.confidence === undefined) continue;

        const toolUsed = decision.toolUsed
            ? { tool: decision.toolUsed.tool, cost: decision.toolUsed.cost }
            : null;

        if (decision.action === 'pass') {
            // Passing is correct if your team didn't call OR if calling would have failed
            // For now, just score it neutrally based on whether the hand went well for their team
            const playerTeam = ['north', 'south'].includes(decision.player) ? 0 : 1;
            const theirTeamWon = handScores[playerTeam] > 0;

            gameStore.recordDecisionOutcome(
                decision.player,
                decision.confidence,
                theirTeamWon,
                toolUsed,
                'trump_pass'
            );
        } else {
            // order_up or call_trump - this is the trump caller
            // Correct if they made the bid, wrong if euchred
            gameStore.recordDecisionOutcome(
                decision.player,
                decision.confidence,
                callerMadeBid,
                toolUsed,
                'trump_call',
                pointsForCaller
            );
        }
    }
};

// Call the analysis API after a hand completes
const analyzeCompletedHand = async (handNumber: number, handScores: [number, number]) => {
    const currentHand = gameStore.getCurrentHand();
    if (!currentHand) {
        console.warn('No hand record found for analysis');
        return;
    }

    // Determine outcome
    const nsPoints = handScores[0];
    const ewPoints = handScores[1];
    const winningTeam = nsPoints > 0 ? 'NS' : 'EW';
    const points = Math.max(nsPoints, ewPoints);

    // Determine calling team from trump decisions
    const callerDecision = currentHand.trumpDecisions.find(
        d => d.action === 'order_up' || d.action === 'call_trump'
    );
    const callingTeam = callerDecision
        ? (['north', 'south'].includes(callerDecision.player) ? 'NS' : 'EW')
        : winningTeam;

    // Transform trump decisions to API format
    const trumpDecisions = currentHand.trumpDecisions.map(d => ({
        player: d.player,
        action: d.action === 'pass' ? 'pass' as const :
                d.action === 'order_up' ? 'call' as const : 'call_suit' as const,
        confidence: d.confidence,
        reasoning: d.reasoning,
        suit: d.suit,
    }));

    // Transform tricks to API format
    const tricks = currentHand.tricks
        .filter(t => t.winner !== null)
        .map(t => ({
            plays: t.plays.map(p => ({
                player: p.player,
                card: p.card,
                confidence: p.confidence,
                reasoning: p.reasoning,
            })),
            winner: t.winner!,
        }));

    // Build outcome object
    const wasEuchred = callingTeam !== winningTeam;
    const wasMarch = points >= 2 && !wasEuchred;
    const wasLoner = currentHand.goingAlone !== null;

    const outcome = {
        callingTeam: callingTeam as 'NS' | 'EW',
        winningTeam: winningTeam as 'NS' | 'EW',
        points,
        wasEuchred,
        wasMarch,
        wasLoner,
    };

    try {
        gameStore.setAnalyzing(true);

        const response = await $fetch('/api/analyze-hand', {
            method: 'POST',
            body: {
                handNumber,
                trumpDecisions,
                tricks,
                outcome,
                modelIds: gameStore.modelIds,
                previousInsights: gameStore.evolvedInsights,
            },
        });

        if (response.success) {
            gameStore.updateInsights(response.insights, response.handSummary);
        }
    } catch (error) {
        console.error('Hand analysis failed:', error);
    } finally {
        gameStore.setAnalyzing(false);
        gameStore.incrementHandCount();
    }
};

// Generate reflections for each agent after a hand completes
const generateAgentReflections = async (handNumber: number, handScores: [number, number]) => {
    const currentHand = gameStore.getCurrentHand();
    if (!currentHand) return;

    const positions: Position[] = ['north', 'east', 'south', 'west'];
    const nsPoints = handScores[0];
    const ewPoints = handScores[1];
    const winningTeam = nsPoints > 0 ? 'NS' : 'EW';
    const points = Math.max(nsPoints, ewPoints);

    // Find the trump caller
    const callerDecision = currentHand.trumpDecisions.find(
        d => d.action === 'order_up' || d.action === 'call_trump'
    );
    const callingTeam = callerDecision
        ? (['north', 'south'].includes(callerDecision.player) ? 'NS' : 'EW')
        : winningTeam;

    const wasEuchred = callingTeam !== winningTeam;
    const wasMarch = points >= 2 && !wasEuchred;

    // Build summaries for each agent
    const summaries = positions.map(position => {
        const playerTeam = ['north', 'south'].includes(position) ? 'NS' : 'EW';
        const teamWon = playerTeam === winningTeam;
        const isOnCallingTeam = playerTeam === callingTeam;

        // Find this player's trump decision
        const playerTrumpDecision = currentHand.trumpDecisions.find(d => d.player === position);

        // Count tricks won by this player's team
        const tricksWon = currentHand.tricks.filter(t => {
            if (!t.winner) return false;
            const winnerTeam = ['north', 'south'].includes(t.winner) ? 'NS' : 'EW';
            return winnerTeam === playerTeam;
        }).length;

        // Find tool usage in this hand
        const toolUsed = playerTrumpDecision?.toolUsed
            ? { tool: playerTrumpDecision.toolUsed.tool, cost: playerTrumpDecision.toolUsed.cost }
            : currentHand.tricks
                .flatMap(t => t.plays)
                .find(p => p.player === position && p.toolUsed)?.toolUsed
                ? { tool: currentHand.tricks.flatMap(t => t.plays).find(p => p.player === position && p.toolUsed)!.toolUsed!.tool, cost: currentHand.tricks.flatMap(t => t.plays).find(p => p.player === position && p.toolUsed)!.toolUsed!.cost }
                : null;

        return {
            handNumber,
            position,
            modelId: gameStore.modelIds[position],
            trumpDecision: playerTrumpDecision ? {
                action: playerTrumpDecision.action,
                suit: playerTrumpDecision.suit,
                confidence: playerTrumpDecision.confidence,
                wasSuccessful: !wasEuchred || !isOnCallingTeam,
            } : null,
            tricksWon,
            toolUsed,
            outcome: {
                winningTeam: winningTeam as 'NS' | 'EW',
                callingTeam: callingTeam as 'NS' | 'EW',
                wasEuchred,
                wasMarch,
                points,
            },
            isOnCallingTeam,
            teamWon,
        };
    });

    // Get previous reflections per agent
    const previousReflections: Record<Position, string[]> = {
        north: gameStore.getReflections('north').map(r => r.reflection),
        east: gameStore.getReflections('east').map(r => r.reflection),
        south: gameStore.getReflections('south').map(r => r.reflection),
        west: gameStore.getReflections('west').map(r => r.reflection),
    };

    try {
        gameStore.setGeneratingReflections(true);

        const response = await $fetch('/api/generate-reflections', {
            method: 'POST',
            body: {
                summaries,
                previousReflections,
            },
        });

        if (response.success && response.reflections) {
            for (const reflection of response.reflections) {
                gameStore.addReflection(reflection.position, handNumber, reflection.reflection);
            }
        }
    } catch (error) {
        console.error('Reflection generation failed:', error);
    } finally {
        gameStore.setGeneratingReflections(false);
    }
};

// Activity log for tracking game events
const activityLog = ref<string[]>([]);

// Modals
const showReasoningModal = ref(false);
const showScoringModal = ref(false);
const showPromptModal = ref(false);

// Calculate tricks won by each player from completedTricks
const tricksWonByPlayer = computed(() => {
    const counts = { north: 0, south: 0, east: 0, west: 0 };
    for (const trick of gameStore.completedTricks) {
        if (trick.winner && counts[trick.winner] !== undefined) {
            counts[trick.winner]++;
        }
    }
    return counts;
});

// Handle game initialization
const handleInitializeGame = async () => {
    try {
        const result = await initializeGame(
            gameStore.modelIdsArray,
            undefined,
            gameStore.configuredWinningScore
        );
        activityLog.value.push(formatGameInitialized());
        
        // Start recording the first hand
        const gs = result.gameState;
        gameStore.startNewHandRecord(
            gs.handNumber,
            gs.dealer,
            gs.trumpSelection?.turnedUpCard || null
        );
    } catch (e) {
        console.error("Failed to initialize game:", e);
    }
};

// Handle playing next round with SSE streaming
const handlePlayNextRound = async () => {
    if (!gameStore.gameState || gameStore.isStreaming) return;

    // Clear streaming state and start
    gameStore.clearStreamingState();
    gameStore.startStreaming();

    try {
        // Build reflections for injection into prompts
        const agentReflections: Partial<Record<Position, string[]>> = {};
        for (const position of ['north', 'east', 'south', 'west'] as Position[]) {
            const reflections = gameStore.getReflections(position);
            if (reflections.length > 0) {
                agentReflections[position] = reflections.map(r => r.reflection);
            }
        }

        for await (const message of streamGameRound(gameStore.gameState, {
            strategyHints: gameStore.strategyHints,
            agentReflections,
        })) {
            switch (message.type) {
                case 'player_thinking':
                    gameStore.setThinkingPlayer(message.player!);
                    break;

                case 'reasoning_token':
                    if (message.player && message.token) {
                        gameStore.appendReasoning(message.player, message.token);
                    }
                    break;

                case 'tool_request':
                    // Metacognition Arena: Agent requested a tool
                    if (message.tool && message.cost !== undefined) {
                        gameStore.setToolRequest(message.tool, message.cost);
                    }
                    break;

                case 'tool_progress':
                    // Metacognition Arena: Tool execution progress
                    if (message.message) {
                        gameStore.setToolProgress(message.message);
                    }
                    break;

                case 'tool_result':
                    // Metacognition Arena: Tool execution completed
                    if (message.tool && message.result !== undefined) {
                        gameStore.setToolResult(
                            message.tool,
                            message.result,
                            message.cost || 0,
                            message.duration || 0
                        );
                    }
                    break;

                case 'response_phase':
                    // Metacognition Arena: Agent starting second decision with tool result
                    gameStore.startResponsePhase();
                    break;

                case 'illegal_attempt':
                    const illegalStep = activityLog.value.length + 1;
                    activityLog.value.push(
                        formatIllegalAttemptEntry(
                            illegalStep,
                            message.player!,
                            message.attemptedCard!,
                            message.isFallback || false
                        )
                    );
                    break;

                case 'decision_made':
                    const step = activityLog.value.length + 1;
                    const reasoning = message.reasoning || gameStore.streamingReasoning[message.player!] || 'No reasoning provided';

                    // Track confidence for Metacognition Arena
                    if (message.confidence !== undefined) {
                        gameStore.setLastConfidence(message.confidence);
                    }

                    if (message.action === 'discard' && message.card) {
                        // Dealer discarding after order_up
                        activityLog.value.push(
                            formatDiscardEntry(step, message.player!, message.card)
                        );
                    } else if (message.card) {
                        // Card play
                        activityLog.value.push(
                            formatCardPlayEntry(step, message.player!, message.card)
                        );
                        gameStore.recordCardPlayed(message.player!, message.card);
                        
                        // Record to game history (including tool usage and confidence)
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
                    } else {
                        // Trump decision
                        activityLog.value.push(
                            formatTrumpBidEntry(step, message.player!, message.action!, message.goingAlone)
                        );
                        
                        // For order_up, the trump suit is the turned-up card's suit
                        const trumpSuit = message.action === 'order_up'
                            ? gameStore.turnedUpCard?.suit
                            : message.suit;
                        
                        // Record to game history (including tool usage and confidence)
                        if (message.action === 'pass' || message.action === 'order_up' || message.action === 'call_trump') {
                            gameStore.recordTrumpDecision({
                                player: message.player!,
                                modelId: message.modelId!,
                                action: message.action as 'pass' | 'order_up' | 'call_trump',
                                suit: trumpSuit,
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

                case 'round_complete':
                    gameStore.setGameState(message.gameState!);
                    // Commit pending plays - they're now confirmed by the server
                    gameStore.commitPendingPlays();

                    // Format activity log entry based on phase
                    if (message.phase === 'trump_selection_round_1' || message.phase === 'trump_selection_round_2') {
                        activityLog.value.push(formatTrumpSelectionComplete({
                            selectionRound: message.selectionRound || 1,
                            allPassed: message.allPassed || false,
                            trumpSelectionResult: message.trumpSelectionResult,
                        }));
                    } else if (message.phase === 'game_complete') {
                        activityLog.value.push(formatTrickComplete({
                            trickNumber: message.trickNumber!,
                            trickWinner: message.trickWinner!,
                        }));
                        activityLog.value.push(formatGameComplete({
                            gameScores: message.gameScores!,
                            winningTeam: message.winningTeam!,
                        }));
                        // Record trick winner and hand completion to history
                        if (message.trickNumber && message.trickWinner) {
                            gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                            // Score the plays from this trick (Metacognition Arena)
                            scoreTrickPlays(message.trickNumber, message.trickWinner as Position);
                        }
                        const finalWinningTeam = message.winningTeam === 0 ? 'NS' : 'EW';
                        // Score trump decisions based on hand outcome (Metacognition Arena)
                        scoreTrumpDecisions(message.handScores || [0, 0]);
                        gameStore.recordHandComplete(finalWinningTeam, message.handScores || [0, 0]);
                        // Analyze the final hand (async, non-blocking)
                        analyzeCompletedHand(
                            message.handNumber || gameStore.handNumber,
                            (message.handScores || [0, 0]) as [number, number]
                        );
                        // Generate agent reflections (async, non-blocking)
                        generateAgentReflections(
                            message.handNumber || gameStore.handNumber,
                            (message.handScores || [0, 0]) as [number, number]
                        );
                    } else if (message.phase === 'hand_complete') {
                        activityLog.value.push(formatTrickComplete({
                            trickNumber: message.trickNumber!,
                            trickWinner: message.trickWinner!,
                        }));
                        activityLog.value.push(formatHandComplete({
                            handNumber: message.handNumber!,
                            handScores: message.handScores!,
                            gameScores: message.gameScores!,
                        }));
                        // Record trick winner and hand completion to history
                        if (message.trickNumber && message.trickWinner) {
                            gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                            // Score the plays from this trick (Metacognition Arena)
                            scoreTrickPlays(message.trickNumber, message.trickWinner as Position);
                        }
                        const handWinningTeam = message.handScores![0] > message.handScores![1] ? 'NS' : 'EW';
                        // Score trump decisions based on hand outcome (Metacognition Arena)
                        scoreTrumpDecisions(message.handScores!);
                        gameStore.recordHandComplete(handWinningTeam, message.handScores!);
                        // Analyze the completed hand (async, non-blocking)
                        analyzeCompletedHand(message.handNumber!, message.handScores! as [number, number]);
                        // Generate agent reflections (async, non-blocking)
                        generateAgentReflections(message.handNumber!, message.handScores! as [number, number]);
                    } else if (message.phase === 'playing_trick') {
                        activityLog.value.push(formatTrickComplete({
                            trickNumber: message.trickNumber!,
                            trickWinner: message.trickWinner!,
                        }));
                        // Record trick winner to history
                        if (message.trickNumber && message.trickWinner) {
                            gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                            // Score the plays from this trick (Metacognition Arena)
                            scoreTrickPlays(message.trickNumber, message.trickWinner as Position);
                        }
                    }

                    // Set trick winner for UI display
                    if (message.trickWinner) {
                        gameStore.setTrickWinner(message.trickWinner as Position);
                    }
                    break;

                case 'error':
                    console.error('SSE error:', message.message);
                    throw new Error(message.message);
            }
        }
    } catch (error) {
        console.error('Streaming Error:', error);
        gameStore.rollbackPendingPlays();
        gameStore.clearStreamingState();
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
        activityLog.value.push(formatErrorEntry(errorMsg));
    } finally {
        gameStore.stopStreaming();
    }
};

// Handle starting a new hand when current hand is complete
const handleStartNextHand = () => {
    if (!gameStore.gameState || gameStore.phase !== 'hand_complete') return;

    try {
        const newGameState = startNewHand(gameStore.gameState);
        gameStore.setGameState(newGameState);
        gameStore.clearStreamingState();
        
        // Start recording the new hand
        gameStore.startNewHandRecord(
            newGameState.handNumber,
            newGameState.dealer,
            newGameState.trumpSelection?.turnedUpCard || null
        );
        activityLog.value.push(formatNewHandStart(newGameState.handNumber, newGameState.dealer));
    } catch (error) {
        console.error('Failed to start new hand:', error);
        activityLog.value.push(formatErrorEntry('Failed to start new hand'));
    }
};

// Unified play handler that handles both rounds and hand transitions
const handlePlayNext = async () => {
    if (!gameStore.gameState || gameStore.isStreaming) return;

    // If hand is complete, start new hand first
    if (gameStore.phase === 'hand_complete') {
        handleStartNextHand();
        // After starting new hand, continue to play if auto-mode is on
        if (!gameStore.autoMode) return;
    }

    // Now play the next round
    await handlePlayNextRound();
};

// Auto-mode orchestration
let autoModeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleNextAutoPlay = () => {
    if (!gameStore.autoMode || gameStore.isStreaming || gameStore.isGameComplete) {
        return;
    }

    // Clear any existing timeout
    if (autoModeTimeoutId) {
        clearTimeout(autoModeTimeoutId);
    }

    // Schedule next play after delay
    autoModeTimeoutId = setTimeout(async () => {
        // Double-check conditions before playing
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
        } else if (!autoMode && autoModeTimeoutId) {
            // Auto-mode turned off, cancel pending timeout
            clearTimeout(autoModeTimeoutId);
            autoModeTimeoutId = null;
        }
    },
    { immediate: true }
);

// Clean up on unmount
onUnmounted(() => {
    if (autoModeTimeoutId) {
        clearTimeout(autoModeTimeoutId);
    }
});

// Handle new game - reset and navigate to index
const handleNewGame = () => {
    gameStore.reset();
    navigateTo('/');
};

// Rebuild activity log from game history when returning to page
const reconstructActivityLog = () => {
    const entries: string[] = [];
    let step = 1;

    entries.push(formatGameInitialized());
    step++;

    for (const hand of gameStore.gameHistory.hands) {
        if (hand.handNumber > 1) {
            entries.push(formatNewHandStart(hand.handNumber, hand.dealer));
            step++;
        }

        for (const decision of hand.trumpDecisions) {
            if (decision.action === "pass") {
                entries.push(formatTrumpBidEntry(step, decision.player, "pass"));
            } else if (decision.action === "order_up" || decision.action === "call_trump") {
                entries.push(formatTrumpBidEntry(step, decision.player, `${decision.action} ${decision.suit}`, decision.goingAlone));
            }
            step++;
        }

        for (const trick of hand.tricks) {
            for (const play of trick.plays) {
                entries.push(formatCardPlayEntry(step, play.player, play.card));
                step++;
            }
            if (trick.winner) {
                entries.push(formatTrickComplete({
                    type: "round_complete",
                    phase: "trick_complete",
                    trickWinner: trick.winner,
                }));
                step++;
            }
        }
    }

    return entries;
};

onMounted(() => {
    if (gameStore.gameState) {
        activityLog.value = reconstructActivityLog();
    } else {
        handleInitializeGame();
    }
});
</script>

<style scoped>
.game-container {
    height: 100vh;
    overflow: hidden;
    position: relative;
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

.header-center {
    display: flex;
    justify-content: center;
    flex: 1;
}

.header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.header-controls {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
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

.game-header h1 {
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
    background: var(--color-live);
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
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

/* Panel Styling */
.main-panel {
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 12px;
    background: rgba(10, 20, 20, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        0 0 40px rgba(0, 0, 0, 0.6),
        0 0 15px rgba(56, 189, 186, 0.15),
        inset 0 0 30px rgba(56, 189, 186, 0.03);
    position: relative;
}

.side-panel {
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 12px;
    background: rgba(10, 20, 20, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        0 0 40px rgba(0, 0, 0, 0.6),
        0 0 20px rgba(56, 189, 186, 0.1),
        inset 0 0 30px rgba(56, 189, 186, 0.02);
    position: relative;
}

.main-panel::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg,
        rgba(56, 189, 186, 0.05) 0%,
        transparent 50%,
        rgba(56, 189, 186, 0.05) 100%
    );
    z-index: -1;
    pointer-events: none;
}

.side-panel::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg,
        rgba(56, 189, 186, 0.05) 0%,
        transparent 50%,
        rgba(56, 189, 186, 0.05) 100%
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
    color: var(--color-text-secondary);
}

.comment {
    color: var(--color-text-muted);
}

.keyword {
    color: var(--color-keyword);
}

.prompt-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.7rem;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    background: rgba(10, 10, 10, 0.8);
    color: var(--color-text-secondary);
    border: 2px solid rgba(107, 114, 128, 0.5);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 3px 3px 0px rgba(75, 85, 99, 0.3);
}

.prompt-button:hover {
    background: rgba(75, 85, 99, 0.3);
    border-color: var(--color-text-secondary);
    color: var(--color-text);
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
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.08);
    border: 3px solid rgba(56, 189, 186, 0.5);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 4px 4px 0px rgba(56, 189, 186, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.primary-button:hover:not(:disabled) {
    background: rgba(56, 189, 186, 0.12);
    border-color: rgba(56, 189, 186, 0.7);
    box-shadow: 6px 6px 0px rgba(56, 189, 186, 0.3);
    transform: translate(-2px, -2px);
    color: #fff;
}

.primary-button:active:not(:disabled) {
    box-shadow: 2px 2px 0px rgba(56, 189, 186, 0.2);
    transform: translate(2px, 2px);
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

/* Table View */
.table-view {
    flex: 1;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 0; /* Allow flex child to shrink */
    overflow: hidden;
}

.game-info-overlay {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 10;
}

.game-info-container {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.game-info-box {
    border: 2px solid rgba(56, 189, 186, 0.5);
    background: rgba(10, 20, 20, 0.9);
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-width: clamp(220px, 25vw, 320px);
    border-radius: 8px;
    box-shadow:
        0 0 20px rgba(56, 189, 186, 0.2),
        0 0 40px rgba(56, 189, 186, 0.1),
        inset 0 0 20px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
}

.game-info-box.game-complete {
    border-color: rgba(56, 189, 186, 0.6);
    background: rgba(56, 189, 186, 0.05);
    box-shadow: 0 0 20px rgba(56, 189, 186, 0.2);
}

.game-controls-row {
    display: flex;
    align-items: center;
}

.game-info-container.compact {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
}

.game-info-container.compact .game-info-box {
    width: 100%;
}

/* Side Panel */
.side-panel {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 80px);
    overflow: hidden;
}

/* Fixed height panels for activity log and reasoning */
.activity-log-fixed {
    height: 180px;
    min-height: 180px;
    max-height: 180px;
    overflow-y: auto;
    flex-shrink: 0;
}

.reasoning-fixed {
    flex: 1;
    min-height: 150px;
    overflow-y: auto;
}

.new-game-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    background: rgba(56, 189, 186, 0.1);
    border: 2px solid rgba(56, 189, 186, 0.4);
    color: #38bdb8;
    font-family: "Courier New", monospace;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0;
    box-shadow: 4px 4px 0px rgba(56, 189, 186, 0.2);
}

.new-game-button:hover {
    background: rgba(56, 189, 186, 0.2);
    border-color: rgba(56, 189, 186, 0.6);
    color: #fff;
    box-shadow: 6px 6px 0px rgba(56, 189, 186, 0.3);
    transform: translate(-2px, -2px);
}

.new-game-button:active {
    box-shadow: 2px 2px 0px rgba(56, 189, 186, 0.2);
    transform: translate(2px, 2px);
}

.button-text {
    letter-spacing: 0.025em;
}

.button-arrow {
    font-size: 1.25rem;
    transition: transform 0.2s ease;
}

.new-game-button:hover .button-arrow {
    transform: translateX(4px);
}

.history-section,
.history-section-inline {
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 0.5rem;
}

.history-button {
    padding: 0.75rem 1.25rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.05);
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
}

.history-button:hover {
    background: rgba(56, 189, 186, 0.1);
    border-color: rgba(56, 189, 186, 0.5);
    color: #fff;
}

.history-button:active {
    background: rgba(56, 189, 186, 0.15);
}

.history-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.history-button:disabled:hover {
    background: rgba(56, 189, 186, 0.05);
    border-color: rgba(56, 189, 186, 0.3);
    color: #38bdb8;
}

.history-button .badge {
    background: rgba(56, 189, 186, 0.15);
    border: 1px solid rgba(56, 189, 186, 0.3);
    padding: 0.15rem 0.5rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 24px;
    text-align: center;
}

.cursor-prompt {
    font-family: "Courier New", monospace;
    color: #38bdb8;
    font-weight: 600;
}

/* Game Controls */
.game-controls {
    padding: 1.5rem 2rem;
}

.error-message {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid var(--color-error);
    border-radius: 4px;
    color: #fca5a5;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    text-align: center;
}

/* Analysis Mode Layout */
.analysis-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    min-height: 0;
    overflow: hidden;
}

.grid-panel {
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.grid-panel > * {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

/* Scoring Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.scoring-modal {
    background: rgba(10, 20, 20, 0.98);
    border: 2px solid rgba(56, 189, 186, 0.5);
    border-radius: 12px;
    max-width: 650px;
    width: 95%;
    max-height: 85vh;
    overflow: auto;
    box-shadow: 0 0 40px rgba(56, 189, 186, 0.3);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.close-btn {
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 1.75rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s;
}

.close-btn:hover {
    color: #f87171;
}

/* Scoring Modal Content */
.scoring-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.scoring-content .scoring-section {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem 1.25rem;
}

.scoring-content .section-title {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38bdb8;
    margin-bottom: 0.75rem;
    font-weight: 600;
}

/* Scoring Table */
.scoring-content .scoring-table {
    font-size: 0.9375rem;
    font-family: "Courier New", monospace;
}

.scoring-content .table-header {
    display: grid;
    grid-template-columns: 1fr 80px 80px;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
}

.scoring-content .table-row {
    display: grid;
    grid-template-columns: 1fr 80px 80px;
    gap: 1rem;
    padding: 0.625rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.scoring-content .table-row:last-child {
    border-bottom: none;
}

.scoring-content .col-confidence {
    color: var(--color-text-secondary);
}

.scoring-content .col-confidence.high {
    color: #a3e635;
}

.scoring-content .col-confidence.medium {
    color: #fbbf24;
}

.scoring-content .col-confidence.low {
    color: #f87171;
}

.scoring-content .col-correct,
.scoring-content .col-wrong {
    text-align: center;
    font-weight: 600;
}

.scoring-content .positive {
    color: #a3e635;
}

.scoring-content .negative {
    color: #f87171;
}

.scoring-content .neutral {
    color: var(--color-text-muted);
}

/* Multiplier List */
.scoring-content .multiplier-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.scoring-content .multiplier-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9375rem;
    padding: 0.375rem 0;
}

.scoring-content .multiplier-label {
    color: var(--color-text-secondary);
    font-family: "Courier New", monospace;
}

.scoring-content .multiplier-value {
    font-family: "Courier New", monospace;
    font-weight: 600;
    color: var(--color-text-primary);
}

.scoring-content .multiplier-value.bonus {
    color: #a3e635;
}

.scoring-content .multiplier-value.penalty {
    color: #f87171;
}

/* Explanation */
.scoring-content .explanation {
    font-family: "Courier New", monospace;
}

.scoring-content .explanation .formula {
    font-size: 0.9375rem;
    margin: 0;
    padding: 0.5rem 0;
    color: var(--color-text-secondary);
}

.scoring-content .explanation .hint {
    font-size: 0.8125rem;
    margin: 0;
    color: var(--color-text-muted);
}

.performance-section {
    flex-shrink: 0;
}

.tool-section {
    flex-shrink: 0;
}

.tool-section-sidebar {
    flex-shrink: 0;
    margin: 0.5rem;
}
</style>
