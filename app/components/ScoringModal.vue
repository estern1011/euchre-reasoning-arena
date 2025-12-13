<template>
    <BaseModal
        :is-open="isOpen"
        title="scoring_rules"
        size="lg"
        @close="$emit('close')"
    >
        <div class="scoring-content">
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
                        <span class="col-confidence high">HIGH (&ge;70%)</span>
                        <span class="col-correct positive">+3</span>
                        <span class="col-wrong negative">-2</span>
                    </div>
                    <div class="table-row">
                        <span class="col-confidence medium">MED (40-69%)</span>
                        <span class="col-correct positive">+2</span>
                        <span class="col-wrong negative">-1</span>
                    </div>
                    <div class="table-row">
                        <span class="col-confidence low">LOW (&lt;40%)</span>
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

            <!-- Tool Costs -->
            <div class="scoring-section">
                <div class="section-title">tool_costs</div>
                <div class="multiplier-list">
                    <div class="multiplier-item">
                        <span class="multiplier-label">ask_audience</span>
                        <span class="multiplier-value penalty">-2 pts</span>
                    </div>
                    <div class="multiplier-item">
                        <span class="multiplier-label">ask_partner</span>
                        <span class="multiplier-value penalty">-2 pts</span>
                    </div>
                    <div class="multiplier-item">
                        <span class="multiplier-label">fifty_fifty</span>
                        <span class="multiplier-value penalty">-3 pts</span>
                    </div>
                </div>
            </div>

            <!-- Brier Score -->
            <div class="scoring-section">
                <div class="section-title">brier_score</div>
                <div class="explanation">
                    <p class="formula">brier = avg((confidence/100 - outcome)²)</p>
                    <p class="hint">// measures probability calibration quality</p>
                </div>
                <div class="brier-scale">
                    <div class="scale-item">
                        <span class="scale-value good">0.0</span>
                        <span class="scale-label">perfect</span>
                    </div>
                    <div class="scale-item">
                        <span class="scale-value medium">&lt;0.2</span>
                        <span class="scale-label">good</span>
                    </div>
                    <div class="scale-item">
                        <span class="scale-value neutral">0.25</span>
                        <span class="scale-label">random</span>
                    </div>
                    <div class="scale-item">
                        <span class="scale-value bad">&gt;0.3</span>
                        <span class="scale-label">poor</span>
                    </div>
                </div>
            </div>

            <!-- High Confidence Breakdown -->
            <div class="scoring-section">
                <div class="section-title">high_conf_breakdown</div>
                <div class="explanation">
                    <p class="hint">// "high conf <span class="inline-correct">X</span> / <span class="inline-wrong">Y</span>" shows decisions at &ge;70% confidence</p>
                </div>
                <div class="conf-breakdown-explain">
                    <div class="breakdown-item">
                        <span class="breakdown-num correct">X</span>
                        <span class="breakdown-desc">= correct when highly confident (good!)</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-num wrong">Y</span>
                        <span class="breakdown-desc">= wrong when highly confident (overconfidence)</span>
                    </div>
                </div>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "~/components/base/BaseModal.vue";

interface Props {
    isOpen: boolean;
}

defineProps<Props>();

defineEmits<{
    (e: "close"): void;
}>();
</script>

<style scoped>
.scoring-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.scoring-section {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem 1.25rem;
}

.section-title {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38bdb8;
    margin-bottom: 0.75rem;
    font-weight: 600;
}

.scoring-table {
    font-size: 0.9375rem;
    font-family: "Courier New", monospace;
}

.table-header {
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

.table-row {
    display: grid;
    grid-template-columns: 1fr 80px 80px;
    gap: 1rem;
    padding: 0.625rem 0;
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

.col-correct,
.col-wrong {
    text-align: center;
    font-weight: 600;
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

.multiplier-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.multiplier-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9375rem;
    padding: 0.375rem 0;
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

.explanation {
    font-family: "Courier New", monospace;
}

.explanation .formula {
    font-size: 0.9375rem;
    margin: 0;
    padding: 0.5rem 0;
    color: var(--color-text-secondary);
}

.explanation .hint {
    font-size: 0.8125rem;
    margin: 0;
    color: var(--color-text-muted);
}

/* Brier scale */
.brier-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.scale-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.scale-value {
    font-family: "Courier New", monospace;
    font-weight: 600;
    font-size: 0.9375rem;
}

.scale-value.good {
    color: #a3e635;
}

.scale-value.medium {
    color: #84cc16;
}

.scale-value.neutral {
    color: #fbbf24;
}

.scale-value.bad {
    color: #f87171;
}

.scale-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* High conf breakdown explanation */
.conf-breakdown-explain {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.breakdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.breakdown-num {
    font-family: "Courier New", monospace;
    font-weight: 600;
    font-size: 1rem;
    width: 1.5rem;
    text-align: center;
}

.breakdown-num.correct {
    color: #a3e635;
}

.breakdown-num.wrong {
    color: #f87171;
}

.breakdown-desc {
    color: var(--color-text-secondary);
}

.inline-correct {
    color: #a3e635;
    font-weight: 600;
}

.inline-wrong {
    color: #f87171;
    font-weight: 600;
}
</style>
