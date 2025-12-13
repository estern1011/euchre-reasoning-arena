<template>
    <BaseModal
        :is-open="isOpen"
        title="hand_strength_calculation"
        size="md"
        @close="$emit('close')"
    >
        <div class="strength-content">
            <!-- Trump Card Values -->
            <div class="strength-section">
                <div class="section-title">trump_card_values</div>
                <div class="scoring-table">
                    <div class="table-header">
                        <span class="col-card">card</span>
                        <span class="col-points">points</span>
                    </div>
                    <div class="table-row bower">
                        <span class="col-card">Right Bower (J of trump)</span>
                        <span class="col-points">12</span>
                    </div>
                    <div class="table-row bower">
                        <span class="col-card">Left Bower (J same color)</span>
                        <span class="col-points">11</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">Ace of trump</span>
                        <span class="col-points">10</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">King of trump</span>
                        <span class="col-points">9</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">Queen of trump</span>
                        <span class="col-points">8</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">10 of trump</span>
                        <span class="col-points">7</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">9 of trump</span>
                        <span class="col-points">6</span>
                    </div>
                </div>
            </div>

            <!-- Off-Suit Card Values -->
            <div class="strength-section">
                <div class="section-title">off_suit_values</div>
                <div class="scoring-table">
                    <div class="table-header">
                        <span class="col-card">card</span>
                        <span class="col-points">points</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">Ace</span>
                        <span class="col-points off-suit">5</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">King</span>
                        <span class="col-points off-suit">4</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">Queen</span>
                        <span class="col-points off-suit">3</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">Jack</span>
                        <span class="col-points off-suit">2</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">10</span>
                        <span class="col-points off-suit">1</span>
                    </div>
                    <div class="table-row">
                        <span class="col-card">9</span>
                        <span class="col-points off-suit">0</span>
                    </div>
                </div>
            </div>

            <!-- Strength Categories -->
            <div class="strength-section">
                <div class="section-title">strength_categories</div>
                <div class="category-list">
                    <div class="category-item">
                        <span class="category-range strong">25+ points</span>
                        <span class="category-label">STRONG</span>
                    </div>
                    <div class="category-item">
                        <span class="category-range medium">15-24 points</span>
                        <span class="category-label">MEDIUM</span>
                    </div>
                    <div class="category-item">
                        <span class="category-range weak">&lt;15 points</span>
                        <span class="category-label">WEAK</span>
                    </div>
                </div>
            </div>

            <!-- Example -->
            <div class="strength-section">
                <div class="section-title">example</div>
                <div class="example-content">
                    <p class="example-hand">// hand: J&#9824; J&#9827; A&#9824; K&#9824; 9&#9829; (trump: &#9824;)</p>
                    <p class="example-calc">= 12 + 11 + 10 + 9 + 0 = <span class="total">42 pts</span></p>
                    <p class="hint">// max possible: 50 (right + left + A + K + Q)</p>
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
.strength-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.strength-section {
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
    font-size: 0.875rem;
    font-family: "Courier New", monospace;
}

.table-header {
    display: grid;
    grid-template-columns: 1fr 80px;
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
    grid-template-columns: 1fr 80px;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-row:last-child {
    border-bottom: none;
}

.table-row.bower {
    background: rgba(163, 230, 53, 0.08);
    margin: 0 -0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
}

.col-card {
    color: var(--color-text-secondary);
}

.col-points {
    text-align: center;
    font-weight: 600;
    color: #a3e635;
}

.col-points.off-suit {
    color: var(--color-text-muted);
}

.category-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    padding: 0.375rem 0;
}

.category-range {
    font-family: "Courier New", monospace;
    color: var(--color-text-secondary);
}

.category-range.strong {
    color: #a3e635;
}

.category-range.medium {
    color: #fbbf24;
}

.category-range.weak {
    color: #f87171;
}

.category-label {
    font-family: "Courier New", monospace;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
}

.example-content {
    font-family: "Courier New", monospace;
}

.example-content p {
    margin: 0;
    padding: 0.25rem 0;
}

.example-hand {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

.example-calc {
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.example-calc .total {
    color: #a3e635;
    font-weight: 600;
}

.hint {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    opacity: 0.8;
}
</style>
