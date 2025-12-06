<template>
    <div class="board-scaler" ref="boardScaler">
        <div class="card-table" :style="{ transform: `scale(${scale})` }">
            <!-- North Position (top center) -->
            <div class="player-position north" :class="{ 'is-thinking': isCurrentPlayer('north'), 'sitting-out': isSittingOut('north') }">
                <PlayerPlaque
                    position="north"
                    :model-name="formattedModels.north"
                    :is-thinking="isCurrentPlayer('north') && isStreaming"
                    :is-dealer="dealer === 'north'"
                    :tricks-won="tricksWon?.north ?? 0"
                />
                <PlayerHand :cards="playerHands.north" orientation="horizontal" :is-active="isCurrentPlayer('north')" />
            </div>

            <!-- West Position (left side) -->
            <div class="player-position west" :class="{ 'is-thinking': isCurrentPlayer('west'), 'sitting-out': isSittingOut('west') }">
                <PlayerPlaque
                    position="west"
                    :model-name="formattedModels.west"
                    :is-thinking="isCurrentPlayer('west') && isStreaming"
                    :is-dealer="dealer === 'west'"
                    :tricks-won="tricksWon?.west ?? 0"
                />
                <PlayerHand :cards="playerHands.west" orientation="vertical" :is-active="isCurrentPlayer('west')" />
            </div>

            <!-- Center Area - played cards diamond -->
            <div class="center-area">
                <!-- North played card -->
                <div class="played-card played-north">
                    <Card
                        v-if="playedCards.north"
                        :suit="playedCards.north.suit"
                        :rank="playedCards.north.rank"
                        size="md"
                    />
                </div>
                <!-- West played card -->
                <div class="played-card played-west">
                    <Card
                        v-if="playedCards.west"
                        :suit="playedCards.west.suit"
                        :rank="playedCards.west.rank"
                        size="md"
                    />
                </div>
                <!-- Center: turned up card during trump selection -->
                <div v-if="turnedUpCard && !hasAnyPlayedCard" class="turned-up-card-display">
                    <div class="card-label">// turned_up</div>
                    <Card
                        :suit="turnedUpCard.suit"
                        :rank="turnedUpCard.rank"
                        size="md"
                    />
                </div>
                <!-- East played card -->
                <div class="played-card played-east">
                    <Card
                        v-if="playedCards.east"
                        :suit="playedCards.east.suit"
                        :rank="playedCards.east.rank"
                        size="md"
                    />
                </div>
                <!-- South played card -->
                <div class="played-card played-south">
                    <Card
                        v-if="playedCards.south"
                        :suit="playedCards.south.suit"
                        :rank="playedCards.south.rank"
                        size="md"
                    />
                </div>
            </div>

            <!-- East Position (right side) -->
            <div class="player-position east" :class="{ 'is-thinking': isCurrentPlayer('east'), 'sitting-out': isSittingOut('east') }">
                <PlayerHand :cards="playerHands.east" orientation="vertical" :is-active="isCurrentPlayer('east')" />
                <PlayerPlaque
                    position="east"
                    :model-name="formattedModels.east"
                    :is-thinking="isCurrentPlayer('east') && isStreaming"
                    :is-dealer="dealer === 'east'"
                    :tricks-won="tricksWon?.east ?? 0"
                />
            </div>

            <!-- South Position (bottom center) -->
            <div class="player-position south" :class="{ 'is-thinking': isCurrentPlayer('south'), 'sitting-out': isSittingOut('south') }">
                <PlayerHand :cards="playerHands.south" orientation="horizontal" :is-active="isCurrentPlayer('south')" />
                <PlayerPlaque
                    position="south"
                    :model-name="formattedModels.south"
                    :is-thinking="isCurrentPlayer('south') && isStreaming"
                    :is-dealer="dealer === 'south'"
                    :tricks-won="tricksWon?.south ?? 0"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Card from "~/components/Card.vue";
import PlayerPlaque from "~/components/PlayerPlaque.vue";
import PlayerHand from "~/components/PlayerHand.vue";
import type { Card as CardType, Position } from "~/types/game";

// Fixed board dimensions (design size)
const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 620;

const boardScaler = ref<HTMLElement | null>(null);
const scale = ref(1);

const updateScale = () => {
    if (!boardScaler.value) return;
    const parent = boardScaler.value.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;

    // Calculate scale to fit while maintaining aspect ratio
    const scaleX = parentWidth / BOARD_WIDTH;
    const scaleY = parentHeight / BOARD_HEIGHT;
    scale.value = Math.min(scaleX, scaleY, 1.2); // Cap at 1.2x to avoid looking too large
};

onMounted(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateScale);
});

interface PlayerHands {
    north: CardType[];
    south: CardType[];
    east: CardType[];
    west: CardType[];
}

interface PlayedCards {
    north?: CardType | null;
    south?: CardType | null;
    east?: CardType | null;
    west?: CardType | null;
    center?: CardType | null;
}

interface FormattedModels {
    north: string;
    south: string;
    east: string;
    west: string;
}

interface TricksWon {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface Props {
    playerHands: PlayerHands;
    playedCards: PlayedCards;
    formattedModels: FormattedModels;
    turnedUpCard?: CardType | null;
    currentPlayer: Position | null;
    isStreaming: boolean;
    goingAlone?: Position | null;
    dealer?: Position | null;
    tricksWon?: TricksWon;
}

const props = defineProps<Props>();

const isCurrentPlayer = (position: Position) => {
    return props.currentPlayer === position;
};

const hasAnyPlayedCard = computed(() => {
    return !!(props.playedCards.north || props.playedCards.south ||
              props.playedCards.east || props.playedCards.west);
});

// Get the partner who sits out when someone goes alone
const sittingOutPartner = computed<Position | null>(() => {
    if (!props.goingAlone) return null;
    const partners: Record<Position, Position> = {
        north: 'south',
        south: 'north',
        east: 'west',
        west: 'east',
    };
    return partners[props.goingAlone];
});

const isSittingOut = (position: Position) => {
    return sittingOutPartner.value === position;
};
</script>

<style scoped>
/* Container that handles scaling - full width background */
.board-scaler {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    min-height: 0;
    background:
        radial-gradient(ellipse at center, rgba(56, 189, 186, 0.02) 0%, transparent 70%),
        rgba(10, 20, 20, 0.7);
    box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.6);
}

/* Fixed-size card table - all positions are absolute */
.card-table {
    position: relative;
    width: 900px;
    height: 620px;
    transform-origin: center center;
}

/* All player positions are absolutely positioned */
.player-position {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* North: top center, column layout (plaque above cards) */
.player-position.north {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column;
    gap: 4px;
}

/* South: bottom center, column layout (cards above plaque) */
.player-position.south {
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column;
    gap: 4px;
}

/* West: left side, row layout (plaque left of cards) */
.player-position.west {
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    flex-direction: row;
    gap: 4px;
}

/* East: right side, row layout (cards left of plaque) */
.player-position.east {
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    flex-direction: row;
    gap: 4px;
}

.player-position.sitting-out {
    opacity: 0.35;
    filter: grayscale(0.7);
}

/* Center area - positioned in the middle */
.center-area {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 340px;
    height: 300px;
}

/* Played cards positioned absolutely within center area */
.played-card {
    position: absolute;
}

.played-north {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.played-south {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.played-west {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
}

.played-east {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}

/* Turned up card display in center */
.turned-up-card-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(56, 189, 186, 0.03);
    border: 1px solid rgba(56, 189, 186, 0.2);
    border-radius: 4px;
}

.card-label {
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
    letter-spacing: 0.5px;
}
</style>
