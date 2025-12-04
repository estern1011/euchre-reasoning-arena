<template>
    <div class="game-state-header">
        <div class="state-info">
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
        <button
            class="play-next-button"
            type="button"
            @click="$emit('play-next')"
            :disabled="disabled"
        >
            <span class="button-text">playNextRound()</span>
            <span class="button-arrow">→</span>
        </button>
    </div>
</template>

<script setup lang="ts">
interface Props {
    currentPhase: string;
    currentTrick: number;
    trumpSuit: string;
    lastTrickWinner: string;
    disabled?: boolean;
}

defineProps<Props>();
defineEmits<{
    'play-next': [];
}>();
</script>

<style scoped>
.game-state-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.play-next-button {
    background: rgba(163, 230, 53, 0.1);
    border: 2px solid rgba(163, 230, 53, 0.3);
    color: var(--color-accent);
    padding: 0.5rem 1rem;
    border-radius: 2px;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.play-next-button:hover:not(:disabled) {
    background: rgba(163, 230, 53, 0.15);
    border-color: rgba(163, 230, 53, 0.5);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.2);
}

.play-next-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

.button-text {
    font-size: 0.875rem;
}

.button-arrow {
    font-size: 1.125rem;
    transition: transform 0.2s ease;
}

.play-next-button:hover:not(:disabled) .button-arrow {
    transform: translateX(4px);
}
</style>
