<template>
    <div class="performance-scoreboard">
        <PanelHeader title="performance_scores">
            <template #actions>
                <button
                    v-if="showScoringInfo"
                    class="info-btn"
                    @click="$emit('show-scoring-rules')"
                    title="View scoring rules"
                >
                    ?
                </button>
            </template>
        </PanelHeader>
        <div class="scoreboard-grid">
            <div
                v-for="position in positions"
                :key="position"
                class="agent-card"
                :class="[position, { 'is-current': position === currentPlayer }]"
            >
                <div class="agent-header">
                    <span class="position-label">{{ position.toUpperCase() }}</span>
                    <span class="model-name">{{ getModelName(position) }}</span>
                </div>

                <div class="stats-row">
                    <div class="stat">
                        <span class="stat-label">score</span>
                        <span class="stat-value" :class="getScoreClass(position)">
                            {{ getPerformance(position)?.totalScore ?? 0 }}
                        </span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">decisions</span>
                        <span class="stat-value">{{ getPerformance(position)?.totalDecisions ?? 0 }}</span>
                    </div>
                </div>

                <div class="brier-section">
                    <div class="brier-header">
                        <span class="brier-label">brier</span>
                        <span class="brier-info">
                            <span class="brier-value" :class="getBrierClass(position)">{{ getBrierScore(position) }}</span>
                            <span class="brier-rating" :class="getBrierClass(position)">{{ getBrierLabel(position) }}</span>
                        </span>
                    </div>
                    <div class="brier-bar">
                        <div
                            class="brier-fill"
                            :style="{ width: `${getBrierBarPercent(position)}%` }"
                            :class="getBrierClass(position)"
                        ></div>
                    </div>
                </div>

                <div class="confidence-breakdown" v-if="hasDecisions(position)">
                    <div class="breakdown-row">
                        <span class="breakdown-label">high conf</span>
                        <span class="breakdown-value correct">{{ getPerformance(position)?.highConfidenceCorrect ?? 0 }}</span>
                        <span class="breakdown-separator">/</span>
                        <span class="breakdown-value wrong">{{ getPerformance(position)?.highConfidenceWrong ?? 0 }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Position } from '~/types/game';
import { useGameStore } from '~/stores/game';
import { calculateBrierScore, getBrierRating } from '../../lib/scoring/calibration';
import PanelHeader from '~/components/base/PanelHeader.vue';

interface Props {
    currentPlayer?: Position | null;
    showScoringInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    currentPlayer: null,
    showScoringInfo: false,
});

defineEmits<{
    'show-scoring-rules': [];
}>();

const gameStore = useGameStore();

const positions: Position[] = ['north', 'east', 'south', 'west'];

const getModelName = (position: Position): string => {
    const modelId = gameStore.modelIds[position];
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
};

const getPerformance = (position: Position) => {
    return gameStore.agentPerformance[position];
};

const hasDecisions = (position: Position): boolean => {
    const perf = getPerformance(position);
    return (perf?.totalDecisions ?? 0) > 0;
};

const getScoreClass = (position: Position): string => {
    const perf = getPerformance(position);
    const score = perf?.totalScore ?? 0;
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};

const getBrierScoreRaw = (position: Position): number | null => {
    const perf = getPerformance(position);
    if (!perf || perf.totalDecisions === 0) return null;
    return calculateBrierScore(perf);
};

const getBrierScore = (position: Position): string => {
    const brier = getBrierScoreRaw(position);
    if (brier === null) return '--';
    return brier.toFixed(3);
};

const getBrierClass = (position: Position): string => {
    const brier = getBrierScoreRaw(position);
    if (brier === null) return 'neutral';
    return getBrierRating(brier);
};

const getBrierLabel = (position: Position): string => {
    const brier = getBrierScoreRaw(position);
    if (brier === null) return '';
    return getBrierRating(brier);
};

const getBrierBarPercent = (position: Position): number => {
    const brier = getBrierScoreRaw(position);
    if (brier === null) return 50;
    return Math.max(0, Math.min(100, (1 - brier * 2) * 100));
};
</script>

<style scoped>
.performance-scoreboard {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    overflow: hidden;
}

.info-btn {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(56, 189, 186, 0.2);
    border: 1px solid rgba(56, 189, 186, 0.4);
    color: var(--color-accent);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.info-btn:hover {
    background: rgba(56, 189, 186, 0.3);
    border-color: rgba(56, 189, 186, 0.6);
}


.scoreboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
}

.agent-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.75rem;
    transition: all 0.2s ease;
}

.agent-card.is-current {
    border-color: rgba(56, 189, 186, 0.5);
    box-shadow: 0 0 10px rgba(56, 189, 186, 0.2);
}

.agent-card.north,
.agent-card.south {
    border-left: 3px solid rgba(56, 189, 186, 0.5);
}

.agent-card.east,
.agent-card.west {
    border-left: 3px solid rgba(248, 113, 113, 0.5);
}

.agent-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.position-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
}

.model-name {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stats-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
}

.stat-value.positive {
    color: var(--color-success);
}

.stat-value.negative {
    color: var(--color-error);
}

.stat-value.neutral {
    color: var(--color-text-secondary);
}

.brier-section {
    margin-top: 0.5rem;
}

.brier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.brier-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.brier-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.brier-value {
    font-size: 0.75rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
}

.brier-rating {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
}

.brier-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.brier-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.brier-fill.excellent {
    background: linear-gradient(90deg, var(--color-success), #22c55e);
}

.brier-fill.good {
    background: linear-gradient(90deg, #22c55e, var(--color-accent));
}

.brier-fill.fair {
    background: linear-gradient(90deg, var(--color-warning), #f59e0b);
}

.brier-fill.poor {
    background: linear-gradient(90deg, var(--color-error), var(--color-error-dark));
}

.confidence-breakdown {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.breakdown-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    margin-bottom: 0.125rem;
}

.breakdown-label {
    color: var(--color-text-muted);
    min-width: 50px;
}

.breakdown-value.correct {
    color: var(--color-success);
}

.breakdown-value.wrong {
    color: var(--color-error);
}

.breakdown-value.neutral {
    color: var(--color-text-secondary);
}

.breakdown-separator {
    color: var(--color-text-muted);
}

/* Brier score color classes */
.brier-value.excellent,
.brier-rating.excellent {
    color: var(--color-success);
}

.brier-value.good,
.brier-rating.good {
    color: var(--color-accent);
}

.brier-value.fair,
.brier-rating.fair {
    color: var(--color-warning);
}

.brier-value.poor,
.brier-rating.poor {
    color: var(--color-error);
}

.brier-value.neutral,
.brier-rating.neutral {
    color: var(--color-text-muted);
}
</style>
