<template>
    <div class="arena-container">
        <header class="arena-header">
            <h1>EUCHRE REASONING ARENA</h1>
            <span class="live-badge">
                <span class="live-dot"></span>
                LIVE
            </span>
        </header>

        <main class="content">
            <div class="assignment-panel card">
                <div class="card-header">
                    <h2 class="panel-title">MODEL ASSIGNMENT</h2>
                </div>

                <div class="card-body">
                    <div class="model-grid">
                        <div class="model-row">
                            <label class="model-label">NORTH</label>
                            <SelectRoot v-model="models.north">
                                <SelectTrigger class="select-trigger">
                                    <SelectValue class="select-value" />
                                    <SelectIcon class="select-icon">▼</SelectIcon>
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectContent class="select-content">
                                        <SelectViewport>
                                            <SelectItem
                                                v-for="opt in modelOptions"
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
                        </div>

                        <div class="model-row">
                            <label class="model-label">EAST</label>
                            <SelectRoot v-model="models.east">
                                <SelectTrigger class="select-trigger">
                                    <SelectValue class="select-value" />
                                    <SelectIcon class="select-icon">▼</SelectIcon>
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectContent class="select-content">
                                        <SelectViewport>
                                            <SelectItem
                                                v-for="opt in modelOptions"
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
                        </div>

                        <div class="model-row">
                            <label class="model-label">SOUTH</label>
                            <SelectRoot v-model="models.south">
                                <SelectTrigger class="select-trigger">
                                    <SelectValue class="select-value" />
                                    <SelectIcon class="select-icon">▼</SelectIcon>
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectContent class="select-content">
                                        <SelectViewport>
                                            <SelectItem
                                                v-for="opt in modelOptions"
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
                        </div>

                        <div class="model-row">
                            <label class="model-label">WEST</label>
                            <SelectRoot v-model="models.west">
                                <SelectTrigger class="select-trigger">
                                    <SelectValue class="select-value" />
                                    <SelectIcon class="select-icon">▼</SelectIcon>
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectContent class="select-content">
                                        <SelectViewport>
                                            <SelectItem
                                                v-for="opt in modelOptions"
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
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="start-button-shell">
                        <Primitive
                            as="button"
                            type="button"
                            class="start-button"
                            @click="startGame"
                            aria-label="Start Game"
                        >
                            START GAME
                        </Primitive>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import {
    Primitive,
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
import { ref } from "vue";

const models = ref({
    north: "anthropic/claude-haiku-4.5",
    east: "google/gemini-2.5-flash",
    south: "openai/gpt-5-mini",
    west: "xai/grok-4.1-fast-non-reasoning",
});

const modelOptions = [
    { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    { value: "xai/grok-4.1-fast-non-reasoning", label: "Grok 4.1 Fast" },
];

const startGame = () => {
    navigateTo({
        path: "/game",
        query: {
            north: models.value.north,
            east: models.value.east,
            south: models.value.south,
            west: models.value.west,
        },
    });
};
</script>

<style scoped>
.arena-container {
    min-height: 100vh;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 60px 60px;
    background-color: #000;
    color: #fff;
    font-family: "Courier New", monospace;
}

.arena-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #333;
}

.arena-header h1 {
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
}

.live-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
    margin-right: 0.5rem;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 80px);
    padding: 2rem;
}

.assignment-panel {
    max-width: 800px;
    width: 100%;
}

.panel-title {
    font-size: 1.875rem;
    font-weight: bold;
    letter-spacing: 3px;
    text-align: center;
    margin: 0;
}

.model-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem 3rem;
    padding: 2rem 0;
}

.model-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.model-label {
    font-size: 1.125rem;
    font-weight: bold;
    letter-spacing: 2px;
    color: #e5e5e5;
}

.select-trigger {
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 6px;
    color: #fff;
    font-family: "Courier New", monospace;
    font-size: 1rem;
    padding: 0.875rem 1rem;
    cursor: pointer;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.select-trigger:hover {
    border-color: #666;
}

.select-trigger:focus-visible {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.select-icon {
    font-size: 0.75rem;
    opacity: 0.7;
}

.select-content {
    margin-top: 0.35rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #fff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;
}

.select-viewport {
    padding: 0.35rem;
}

.select-item {
    display: flex;
    align-items: center;
    padding: 0.6rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: "Courier New", monospace;
}

.select-item:hover,
.select-item[data-highlighted] {
    background: #1d4ed8;
}

.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid #3b82f6;
    padding: 0.35rem 0.75rem;
    border-radius: 0.25rem;
    font-family: "Courier New", monospace;
    font-weight: bold;
    font-size: 0.9rem;
}

.card {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    border-radius: 0.75rem;
    overflow: hidden;
    backdrop-filter: blur(8px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.card-header,
.card-footer {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #222;
}

.card-footer {
    border-top: 1px solid #222;
    border-bottom: none;
}

.card-body {
    padding: 1.5rem;
}

.start-button-shell {
    position: relative;
    width: 100%;
    background: rgba(6, 182, 212, 0.3);
    border: 2px solid #06b6d4;
    border-radius: 0.75rem;
    box-shadow:
        0 0 30px rgba(6, 182, 212, 0.7),
        0 0 60px rgba(6, 182, 212, 0.5),
        inset 0 0 30px rgba(6, 182, 212, 0.2);
    transition:
        box-shadow 0.3s ease,
        transform 0.2s ease,
        filter 0.3s ease;
    overflow: visible;
    animation: glowPulse 2.6s ease-in-out infinite;
}

.start-button-shell:hover {
    box-shadow:
        0 0 42px rgba(6, 182, 212, 0.9),
        0 0 90px rgba(6, 182, 212, 0.6),
        inset 0 0 40px rgba(6, 182, 212, 0.3);
    transform: translateY(-1px);
}

.start-button-shell:focus-within {
    box-shadow:
        0 0 55px rgba(249, 115, 22, 0.95),
        0 0 110px rgba(249, 115, 22, 0.7),
        inset 0 0 40px rgba(249, 115, 22, 0.35),
        0 0 0 10px rgba(249, 115, 22, 0.2);
    filter: drop-shadow(0 0 14px rgba(249, 115, 22, 0.7));
}

:global(.start-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100% !important;
    padding: 1.75rem 2rem !important;
    font-size: 2rem !important;
    letter-spacing: 0.2em !important;
    font-family: "Courier New", monospace !important;
    background: transparent !important;
    color: #fff !important;
    border: none !important;
    box-shadow: none !important;
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
}

@keyframes glowPulse {
    0%,
    100% {
        box-shadow:
            0 0 30px rgba(6, 182, 212, 0.7),
            0 0 60px rgba(6, 182, 212, 0.5),
            inset 0 0 30px rgba(6, 182, 212, 0.2);
    }
    50% {
        box-shadow:
            0 0 45px rgba(6, 182, 212, 0.9),
            0 0 90px rgba(6, 182, 212, 0.65),
            inset 0 0 40px rgba(6, 182, 212, 0.3);
    }
}
</style>
