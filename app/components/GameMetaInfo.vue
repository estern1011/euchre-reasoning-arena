<template>
    <div class="meta-info">
        <div class="meta-item">
            <span class="meta-label">trump:</span>
            <span class="meta-value trump">{{ trumpDisplay }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">trick:</span>
            <span class="meta-value">{{ trickDisplay }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">score:</span>
            <span class="meta-value">[{{ scores[0] }}, {{ scores[1] }}]</span>
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

const trickDisplay = computed(() => {
    const completed = gameStore.completedTricks?.length || 0;
    return `${completed + 1}/5`;
});

const scores = computed(() => gameStore.scores);
</script>

<style scoped>
.meta-info {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.meta-label {
    color: var(--color-accent);
    font-weight: 500;
}

.meta-value {
    color: var(--color-text);
}

.meta-value.trump {
    font-size: 1.1rem;
    color: #ef4444;
}
</style>
