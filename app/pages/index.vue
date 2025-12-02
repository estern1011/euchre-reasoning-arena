<template>
    <div class="arena-container">
        <header class="arena-header">
            <h1>EUCHRE REASONING ARENA</h1>
            <UBadge color="primary" variant="subtle" size="lg">
                <span class="live-dot"></span>
                LIVE
            </UBadge>
        </header>

        <main class="content">
            <UCard class="assignment-panel">
                <template #header>
                    <h2 class="panel-title">MODEL ASSIGNMENT</h2>
                </template>

                <div class="model-grid">
                    <div class="model-row">
                        <label class="model-label">NORTH</label>
                        <USelectMenu
                            v-model="models.north"
                            :options="modelOptions"
                            value-attribute="value"
                            option-attribute="label"
                            class="model-select-menu"
                        />
                    </div>

                    <div class="model-row">
                        <label class="model-label">EAST</label>
                        <USelectMenu
                            v-model="models.east"
                            :options="modelOptions"
                            value-attribute="value"
                            option-attribute="label"
                            class="model-select-menu"
                        />
                    </div>

                    <div class="model-row">
                        <label class="model-label">SOUTH</label>
                        <USelectMenu
                            v-model="models.south"
                            :options="modelOptions"
                            value-attribute="value"
                            option-attribute="label"
                            class="model-select-menu"
                        />
                    </div>

                    <div class="model-row">
                        <label class="model-label">WEST</label>
                        <USelectMenu
                            v-model="models.west"
                            :options="modelOptions"
                            value-attribute="value"
                            option-attribute="label"
                            class="model-select-menu"
                        />
                    </div>
                </div>

                <template #footer>
                    <UButton
                        block
                        size="xl"
                        color="primary"
                        variant="solid"
                        @click="startGame"
                        class="start-button"
                    >
                        START GAME
                    </UButton>
                </template>
            </UCard>
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

const modelOptions = [
    { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    { value: "xai/grok-4.1-fast-non-reasoning", label: "Grok 4.1 Fast" },
];

const startGame = () => {
    // Navigate to game page with model selections
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

.start-button {
    font-family: "Courier New", monospace !important;
    font-size: 1.5rem !important;
    font-weight: bold !important;
    letter-spacing: 3px !important;
    padding: 1.25rem !important;
}

/* Override Nuxt UI Select Menu styling */
:deep(.model-select-menu button) {
    background: #1a1a1a !important;
    border: 1px solid #444 !important;
    color: #fff !important;
    font-family: "Courier New", monospace !important;
    padding: 0.875rem 1rem !important;
}

:deep(.model-select-menu button:hover) {
    border-color: #666 !important;
}

:deep(.model-select-menu button:focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}
</style>
