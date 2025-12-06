<template>
    <div class="player-info" :class="[position, { 'is-thinking': isThinking }]">
        <div class="outer-box">
            <div class="position-row">
                <span class="position-name">{{ position.toUpperCase() }}</span>
                <span v-if="isDealer" class="dealer-badge">D</span>
            </div>
            <div class="model-box">
                <span class="model-name">{{ formattedModelName }}</span>
            </div>
        </div>
        <div v-if="isGoingAlone" class="alone-badge">ALONE</div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Position } from "~/types/game";

interface Props {
    position: Position;
    modelName: string;
    isThinking: boolean;
    isGoingAlone?: boolean;
    isDealer?: boolean;
}

const props = defineProps<Props>();

const formattedModelName = computed(() => {
    // Convert to title case with hyphens preserved
    return props.modelName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
});
</script>

<style scoped>
.player-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    font-family: "Courier New", monospace;
}

.outer-box {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.75rem;
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.35);
    border-radius: 4px;
    gap: 0.35rem;
    min-width: 140px;
}

.is-thinking .outer-box {
    border-color: rgba(56, 229, 226, 0.7);
    box-shadow: 0 0 15px rgba(56, 229, 226, 0.25);
}

.position-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Position-specific alignment */
.player-info.west .position-row {
    justify-content: flex-start;
}

.player-info.east .position-row {
    justify-content: flex-end;
}

.player-info.north .position-row,
.player-info.south .position-row {
    justify-content: center;
}

.position-name {
    font-weight: bold;
    font-size: 0.85rem;
    letter-spacing: 2px;
    color: #fff;
}

.dealer-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    font-size: 0.6rem;
    font-weight: bold;
    color: #000;
    background: var(--color-accent);
    border-radius: 50%;
}

.model-box {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.6rem;
    background: rgba(15, 30, 30, 0.95);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 3px;
}

.model-name {
    font-size: 0.75rem;
    color: rgba(56, 229, 226, 0.85);
    white-space: nowrap;
    letter-spacing: 0.3px;
}

.alone-badge {
    color: var(--color-error);
    font-weight: bold;
    font-size: 0.65rem;
    letter-spacing: 0.5px;
    padding: 0.2rem 0.5rem;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 4px;
}
</style>
