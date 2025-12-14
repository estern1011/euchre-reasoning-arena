<template>
    <div class="recent-decisions">
        <PanelHeader title="recent_decisions">
            <template #actions>
                <span class="decision-count" v-if="recentDecisions.length > 0">
                    {{ recentDecisions.length }}
                </span>
            </template>
        </PanelHeader>

        <div class="decisions-list" v-if="recentDecisions.length > 0">
            <div
                v-for="(decision, index) in recentDecisions"
                :key="index"
                class="decision-item"
                :class="[decision.position, { correct: decision.wasCorrect, wrong: !decision.wasCorrect }]"
            >
                <div class="decision-header">
                    <span class="position-badge">{{ decision.position.charAt(0).toUpperCase() }}</span>
                    <span class="decision-type">{{ formatDecisionType(decision.type) }}</span>
                    <span class="confidence-badge" :class="getConfidenceClass(decision.confidence)">
                        {{ decision.confidence }}%
                    </span>
                </div>
                <div class="decision-outcome">
                    <span class="outcome-icon">{{ decision.wasCorrect ? '✓' : '✗' }}</span>
                    <span class="score-change" :class="{ positive: decision.score > 0, negative: decision.score < 0 }">
                        {{ decision.score > 0 ? '+' : '' }}{{ decision.score }}
                    </span>
                    <span v-if="decision.toolUsed" class="tool-badge">
                        {{ getToolIcon(decision.toolUsed) }}
                    </span>
                </div>
            </div>
        </div>

        <div class="empty-state" v-else>
            <span class="empty-text">// awaiting decisions...</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PanelHeader from '~/components/base/PanelHeader.vue';
import { useGameStore } from '~/stores/game';
import { calculateDecisionScore, CONFIDENCE_THRESHOLDS } from '../../lib/scoring/calibration';
import type { Position } from '../../lib/game/types';

interface DecisionDisplay {
    position: Position;
    type: 'card_play' | 'trump_call' | 'trump_pass';
    confidence: number;
    wasCorrect: boolean;
    score: number;
    toolUsed?: string;
}

const gameStore = useGameStore();

const recentDecisions = computed((): DecisionDisplay[] => {
    const decisions: DecisionDisplay[] = [];

    // Get decisions from game history (last 10)
    for (const hand of gameStore.gameHistory.hands) {
        // Trump decisions
        for (const decision of hand.trumpDecisions) {
            if (decision.confidence !== undefined) {
                // Determine if it was correct based on hand outcome
                const callerTeam = ['north', 'south'].includes(hand.trumpCaller || '') ? 0 : 1;
                const playerTeam = ['north', 'south'].includes(decision.player) ? 0 : 1;
                const wasCorrect = decision.action === 'pass'
                    ? hand.pointsScored[playerTeam] >= 0
                    : hand.pointsScored[callerTeam] > 0;

                const outcome = {
                    confidence: decision.confidence,
                    toolUsed: decision.toolUsed ? { tool: decision.toolUsed.tool, cost: decision.toolUsed.cost } : null,
                    wasCorrect,
                    decisionType: decision.action === 'pass' ? 'trump_pass' as const : 'trump_call' as const,
                };
                const scoreResult = calculateDecisionScore(outcome);

                decisions.push({
                    position: decision.player,
                    type: outcome.decisionType,
                    confidence: decision.confidence,
                    wasCorrect,
                    score: scoreResult.totalScore,
                    toolUsed: decision.toolUsed?.tool,
                });
            }
        }

        // Card plays from tricks
        for (const trick of hand.tricks) {
            for (const play of trick.plays) {
                if (play.confidence !== undefined && trick.winner) {
                    const wasCorrect = isSameTeam(play.player, trick.winner);
                    const outcome = {
                        confidence: play.confidence,
                        toolUsed: play.toolUsed ? { tool: play.toolUsed.tool, cost: play.toolUsed.cost } : null,
                        wasCorrect,
                        decisionType: 'card_play' as const,
                    };
                    const scoreResult = calculateDecisionScore(outcome);

                    decisions.push({
                        position: play.player,
                        type: 'card_play',
                        confidence: play.confidence,
                        wasCorrect,
                        score: scoreResult.totalScore,
                        toolUsed: play.toolUsed?.tool,
                    });
                }
            }
        }
    }

    // Return last 10 decisions, most recent first
    return decisions.slice(-10).reverse();
});

const isSameTeam = (pos1: Position, pos2: Position): boolean => {
    const team1 = ['north', 'south'];
    const team2 = ['east', 'west'];
    return (team1.includes(pos1) && team1.includes(pos2)) ||
           (team2.includes(pos1) && team2.includes(pos2));
};

const formatDecisionType = (type: string): string => {
    const types: Record<string, string> = {
        card_play: 'play',
        trump_call: 'call',
        trump_pass: 'pass',
    };
    return types[type] || type;
};

const getConfidenceClass = (confidence: number): string => {
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
    if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'medium';
    return 'low';
};

const getToolIcon = (tool: string): string => {
    const icons: Record<string, string> = {
        ask_audience: '👥',
        ask_partner: '🤝',
        fifty_fifty: '🎯',
    };
    return icons[tool] || '🔧';
};
</script>

<style scoped>
.recent-decisions {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
}

.comment {
    color: var(--color-text-muted);
}

.decision-count {
    margin-left: auto;
    font-size: 0.75rem;
    background: rgba(56, 189, 186, 0.2);
    padding: 0.125rem 0.5rem;
    border-radius: 8px;
    font-family: "Courier New", monospace;
}

.decisions-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.decision-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    border-left: 3px solid transparent;
}

.decision-item.north,
.decision-item.south {
    border-left-color: rgba(56, 189, 186, 0.5);
}

.decision-item.east,
.decision-item.west {
    border-left-color: rgba(248, 113, 113, 0.5);
}

.decision-item.correct {
    background: rgba(163, 230, 53, 0.05);
}

.decision-item.wrong {
    background: rgba(248, 113, 113, 0.05);
}

.decision-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.position-badge {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.decision-type {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.confidence-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
}

.confidence-badge.high {
    background: rgba(163, 230, 53, 0.15);
    color: #a3e635;
}

.confidence-badge.medium {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
}

.confidence-badge.low {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
}

.decision-outcome {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.outcome-icon {
    font-size: 0.875rem;
}

.decision-item.correct .outcome-icon {
    color: #a3e635;
}

.decision-item.wrong .outcome-icon {
    color: #f87171;
}

.score-change {
    font-size: 0.75rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
}

.score-change.positive {
    color: #a3e635;
}

.score-change.negative {
    color: #f87171;
}

.tool-badge {
    font-size: 0.75rem;
}

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.empty-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
