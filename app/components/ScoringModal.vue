<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="scoring-modal">
            <div class="modal-header">
                <span class="comment">// </span>scoring_rules
                <button class="close-btn" @click="$emit('close')">&times;</button>
            </div>
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

                <!-- Calibration Explanation -->
                <div class="scoring-section">
                    <div class="section-title">calibration</div>
                    <div class="explanation">
                        <p class="formula">calibration = 100 - |avg_confidence - actual_accuracy|</p>
                        <p class="hint">// perfect calibration: confidence matches win rate</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineEmits<{
    (e: 'close'): void;
}>();
</script>

<style scoped>
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

.comment {
    color: var(--color-text-muted);
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

.scoring-content {
    padding: 1.5rem;
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
</style>
