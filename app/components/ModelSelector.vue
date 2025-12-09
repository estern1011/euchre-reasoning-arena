<template>
    <SelectRoot v-model="modelValue">
        <SelectTrigger class="model-select-trigger">
            <SelectValue />
            <SelectIcon class="model-select-icon">▼</SelectIcon>
        </SelectTrigger>
        <SelectPortal>
            <SelectContent class="model-select-content" position="popper" :side-offset="5">
                <SelectViewport class="model-select-viewport">
                    <SelectItem
                        v-for="opt in options"
                        :key="opt.value"
                        :value="opt.value"
                        class="model-select-item"
                    >
                        <SelectItemText>{{ opt.label }}</SelectItemText>
                    </SelectItem>
                </SelectViewport>
            </SelectContent>
        </SelectPortal>
    </SelectRoot>
</template>

<script setup lang="ts">
import {
    SelectContent,
    SelectIcon,
    SelectItem,
    SelectItemText,
    SelectPortal,
    SelectRoot,
    SelectTrigger,
    SelectValue,
    SelectViewport,
} from "radix-vue";

interface ModelOption {
    value: string;
    label: string;
}

interface Props {
    options: ModelOption[];
}

defineProps<Props>();

const modelValue = defineModel<string>();
</script>

<style scoped>
.model-select-trigger {
    background: rgba(10, 10, 10, 0.8);
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 0;
    color: #fff;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    transition: all 0.15s ease;
    box-shadow: 4px 4px 0px rgba(56, 189, 186, 0.15);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.model-select-trigger:hover {
    background: rgba(56, 189, 186, 0.05);
    border-color: rgba(56, 189, 186, 0.6);
    box-shadow: 6px 6px 0px rgba(56, 189, 186, 0.25);
    transform: translate(-2px, -2px);
}

.model-select-trigger:focus-visible {
    outline: none;
    border-color: var(--color-accent);
    box-shadow:
        6px 6px 0px rgba(56, 189, 186, 0.3),
        0 0 0 3px rgba(56, 189, 186, 0.2);
}

.model-select-icon {
    font-size: 0.75rem;
    opacity: 0.5;
    flex-shrink: 0;
}

.model-select-content {
    background: rgba(10, 10, 10, 0.98);
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 0;
    box-shadow: 8px 8px 0px rgba(56, 189, 186, 0.2);
    z-index: 50;
    max-height: 400px;
    overflow-y: auto;
}

.model-select-viewport {
    padding: 0.25rem;
}

.model-select-item {
    padding: 0.75rem 1rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    color: #fff;
    cursor: pointer;
    outline: none;
    transition: all 0.15s ease;
    white-space: normal;
    word-wrap: break-word;
}

.model-select-item:hover,
.model-select-item[data-highlighted] {
    background: rgba(56, 189, 186, 0.15);
    color: var(--color-accent);
}

.model-select-item[data-state="checked"] {
    background: rgba(56, 189, 186, 0.2);
    color: var(--color-accent);
}
</style>

