<template>
    <div class="arena-container">
        <main class="content">
            <div class="hero-section">
                <h2 class="hero-title">
                    Euchre Arena
                </h2>
                <p class="hero-subtitle">
                    Real-time reasoning analysis from frontier AI models
                </p>
            </div>

            <div class="assignment-panel card">
                <div class="card-header">
                    <h2 class="panel-title"><span class="keyword">const</span> players = {</h2>
                </div>

                <div class="card-body">
                    <div class="model-grid">
                        <div v-if="loading" class="loading-message">
                            Loading models...
                        </div>
                        <template v-else>
                            <div class="model-row">
                                <label class="model-label">north:</label>
                                <ModelSelector v-model="gameStore.modelIds.north" :options="modelOptions" />
                                <span class="comma">,</span>
                            </div>

                            <div class="model-row">
                                <label class="model-label">east:</label>
                                <ModelSelector v-model="gameStore.modelIds.east" :options="modelOptions" />
                                <span class="comma">,</span>
                            </div>

                            <div class="model-row">
                                <label class="model-label">south:</label>
                                <ModelSelector v-model="gameStore.modelIds.south" :options="modelOptions" />
                                <span class="comma">,</span>
                            </div>

                            <div class="model-row">
                                <label class="model-label">west:</label>
                                <ModelSelector v-model="gameStore.modelIds.west" :options="modelOptions" />
                                <span class="comma">,</span>
                            </div>
                        </template>
                    </div>

                    <div class="config-section">
                        <div class="config-row">
                            <label class="config-label">winningScore:</label>
                            <select v-model.number="winningScore" class="score-selector">
                                <option :value="3">3</option>
                                <option :value="5">5</option>
                                <option :value="10">10</option>
                            </select>
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
import { ref, onMounted } from 'vue';
import { Primitive } from "radix-vue";
import { useGameStore } from '~/stores/game';
import ModelSelector from '~/components/ModelSelector.vue';

const gameStore = useGameStore()

interface ModelOption {
    value: string;
    label: string;
}

const modelOptions = ref<ModelOption[]>([]);
const loading = ref(true);

const winningScore = ref(10);

// Fetch models from API on mount
onMounted(async () => {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();
        modelOptions.value = data.models.map((model: any) => ({
            value: model.id,
            label: model.name,
        }));
    } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to default models if API fails
        modelOptions.value = [
            { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
            { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
            { value: "openai/gpt-5-mini", label: "GPT-5 mini" },
        ];
    } finally {
        loading.value = false;
    }
});

const startGame = () => {
    // Set winning score in the store before navigating
    gameStore.setWinningScore(winningScore.value);
    navigateTo("/game");
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







.content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 3rem 2rem;
    gap: 3rem;
}

.hero-section {
    text-align: center;
    max-width: 800px;
}



.hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #fff 0%, var(--color-accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-title .line {
    display: block;
}

.hero-subtitle {
    color: var(--color-text-secondary);
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
    color: var(--color-text);
}

.keyword {
    color: var(--color-keyword);
}

.model-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 2rem;
    padding: 2rem 0 1.5rem;
    padding-left: 1.5rem;
}

.loading-message {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--color-text-secondary);
    font-style: italic;
    padding: 2rem;
}

.model-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.model-row :deep(.model-select-trigger) {
    flex: 1;
    min-width: 0;
}


.model-label {
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: var(--color-accent);
    white-space: nowrap;
    flex-shrink: 0;
}

.comma {
    color: var(--color-text-muted);
    font-size: 1.125rem;
    flex-shrink: 0;
}

.closing-brace {
    font-size: 1.5rem;
    color: var(--color-text);
    padding: 0 0 1rem 0rem;
}

.config-section {
    padding: 1rem 0 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: 1rem;
}

.config-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.config-label {
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: var(--color-accent);
    white-space: nowrap;
}

.score-selector {
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(107, 114, 128, 0.3);
    border-radius: 0;
    color: var(--color-text);
    font-family: "Courier New", monospace;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 80px;
}

.score-selector:hover {
    border-color: rgba(56, 189, 186, 0.5);
    background: rgba(56, 189, 186, 0.05);
}

.score-selector:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(56, 189, 186, 0.2);
}

.score-selector option {
    background: #0a0a0a;
    color: var(--color-text);
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
    border: 3px solid rgba(56, 189, 186, 0.3);
    border-radius: 0px;
    overflow: hidden;
    backdrop-filter: blur(8px);
    box-shadow:
        8px 8px 0px rgba(56, 189, 186, 0.2),
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
        rgba(56, 189, 186, 0.1) 0%,
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
    background: rgba(56, 189, 186, 0.08);
    border: 3px solid rgba(56, 189, 186, 0.5);
    border-radius: 0px;
    box-shadow: 8px 8px 0px rgba(56, 189, 186, 0.3);
    transition:
        box-shadow 0.15s ease,
        transform 0.15s ease,
        border-color 0.15s ease,
        background 0.15s ease;
    overflow: visible;
}

.start-button-shell:hover {
    background: rgba(56, 189, 186, 0.12);
    border-color: rgba(56, 189, 186, 0.7);
    box-shadow: 12px 12px 0px rgba(56, 189, 186, 0.4);
    transform: translate(-4px, -4px);
}

.start-button-shell:active {
    box-shadow: 4px 4px 0px rgba(56, 189, 186, 0.3);
    transform: translate(4px, 4px);
}

.start-button-shell:focus-within {
    border-color: var(--color-accent);
    box-shadow:
        12px 12px 0px rgba(56, 189, 186, 0.5),
        0 0 0 4px rgba(56, 189, 186, 0.2);
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
    color: var(--color-accent) !important;
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
