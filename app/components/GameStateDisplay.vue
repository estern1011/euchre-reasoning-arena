<template>
    <div class="game-state-display">
        <span class="state-item">
            <span class="state-label">next_phase:</span>
            <span class="state-value">"{{ currentPhase.toLowerCase() }}"</span>
        </span>
        <span class="divider">,</span>
        <span class="state-item">
            <span class="state-label">trick:</span>
            <span class="state-value">{{ currentTrick }}</span>
        </span>
        <span class="divider">,</span>
        <span class="state-item">
            <span class="state-label">trump:</span>
            <span class="trump-suit">{{ trumpSuit }}</span>
        </span>
        <span class="divider">,</span>
        <span class="state-item">
            <span class="state-label">winner:</span>
            <span class="state-value">"{{ lastTrickWinner.toLowerCase() }}"</span>
        </span>
    </div>
</template>

<script setup lang="ts">
interface Props {
    currentPhase: string;
    currentTrick: number;
    trumpSuit: string;
    lastTrickWinner: string;
}

defineProps<Props>();
</script>

<style scoped>
.game-state-display {
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
    color: var(--color-accent);
    font-weight: 500;
}

.state-value {
    color: #fbbf24;
}

.divider {
    color: var(--color-text-muted);
}

.trump-suit {
    color: var(--color-error);
    font-size: 1rem;
    font-weight: 600;
}
</style>
