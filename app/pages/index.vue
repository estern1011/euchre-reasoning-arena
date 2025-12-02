<template>
    <div class="arena-container">
        <header class="arena-header">
            <h1><span class="bracket">&lt;</span>euchre.<span class="accent">arena</span><span class="bracket"> /&gt;</span></h1>
        </header>

        <main class="content">
            <div class="hero-section">
                <div class="code-comment">// ai_reasoning_arena</div>
                <h2 class="hero-title">
                    Euchre Arena
                </h2>
                <p class="hero-subtitle">
                    Real-time reasoning analysis from frontier AI models
                </p>
            </div>

            <div class="assignment-panel card">
                <div class="card-header">
                    <div class="code-comment">// model_assignment</div>
                    <h2 class="panel-title"><span class="keyword">const</span> players = {</h2>
                </div>

                <div class="card-body">
                    <div class="model-grid">
                        <div class="model-row">
                            <label class="model-label">north:</label>
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
                            <span class="comma">,</span>
                        </div>

                        <div class="model-row">
                            <label class="model-label">east:</label>
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
                            <span class="comma">,</span>
                        </div>

                        <div class="model-row">
                            <label class="model-label">south:</label>
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
                            <span class="comma">,</span>
                        </div>

                        <div class="model-row model-row-last">
                            <label class="model-label">west:</label>
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
                    <div class="closing-brace">}</div>
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
                            <span class="button-text">startGame()</span>
                            <span class="button-arrow">→</span>
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
    position: relative;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
        linear-gradient(rgba(255, 255, 255, 0.1) 2px, transparent 2px);
    background-size: 20px 20px;
    background-color: #0a0a0a;
    color: #fff;
    font-family: "Courier New", Consolas, Monaco, monospace;
}

.arena-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    z-index: 1;
}

.arena-container > * {
    position: relative;
    z-index: 2;
}

.arena-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.arena-header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin: 0;
    color: #e5e7eb;
}

.bracket {
    color: #6b7280;
}

.accent {
    color: #a3e635;
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
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 80px);
    padding: 3rem 2rem;
    gap: 3rem;
}

.hero-section {
    text-align: center;
    max-width: 800px;
}

.code-comment {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #fff 0%, #a3e635 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-title .line {
    display: block;
}

.hero-subtitle {
    color: #9ca3af;
    font-size: 1.125rem;
    letter-spacing: 0.025em;
}

.assignment-panel {
    max-width: 900px;
    width: 100%;
}

.panel-title {
    font-size: 1.5rem;
    font-weight: 500;
    margin: 0;
    color: #e5e7eb;
}

.keyword {
    color: #c084fc;
}

.model-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 2rem;
    padding: 2rem 0 1.5rem;
    padding-left: 1.5rem;
}

.model-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.model-row-last {
    gap: 1rem;
}

.model-row-last::after {
    content: '';
    width: 1.125rem;
}

.model-label {
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: #a3e635;
    white-space: nowrap;
    flex-shrink: 0;
}

.comma {
    color: #6b7280;
    font-size: 1.125rem;
    flex-shrink: 0;
}

.closing-brace {
    font-size: 1.5rem;
    color: #e5e7eb;
    padding: 0 0 1rem 0rem;
}

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

.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-family: "Courier New", monospace;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
}

.card {
    background: rgba(0, 0, 0, 0.6);
    border: 3px solid rgba(163, 230, 53, 0.3);
    border-radius: 0px;
    overflow: hidden;
    backdrop-filter: blur(8px);
    box-shadow:
        8px 8px 0px rgba(163, 230, 53, 0.2),
        0 0 40px rgba(0, 0, 0, 0.8);
    position: relative;
}

.card::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: linear-gradient(45deg,
        rgba(163, 230, 53, 0.1) 0%,
        transparent 50%,
        rgba(192, 132, 252, 0.1) 100%
    );
    z-index: -1;
    pointer-events: none;
}

.card-header,
.card-footer {
    padding: 2rem 2.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.card-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.card-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: none;
}

.card-body {
    padding: 0 2.5rem;
}

.start-button-shell {
    position: relative;
    width: 100%;
    background: rgba(163, 230, 53, 0.08);
    border: 3px solid rgba(163, 230, 53, 0.5);
    border-radius: 0px;
    box-shadow: 8px 8px 0px rgba(163, 230, 53, 0.3);
    transition:
        box-shadow 0.15s ease,
        transform 0.15s ease,
        border-color 0.15s ease,
        background 0.15s ease;
    overflow: visible;
}

.start-button-shell:hover {
    background: rgba(163, 230, 53, 0.12);
    border-color: rgba(163, 230, 53, 0.7);
    box-shadow: 12px 12px 0px rgba(163, 230, 53, 0.4);
    transform: translate(-4px, -4px);
}

.start-button-shell:active {
    box-shadow: 4px 4px 0px rgba(163, 230, 53, 0.3);
    transform: translate(4px, 4px);
}

.start-button-shell:focus-within {
    border-color: #a3e635;
    box-shadow:
        12px 12px 0px rgba(163, 230, 53, 0.5),
        0 0 0 4px rgba(163, 230, 53, 0.2);
}

:global(.start-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100% !important;
    padding: 1.5rem 2rem !important;
    font-size: 1.125rem !important;
    letter-spacing: 0.05em !important;
    font-family: "Courier New", monospace !important;
    background: transparent !important;
    color: #a3e635 !important;
    border: none !important;
    box-shadow: none !important;
    font-weight: 600 !important;
    transition: all 0.2s ease;
    cursor: pointer;
}

:global(.start-button:hover) {
    color: #fff !important;
}

.button-text {
    font-size: 1.125rem;
}

.button-arrow {
    font-size: 1.5rem;
    transition: transform 0.2s ease;
}

:global(.start-button:hover) .button-arrow {
    transform: translateX(4px);
}
</style>
