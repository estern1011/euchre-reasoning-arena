<template>
    <div class="game-insights-panel">
        <BasePanelHeader title="game_insights">
            <template #actions>
                <span class="hand-indicator" v-if="handNumber > 0">
                    [Hand {{ handNumber }}]
                </span>
            </template>
        </BasePanelHeader>

        <div class="insights-content" v-if="hasInsights">
            <!-- Latest Hand Summary -->
            <div class="insight-section summary-section" v-if="handSummary">
                <div class="section-label">latest_hand</div>
                <div class="summary-text">{{ handSummary }}</div>
            </div>

            <!-- Agent Patterns -->
            <div class="insight-section patterns-section" v-if="insights?.agentPatterns">
                <div class="section-label">agent_patterns</div>
                <div class="patterns-list">
                    <div
                        v-for="position in positions"
                        :key="position"
                        class="pattern-item"
                        :class="position"
                    >
                        <div class="pattern-header">
                            <span class="position-badge">{{ position.charAt(0).toUpperCase() }}</span>
                            <span class="model-name">{{ getModelName(position) }}</span>
                        </div>
                        <div class="pattern-text">{{ insights.agentPatterns[position] || 'No pattern yet' }}</div>
                    </div>
                </div>
            </div>

            <!-- Decision Comparison -->
            <div class="insight-section comparison-section" v-if="insights?.decisionStyleComparison">
                <div class="section-label">style_comparison</div>
                <div class="comparison-text">{{ insights.decisionStyleComparison }}</div>
            </div>

            <!-- Game Narrative -->
            <div class="insight-section narrative-section" v-if="insights?.gameNarrative">
                <div class="section-label">narrative</div>
                <div class="narrative-text">{{ insights.gameNarrative }}</div>
            </div>

            <!-- Key Moments -->
            <div class="insight-section moments-section" v-if="insights?.keyMoments && insights.keyMoments.length > 0">
                <div class="section-label">key_moments</div>
                <div class="moments-list">
                    <div
                        v-for="(moment, index) in displayedMoments"
                        :key="index"
                        class="moment-item"
                    >
                        <span class="moment-bullet">•</span>
                        <span class="moment-text">{{ moment }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" v-else>
            <div class="empty-icon">📊</div>
            <div class="empty-text">// awaiting hand completion...</div>
            <div class="empty-hint">Insights will appear after the first hand</div>
        </div>

        <!-- Loading State -->
        <div class="loading-overlay" v-if="isAnalyzing">
            <div class="loading-spinner"></div>
            <div class="loading-text">analyzing hand...</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '~/types/game';
import type { EvolvedInsights } from '../../server/services/analysis/types';

interface Props {
    insights: EvolvedInsights | null;
    handSummary?: string | null;
    handNumber?: number;
    modelIds?: Record<Position, string>;
    isAnalyzing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    insights: null,
    handSummary: null,
    handNumber: 0,
    modelIds: () => ({
        north: 'unknown',
        east: 'unknown',
        south: 'unknown',
        west: 'unknown',
    }),
    isAnalyzing: false,
});

const positions: Position[] = ['north', 'east', 'south', 'west'];

const hasInsights = computed(() => {
    return props.insights !== null && props.handNumber > 0;
});

const displayedMoments = computed(() => {
    if (!props.insights?.keyMoments) return [];
    // Show last 5 moments
    return props.insights.keyMoments.slice(-5);
});

const getModelName = (position: Position): string => {
    const modelId = props.modelIds[position];
    if (!modelId) return 'unknown';
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
};
</script>

<style scoped>
.game-insights-panel {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
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

.hand-indicator {
    margin-left: auto;
    font-size: 0.75rem;
    color: #38bdb8;
    font-family: "Courier New", monospace;
}

.insights-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.insight-section {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
}

.section-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38bdb8;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

/* Summary Section */
.summary-section {
    border-left: 3px solid #a3e635;
}

.summary-text {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
}

/* Patterns Section */
.patterns-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.pattern-item {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    border-left: 2px solid transparent;
}

.pattern-item.north,
.pattern-item.south {
    border-left-color: rgba(56, 189, 186, 0.5);
}

.pattern-item.east,
.pattern-item.west {
    border-left-color: rgba(248, 113, 113, 0.5);
}

.pattern-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.position-badge {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.model-name {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
}

.pattern-text {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
}

/* Comparison Section */
.comparison-text {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    font-style: italic;
}

/* Narrative Section */
.narrative-section {
    border-left: 3px solid #fbbf24;
}

.narrative-text {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
}

/* Moments Section */
.moments-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.moment-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
}

.moment-bullet {
    color: #38bdb8;
    flex-shrink: 0;
}

.moment-text {
    color: var(--color-text-secondary);
    line-height: 1.4;
}

/* Empty State */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
}

.empty-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    opacity: 0.5;
}

.empty-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-style: italic;
    margin-bottom: 0.25rem;
}

.empty-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    opacity: 0.7;
}

/* Loading State */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 20, 20, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border-radius: 8px;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-top-color: #38bdb8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
