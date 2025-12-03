<template>
    <div
        class="player-position"
        :class="[position, { 'is-thinking': isCurrentPlayer }]"
    >
        <!-- Played Card (for non-center positions) -->
        <div v-if="playedCard && (position === 'west' || position === 'east')" class="played-card">
            <Card
                :suit="playedCard.suit"
                :rank="playedCard.rank"
            />
        </div>

        <!-- Hand cards for north/south (shown before player info) -->
        <div v-if="hand.length > 0 && position === 'north'" class="hand-cards">
            <Card
                v-for="(card, index) in hand"
                :key="`${position}-${index}`"
                :suit="card.suit"
                :rank="card.rank"
                :faceDown="false"
                size="sm"
            />
        </div>

        <!-- Player Info -->
        <div class="player-info">
            <div class="player-name">{{ position.toUpperCase() }}</div>
            <div class="model-name">{{ modelName }}</div>
            <div class="status" :class="{ 'thinking': isCurrentPlayer && isStreaming }">
                <span v-if="isCurrentPlayer && isStreaming" class="thinking-indicator">
                    <span class="thinking-dot"></span>
                    THINKING
                </span>
                <span v-else>WAITING</span>
            </div>
        </div>

        <!-- Hand cards for east/west/south -->
        <div v-if="hand.length > 0 && position !== 'north'" class="hand-cards">
            <Card
                v-for="(card, index) in hand"
                :key="`${position}-${index}`"
                :suit="card.suit"
                :rank="card.rank"
                :faceDown="false"
                size="sm"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from "~/components/Card.vue";

interface CardType {
    suit: string;
    rank: string;
}

interface Props {
    position: 'north' | 'south' | 'east' | 'west';
    modelName: string;
    hand: CardType[];
    playedCard?: CardType | null;
    isCurrentPlayer: boolean;
    isStreaming: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.player-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.1rem, 0.4vh, 0.25rem);
    position: relative;
    padding: clamp(0.1rem, 0.4vh, 0.25rem);
}

.player-position.north,
.player-position.south {
    flex-direction: column;
}

.player-position.west,
.player-position.east {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
}

.player-position.west {
    justify-content: flex-start;
}

.player-position.east {
    justify-content: flex-end;
    flex-direction: row-reverse;
}

.player-position.west .player-info,
.player-position.east .player-info {
    flex-shrink: 0;
    min-width: 0;
    max-width: 140px;
}

.played-card {
    position: absolute;
}

.player-position.north .played-card {
    bottom: -70px;
    left: 50%;
    transform: translateX(-50%);
}

.player-position.south .played-card {
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
}

.player-position.west .played-card {
    right: -85px;
    top: 50%;
    transform: translateY(-50%);
}

.player-position.east .played-card {
    left: -85px;
    top: 50%;
    transform: translateY(-50%);
}

.player-position.north {
    grid-area: north;
}

.player-position.west {
    grid-area: west;
}

.player-position.east {
    grid-area: east;
}

.player-position.south {
    grid-area: south;
}

.player-info {
    text-align: center;
    font-size: clamp(0.6rem, 1.2vh, 0.75rem);
    min-width: 0;
}

.player-name {
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: clamp(0.1rem, 0.3vh, 0.25rem);
    font-size: clamp(0.55rem, 1.1vh, 0.7rem);
}

.model-name {
    color: #9ca3af;
    margin-bottom: clamp(0.1rem, 0.3vh, 0.25rem);
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    max-width: 100%;
    min-width: 0;
    font-size: clamp(0.5rem, 1vh, 0.65rem);
    line-height: 1.2;
}

.status {
    color: #6b7280;
    font-size: clamp(0.5rem, 0.9vh, 0.6rem);
}

.status.thinking {
    color: #a3e635;
}

.thinking-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.thinking-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #a3e635;
    border-radius: 50%;
    animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        opacity: 1;
        box-shadow: 0 0 4px #a3e635;
    }
    50% {
        opacity: 0.4;
        box-shadow: 0 0 8px #a3e635;
    }
}

.player-position.is-thinking {
    background: rgba(163, 230, 53, 0.03);
    border-color: rgba(163, 230, 53, 0.3);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.1);
}

.hand-cards {
    display: flex;
    gap: clamp(1px, 0.3vh, 2px);
    justify-content: center;
    flex-wrap: nowrap;
}

.player-position.north .hand-cards,
.player-position.south .hand-cards {
    flex-direction: row;
    margin-top: 0;
}

.player-position.west .hand-cards,
.player-position.east .hand-cards {
    flex-direction: column;
    align-items: center;
    margin-top: 0;
    gap: clamp(1px, 0.3vh, 2px);
}
</style>
