<template>
    <div class="arena-container">
        <header class="arena-header">
            <h1>EUCHRE REASONING ARENA</h1>
            <div class="live-indicator">
                <span class="live-dot"></span>
                LIVE
            </div>
        </header>

        <main class="content">
            <div class="assignment-panel">
                <h2 class="panel-title">MODEL ASSIGNMENT</h2>

                <div class="model-grid">
                    <div class="model-row">
                        <label class="model-label">NORTH</label>
                        <select v-model="models.north" class="model-select">
                            <option value="anthropic/claude-haiku-4.5">
                                Claude Haiku 4.5
                            </option>
                            <option value="google/gemini-2.5-flash">
                                Gemini 2.5 Flash
                            </option>
                            <option value="openai/gpt-5-mini">
                                GPT-5 Mini
                            </option>
                            <option value="xai/grok-4.1-fast-non-reasoning">
                                Grok 4.1 Fast
                            </option>
                        </select>
                    </div>

                    <div class="model-row">
                        <label class="model-label">EAST</label>
                        <select v-model="models.east" class="model-select">
                            <option value="anthropic/claude-haiku-4.5">
                                Claude Haiku 4.5
                            </option>
                            <option value="google/gemini-2.5-flash">
                                Gemini 2.5 Flash
                            </option>
                            <option value="openai/gpt-5-mini">
                                GPT-5 Mini
                            </option>
                            <option value="xai/grok-4.1-fast-non-reasoning">
                                Grok 4.1 Fast
                            </option>
                        </select>
                    </div>

                    <div class="model-row">
                        <label class="model-label">SOUTH</label>
                        <select v-model="models.south" class="model-select">
                            <option value="anthropic/claude-haiku-4.5">
                                Claude Haiku 4.5
                            </option>
                            <option value="google/gemini-2.5-flash">
                                Gemini 2.5 Flash
                            </option>
                            <option value="openai/gpt-5-mini">
                                GPT-5 Mini
                            </option>
                            <option value="xai/grok-4.1-fast-non-reasoning">
                                Grok 4.1 Fast
                            </option>
                        </select>
                    </div>

                    <div class="model-row">
                        <label class="model-label">WEST</label>
                        <select v-model="models.west" class="model-select">
                            <option value="anthropic/claude-haiku-4.5">
                                Claude Haiku 4.5
                            </option>
                            <option value="google/gemini-2.5-flash">
                                Gemini 2.5 Flash
                            </option>
                            <option value="openai/gpt-5-mini">
                                GPT-5 Mini
                            </option>
                            <option value="xai/grok-4.1-fast-non-reasoning">
                                Grok 4.1 Fast
                            </option>
                        </select>
                    </div>
                </div>

                <button class="start-button" @click="startGame">
                    START GAME
                </button>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const models = ref({
    north: "anthropic/claude-haiku-4.5",
    east: "google/gemini-2.5-flash",
    south: "openai/gpt-5-mini",
    west: "xai/grok-4.1-fast-non-reasoning",
});

const startGame = () => {
    console.log("Starting game with models:", models.value);
    // TODO: Navigate to game page or start game logic
};
</script>

<style scoped>
.arena-container {
    min-height: 100vh;
    background:
        linear-gradient(90deg, rgba(50, 50, 50, 0.1) 1px, transparent 1px),
        linear-gradient(rgba(50, 50, 50, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
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

.live-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    letter-spacing: 1px;
}

.live-dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
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
    border: 2px solid #444;
    border-radius: 4px;
    padding: 3rem;
    max-width: 800px;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
}

.panel-title {
    font-size: 1.875rem;
    font-weight: bold;
    letter-spacing: 3px;
    text-align: center;
    margin: 0 0 3rem 0;
}

.model-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem 3rem;
    margin-bottom: 3rem;
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

.model-select {
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;
    font-family: "Courier New", monospace;
    font-size: 1rem;
    padding: 0.875rem 1rem;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    padding-right: 3rem;
    transition: border-color 0.2s;
}

.model-select:hover {
    border-color: #666;
}

.model-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.start-button {
    width: 100%;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    border: 2px solid #3b82f6;
    border-radius: 4px;
    color: #fff;
    font-family: "Courier New", monospace;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 3px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.start-button:hover {
    background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
}

.start-button:active {
    transform: translateY(0);
}
</style>
