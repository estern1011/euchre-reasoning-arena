<template>
    <div class="reflections-panel">
        <PanelHeader title="what_i_learned">
            <template #actions>
                <span class="reflections-count" v-if="totalReflections > 0">
                    {{ totalReflections }} reflections
                </span>
            </template>
        </PanelHeader>

        <div class="reflections-content" v-if="hasReflections">
            <div
                v-for="position in positions"
                :key="position"
                class="player-reflections"
                :class="{ 'has-reflections': playerReflections(position).length > 0 }"
            >
                <div class="player-header">
                    <span class="position-badge" :class="position">
                        {{ position.charAt(0).toUpperCase() }}
                    </span>
                    <span class="model-name">{{ getModelName(position) }}</span>
                    <span class="reflection-count" v-if="playerReflections(position).length > 0">
                        {{ playerReflections(position).length }}
                    </span>
                </div>

                <div class="reflection-list" v-if="playerReflections(position).length > 0">
                    <div
                        v-for="(reflection, index) in playerReflections(position).slice(-3)"
                        :key="index"
                        class="reflection-item"
                    >
                        <span class="hand-number">H{{ reflection.handNumber }}</span>
                        <span class="reflection-text">"{{ reflection.reflection }}"</span>
                    </div>
                </div>

                <div class="no-reflections" v-else>
                    <span class="empty-text">// no reflections yet</span>
                </div>
            </div>
        </div>

        <div class="empty-state" v-else>
            <span class="empty-text">// reflections will appear after hands complete</span>
        </div>

        <div class="generating-indicator" v-if="isGenerating">
            <span class="indicator-text">generating reflections...</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PanelHeader from '~/components/base/PanelHeader.vue';
import { useGameStore, type AgentReflection } from '~/stores/game';
import type { Position } from '../../lib/game/types';

const gameStore = useGameStore();

const positions: Position[] = ['north', 'east', 'south', 'west'];

const hasReflections = computed(() => {
    return Object.keys(gameStore.agentReflections).length > 0;
});

const totalReflections = computed(() => {
    let count = 0;
    for (const position of positions) {
        const reflections = gameStore.agentReflections[position];
        if (reflections) {
            count += reflections.length;
        }
    }
    return count;
});

const playerReflections = (position: Position): AgentReflection[] => {
    return gameStore.agentReflections[position] || [];
};

const getModelName = (position: Position): string => {
    const modelId = gameStore.modelIds[position];
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
};

const isGenerating = computed(() => gameStore.isGeneratingReflections);
</script>

<style scoped>
.reflections-panel {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
}

.comment {
    color: var(--color-text-muted);
}

.reflections-count {
    margin-left: auto;
    font-size: 0.75rem;
    background: rgba(56, 189, 186, 0.2);
    padding: 0.125rem 0.5rem;
    border-radius: 8px;
    font-family: "Courier New", monospace;
}

.reflections-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.player-reflections {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    padding: 0.625rem;
    border-left: 3px solid rgba(255, 255, 255, 0.1);
}

.player-reflections.has-reflections {
    background: rgba(0, 0, 0, 0.3);
}

.player-reflections .position-badge.north,
.player-reflections .position-badge.south {
    background: rgba(163, 230, 53, 0.15);
    color: #a3e635;
}

.player-reflections .position-badge.east,
.player-reflections .position-badge.west {
    background: rgba(96, 165, 250, 0.15);
    color: #60a5fa;
}

.player-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.position-badge {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
}

.model-name {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
}

.reflection-count {
    margin-left: auto;
    font-size: 0.625rem;
    background: rgba(56, 189, 186, 0.2);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: "Courier New", monospace;
    color: #38bdb8;
}

.reflection-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.reflection-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0;
}

.hand-number {
    flex-shrink: 0;
    font-family: "Courier New", monospace;
    color: var(--color-text-muted);
    min-width: 24px;
}

.reflection-text {
    color: var(--color-text-secondary);
    font-style: italic;
    line-height: 1.4;
}

.no-reflections {
    padding: 0.25rem 0;
}

.empty-text {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    font-style: italic;
}

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.generating-indicator {
    padding: 0.5rem 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(56, 189, 186, 0.05);
}

.indicator-text {
    font-size: 0.6875rem;
    color: #38bdb8;
    font-style: italic;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}
</style>
