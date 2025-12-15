<template>
    <span
        class="mode-badge"
        :class="[mode, { compact }]"
        :title="PROMPT_PRESET_DESCRIPTIONS[mode]"
    >
        <span v-if="!compact" class="mode-prefix">mode:</span>
        <span class="mode-value">"{{ PROMPT_PRESET_LABELS[mode] }}"</span>
    </span>
</template>

<script setup lang="ts">
import {
    type PromptPreset,
    PROMPT_PRESET_LABELS,
    PROMPT_PRESET_DESCRIPTIONS,
} from '../../server/services/ai-agent/prompts';

interface Props {
    mode: PromptPreset;
    compact?: boolean;
}

withDefaults(defineProps<Props>(), {
    compact: false,
});
</script>

<style scoped>
.mode-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-family: "Courier New", Consolas, monospace;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 2px;
    border: 1px solid;
    background: rgba(0, 0, 0, 0.4);
    white-space: nowrap;
}

.mode-badge.compact {
    font-size: 0.5625rem;
    padding: 0.1rem 0.3rem;
    gap: 0.15rem;
}

.mode-prefix {
    color: var(--color-text-muted);
}

.mode-value {
    font-weight: 600;
}

/* Raw/None mode - grey */
.mode-badge.none {
    border-color: color-mix(in srgb, var(--color-mode-none) 40%, transparent);
    background: color-mix(in srgb, var(--color-mode-none) 10%, transparent);
}
.mode-badge.none .mode-value {
    color: var(--color-mode-none);
}

/* Safe/Conservative mode - green */
.mode-badge.conservative {
    border-color: color-mix(in srgb, var(--color-mode-conservative) 40%, transparent);
    background: color-mix(in srgb, var(--color-mode-conservative) 10%, transparent);
}
.mode-badge.conservative .mode-value {
    color: var(--color-mode-conservative);
}

/* Neutral mode - yellow */
.mode-badge.neutral {
    border-color: color-mix(in srgb, var(--color-mode-neutral) 40%, transparent);
    background: color-mix(in srgb, var(--color-mode-neutral) 10%, transparent);
}
.mode-badge.neutral .mode-value {
    color: var(--color-mode-neutral);
}

/* YOLO/Aggressive mode - red */
.mode-badge.aggressive {
    border-color: color-mix(in srgb, var(--color-mode-aggressive) 40%, transparent);
    background: color-mix(in srgb, var(--color-mode-aggressive) 10%, transparent);
}
.mode-badge.aggressive .mode-value {
    color: var(--color-mode-aggressive);
}
</style>
