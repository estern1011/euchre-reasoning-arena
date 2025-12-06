<template>
    <div class="meta-info">
        <div class="meta-item">
            <span class="meta-label">trump:</span>
            <span class="meta-value trump">{{ trumpDisplay }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">round:</span>
            <span class="meta-value">{{ roundDisplay }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">score:</span>
            <span class="meta-value score">[{{ gameStore.gameScores[0] }}, {{ gameStore.gameScores[1] }}]</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '~/stores/game';
import { formatSuit } from '../../lib/game/formatting';

const gameStore = useGameStore();

const trumpDisplay = computed(() => {
    if (!gameStore.trump) return '?';
    return formatSuit(gameStore.trump);
});

const roundDisplay = computed(() => {
    const handNum = gameStore.handNumber;
    const trickNum = gameStore.isHandComplete || gameStore.isGameComplete
        ? 5
        : (gameStore.completedTricks?.length || 0) + 1;
    return `Hand ${handNum}, Trick ${trickNum}`;
});
</script>

<style scoped>
.meta-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.meta-label {
    color: #38bdb8;
    font-weight: 500;
}

.meta-value {
    color: var(--color-text);
}

.meta-value.trump {
    font-size: 1rem;
}

.meta-value.score {
    color: var(--color-text);
}
</style>
