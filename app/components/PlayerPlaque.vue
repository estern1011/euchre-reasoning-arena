<template>
    <div class="player-plaque" :class="plaqueClasses">
        <div class="plaque-header">
            <span
                v-if="promptPreset"
                class="mode-dot"
                :class="`mode-${promptPreset}`"
                :title="PROMPT_PRESET_HINTS[promptPreset]"
            ></span>
            <span class="position-label">{{ position.toUpperCase() }}</span>
            <span v-if="isDealer" class="dealer-indicator">D</span>
            <!-- Trick chips (circles showing tricks won) -->
            <div v-if="tricksWon > 0" class="trick-chips">
                <span v-for="n in tricksWon" :key="n" class="trick-chip">●</span>
            </div>
        </div>
        <div class="model-container">
            <span class="model-label">{{ formattedModel }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Position } from "~/types/game";
import { type PromptPreset, PROMPT_PRESET_HINTS } from "../../server/services/ai-agent/prompts";

interface Props {
    position: Position;
    modelName: string;
    isThinking?: boolean;
    isDealer?: boolean;
    tricksWon?: number;
    promptPreset?: PromptPreset;
}

const props = withDefaults(defineProps<Props>(), {
    isThinking: false,
    isDealer: false,
    tricksWon: 0,
});

const formattedModel = computed(() => {
    return props.modelName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
});

const plaqueClasses = computed(() => {
    return {
        [props.position]: true,
        thinking: props.isThinking,
    };
});
</script>

<style scoped>
.player-plaque {
    display: flex;
    flex-direction: column;
    background: rgba(10, 20, 20, 0.95);
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-radius: 4px;
    padding: 6px 8px;
    gap: 4px;
    width: 140px;
    font-family: "Courier New", Consolas, monospace;
    box-shadow:
        0 0 15px rgba(0, 0, 0, 0.6),
        inset 0 0 20px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
}

/* Compact style for East/West positions */
.player-plaque.west,
.player-plaque.east {
    width: 110px;
    padding: 4px 6px;
    gap: 3px;
}

.player-plaque.thinking {
    border-color: rgba(56, 189, 186, 0.7);
    box-shadow:
        0 0 20px rgba(56, 189, 186, 0.3),
        0 0 40px rgba(56, 189, 186, 0.15),
        inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.plaque-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 0.1rem;
    justify-content: center;
}

.position-label {
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 2px;
    color: #fff;
}

.dealer-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    font-size: 0.6rem;
    font-weight: bold;
    color: #0a1414;
    background: #38bdb8;
    border-radius: 50%;
}

.trick-chips {
    display: flex;
    gap: 0.15rem;
    margin-left: auto;
}

.trick-chip {
    font-size: 0.6rem;
    color: #fbbf24;
    text-shadow: 0 0 4px rgba(251, 191, 36, 0.6);
}

.model-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.5rem;
    background: rgba(10, 25, 25, 0.95);
    border: 1px solid rgba(56, 189, 186, 0.4);
    border-radius: 2px;
}

.model-label {
    font-size: 11px;
    color: #e5e7eb;
    letter-spacing: 0.3px;
    word-break: break-word;
    text-align: center;
    line-height: 1.2;
}

/* Smaller text for East/West with wrapping */
.player-plaque.west .model-label,
.player-plaque.east .model-label {
    font-size: 9px;
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
}

.player-plaque.west .model-container,
.player-plaque.east .model-container {
    max-width: 100%;
}

.player-plaque.west .position-label,
.player-plaque.east .position-label {
    font-size: 10px;
    letter-spacing: 1px;
}

/* Mode indicator dot */
.mode-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.mode-dot.mode-none {
    background: var(--color-mode-none);
}

.mode-dot.mode-conservative {
    background: var(--color-mode-conservative);
}

.mode-dot.mode-neutral {
    background: var(--color-mode-neutral);
}

.mode-dot.mode-aggressive {
    background: var(--color-mode-aggressive);
}
</style>
