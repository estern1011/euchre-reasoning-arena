<template>
    <SelectRoot v-model="modelValue">
        <SelectTrigger class="select-trigger">
            <SelectValue class="select-value" />
            <SelectIcon class="select-icon">▼</SelectIcon>
        </SelectTrigger>
        <SelectPortal>
            <SelectContent class="select-content">
                <SelectViewport>
                    <SelectItem
                        v-for="opt in options"
                        :key="opt.value"
                        :value="opt.value"
                        class="select-item"
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
.select-trigger {
    background: rgba(10, 10, 10, 0.8);
    border: 2px solid rgba(163, 230, 53, 0.4);
    border-radius: 0px;
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
    box-shadow: 4px 4px 0px rgba(163, 230, 53, 0.15);
}

.select-trigger:hover {
    background: rgba(163, 230, 53, 0.05);
    border-color: rgba(163, 230, 53, 0.6);
    box-shadow: 6px 6px 0px rgba(163, 230, 53, 0.25);
    transform: translate(-2px, -2px);
}

.select-trigger:focus-visible {
    outline: none;
    border-color: #a3e635;
    box-shadow:
        6px 6px 0px rgba(163, 230, 53, 0.3),
        0 0 0 3px rgba(163, 230, 53, 0.2);
}

.select-icon {
    font-size: 0.75rem;
    opacity: 0.5;
}

.select-content {
    margin-top: 0.5rem;
    background: #0a0a0a;
    border: 3px solid rgba(163, 230, 53, 0.5);
    border-radius: 0px;
    color: #fff;
    box-shadow:
        8px 8px 0px rgba(163, 230, 53, 0.2),
        0 20px 40px rgba(0, 0, 0, 0.9);
    overflow: hidden;
    z-index: 50;
    position: relative;
}

.select-viewport {
    padding: 0.5rem;
}

.select-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0px;
    cursor: pointer;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    transition: all 0.1s ease;
    color: #e5e7eb;
    border-left: 3px solid transparent;
}

.select-item:hover,
.select-item[data-highlighted] {
    background: rgba(163, 230, 53, 0.15);
    color: #a3e635;
    border-left-color: #a3e635;
    transform: translateX(4px);
}
</style>
