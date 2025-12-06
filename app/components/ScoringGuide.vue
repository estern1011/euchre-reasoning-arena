<template>
    <div class="scoring-guide">
        <div class="guide-header">
            <span class="comment">// </span>scoring_rules
            <button class="toggle-btn" @click="isExpanded = !isExpanded">
                {{ isExpanded ? '[-]' : '[+]' }}
            </button>
        </div>

        <div class="guide-content" v-if="isExpanded">
            <!-- Confidence Scoring -->
            <div class="scoring-section">
                <div class="section-title">confidence_scoring</div>
                <div class="scoring-table">
                    <div class="table-header">
                        <span class="col-confidence">confidence</span>
                        <span class="col-correct">correct</span>
                        <span class="col-wrong">wrong</span>
                    </div>
                    <div class="table-row">
                        <span class="col-confidence high">HIGH (>=70%)</span>
                        <span class="col-correct positive">+3</span>
                        <span class="col-wrong negative">-2</span>
                    </div>
                    <div class="table-row">
                        <span class="col-confidence medium">MED (40-69%)</span>
                        <span class="col-correct positive">+2</span>
                        <span class="col-wrong negative">-1</span>
                    </div>
                    <div class="table-row">
                        <span class="col-confidence low">LOW (<40%)</span>
                        <span class="col-correct positive">+1</span>
                        <span class="col-wrong neutral">0</span>
                    </div>
                </div>
            </div>

            <!-- Trump Weighting -->
            <div class="scoring-section">
                <div class="section-title">trump_multipliers</div>
                <div class="multiplier-list">
                    <div class="multiplier-item">
                        <span class="multiplier-label">trump_call</span>
                        <span class="multiplier-value">3x</span>
                    </div>
                    <div class="multiplier-item">
                        <span class="multiplier-label">trump_pass</span>
                        <span class="multiplier-value">0.5x</span>
                    </div>
                    <div class="multiplier-item">
                        <span class="multiplier-label">march (5 tricks)</span>
                        <span class="multiplier-value bonus">+1.5x</span>
                    </div>
                    <div class="multiplier-item">
                        <span class="multiplier-label">loner_march</span>
                        <span class="multiplier-value bonus">+2x</span>
                    </div>
                    <div class="multiplier-item">
                        <span class="multiplier-label">euchred</span>
                        <span class="multiplier-value penalty">2x penalty</span>
                    </div>
                </div>
            </div>

            <!-- Calibration Explanation -->
            <div class="scoring-section">
                <div class="section-title">calibration</div>
                <div class="explanation">
                    <p>calibration = 100 - |avg_confidence - actual_accuracy|</p>
                    <p class="hint">// perfect calibration: confidence matches win rate</p>
                </div>
            </div>
        </div>

        <!-- Collapsed summary -->
        <div class="collapsed-summary" v-else>
            <span class="summary-item">high_conf: +3/-2</span>
            <span class="summary-item">trump: 3x</span>
            <span class="summary-item">tools: -cost</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
    expanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    expanded: false,
});

const isExpanded = ref(props.expanded);

// Sync with prop
watch(() => props.expanded, (val) => {
    isExpanded.value = val;
});
</script>

<style scoped>
.scoring-guide {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    overflow: hidden;
}

.guide-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.comment {
    color: var(--color-text-muted);
}

.toggle-btn {
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    transition: color 0.2s;
}

.toggle-btn:hover {
    color: #38bdb8;
}

.guide-content {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.scoring-section {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 0.5rem;
}

.section-title {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38bdb8;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

/* Scoring Table */
.scoring-table {
    font-size: 0.6875rem;
    font-family: "Courier New", monospace;
}

.table-header {
    display: grid;
    grid-template-columns: 1fr 50px 50px;
    gap: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-size: 0.5625rem;
}

.table-row {
    display: grid;
    grid-template-columns: 1fr 50px 50px;
    gap: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-row:last-child {
    border-bottom: none;
}

.col-confidence {
    color: var(--color-text-secondary);
}

.col-confidence.high {
    color: #a3e635;
}

.col-confidence.medium {
    color: #fbbf24;
}

.col-confidence.low {
    color: #f87171;
}

.col-correct, .col-wrong {
    text-align: center;
}

.positive {
    color: #a3e635;
}

.negative {
    color: #f87171;
}

.neutral {
    color: var(--color-text-muted);
}

/* Multiplier List */
.multiplier-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.multiplier-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.6875rem;
    padding: 0.125rem 0;
}

.multiplier-label {
    color: var(--color-text-secondary);
    font-family: "Courier New", monospace;
}

.multiplier-value {
    font-family: "Courier New", monospace;
    font-weight: 600;
    color: var(--color-text-primary);
}

.multiplier-value.bonus {
    color: #a3e635;
}

.multiplier-value.penalty {
    color: #f87171;
}

/* Explanation */
.explanation {
    font-size: 0.6875rem;
    font-family: "Courier New", monospace;
}

.explanation p {
    margin: 0;
    padding: 0.125rem 0;
    color: var(--color-text-secondary);
}

.explanation .hint {
    color: var(--color-text-muted);
    font-size: 0.625rem;
}

/* Collapsed Summary */
.collapsed-summary {
    padding: 0.5rem 1rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.summary-item {
    font-size: 0.625rem;
    font-family: "Courier New", monospace;
    color: var(--color-text-muted);
    padding: 0.125rem 0.375rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
}
</style>
