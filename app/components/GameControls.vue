<template>
    <div class="controls-container">
        <!-- Auto-mode toggle -->
        <button
            class="auto-mode-button"
            :class="{ active: gameStore.autoMode }"
            type="button"
            @click="gameStore.toggleAutoMode()"
            :disabled="isGameOver"
        >
            <span class="toggle-indicator">{{ gameStore.autoMode ? '●' : '○' }}</span>
            <span class="button-text">autoPlay()</span>
        </button>

        <!-- Play next button -->
        <button
            class="play-next-button"
            type="button"
            @click="$emit('play-next')"
            :disabled="disabled || gameStore.autoMode"
        >
            <span class="button-text">{{ buttonText }}</span>
            <span class="button-arrow">→</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '~/stores/game';

interface Props {
    disabled?: boolean;
}

const props = defineProps<Props>();

defineEmits<{
    'play-next': [];
}>();

const gameStore = useGameStore();

const isGameOver = computed(() => gameStore.isGameComplete);

const buttonText = computed(() => {
    if (gameStore.isGameComplete) {
        return 'gameOver()';
    }
    if (gameStore.isHandComplete) {
        return 'startNextHand()';
    }
    return 'playNextRound()';
});
</script>

<style scoped>
.controls-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.auto-mode-button {
    background: rgba(75, 85, 99, 0.2);
    border: 2px solid rgba(75, 85, 99, 0.4);
    color: var(--color-text-muted);
    padding: 0.5rem 0.875rem;
    border-radius: 2px;
    font-family: "Courier New", monospace;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.auto-mode-button:hover:not(:disabled) {
    background: rgba(75, 85, 99, 0.3);
    border-color: rgba(75, 85, 99, 0.6);
}

.auto-mode-button.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: var(--color-live);
}

.auto-mode-button.active:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.7);
}

.auto-mode-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.toggle-indicator {
    font-size: 0.75rem;
    transition: color 0.2s ease;
}

.auto-mode-button.active .toggle-indicator {
    color: var(--color-live);
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
