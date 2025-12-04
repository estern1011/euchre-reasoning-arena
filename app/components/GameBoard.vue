<template>
    <div class="card-table">
        <!-- North Position (name above, cards below) -->
        <div class="player-position north" :class="{ 'is-thinking': isCurrentPlayer('north'), 'sitting-out': isSittingOut('north') }">
            <PlayerInfo
                position="north"
                :model-name="formattedModels.north"
                :is-thinking="isCurrentPlayer('north') && isStreaming"
                :is-going-alone="goingAlone === 'north'"
                :is-dealer="dealer === 'north'"
            />
            <PlayerHand :cards="playerHands.north" orientation="horizontal" />
        </div>

        <!-- West Position -->
        <div class="player-position west" :class="{ 'is-thinking': isCurrentPlayer('west'), 'sitting-out': isSittingOut('west') }">
            <PlayerInfo
                position="west"
                :model-name="formattedModels.west"
                :is-thinking="isCurrentPlayer('west') && isStreaming"
                :is-going-alone="goingAlone === 'west'"
                :is-dealer="dealer === 'west'"
            />
            <PlayerHand :cards="playerHands.west" orientation="vertical" />
        </div>

        <!-- Center Area with Diamond Formation -->
        <div class="center-area">
            <!-- Played Cards Diamond -->
            <div v-if="hasAnyPlayedCard" class="played-cards-diamond">
                <div class="diamond-north">
                    <Card
                        v-if="playedCards.north"
                        :suit="playedCards.north.suit"
                        :rank="playedCards.north.rank"
                        size="md"
                    />
                </div>
                <div class="diamond-middle">
                    <div class="diamond-west">
                        <Card
                            v-if="playedCards.west"
                            :suit="playedCards.west.suit"
                            :rank="playedCards.west.rank"
                            size="md"
                        />
                    </div>
                    <div class="diamond-east">
                        <Card
                            v-if="playedCards.east"
                            :suit="playedCards.east.suit"
                            :rank="playedCards.east.rank"
                            size="md"
                        />
                    </div>
                </div>
                <div class="diamond-south">
                    <Card
                        v-if="playedCards.south"
                        :suit="playedCards.south.suit"
                        :rank="playedCards.south.rank"
                        size="md"
                    />
                </div>
            </div>

            <!-- Turned Up Card (only during trump selection) -->
            <div v-if="turnedUpCard && !hasAnyPlayedCard" class="turned-up-card-display">
                <div class="card-label">// turned_up</div>
                <Card
                    :suit="turnedUpCard.suit"
                    :rank="turnedUpCard.rank"
                    size="md"
                />
            </div>
        </div>

        <!-- East Position (cards left, name right) -->
        <div class="player-position east" :class="{ 'is-thinking': isCurrentPlayer('east'), 'sitting-out': isSittingOut('east') }">
            <PlayerInfo
                position="east"
                :model-name="formattedModels.east"
                :is-thinking="isCurrentPlayer('east') && isStreaming"
                :is-going-alone="goingAlone === 'east'"
                :is-dealer="dealer === 'east'"
            />
            <PlayerHand :cards="playerHands.east" orientation="vertical" />
        </div>

        <!-- South Position (cards above, name below) -->
        <div class="player-position south" :class="{ 'is-thinking': isCurrentPlayer('south'), 'sitting-out': isSittingOut('south') }">
            <PlayerHand :cards="playerHands.south" orientation="horizontal" />
            <PlayerInfo
                position="south"
                :model-name="formattedModels.south"
                :is-thinking="isCurrentPlayer('south') && isStreaming"
                :is-going-alone="goingAlone === 'south'"
                :is-dealer="dealer === 'south'"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from "~/components/Card.vue";
import PlayerInfo from "~/components/PlayerInfo.vue";
import PlayerHand from "~/components/PlayerHand.vue";
import type { Card as CardType, Position } from "~/types/game";

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

interface Props {
    playerHands: PlayerHands;
    playedCards: PlayedCards;
    formattedModels: FormattedModels;
    turnedUpCard?: CardType | null;
    currentPlayer: Position | null;
    isStreaming: boolean;
    goingAlone?: Position | null;
    dealer?: Position | null;
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
.card-table {
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 0px;
    flex: 1;
    display: grid;
    grid-template-areas:
        ". north ."
        "west center east"
        ". south .";
    grid-template-columns: clamp(150px, 15vw, 200px) 1fr clamp(150px, 15vw, 200px);
    grid-template-rows: auto 1fr auto;
    padding: 0.25rem;
    gap: 0.25rem;
    height: calc(100vh - 200px);
    overflow: hidden;
}

.player-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.1rem, 0.4vh, 0.25rem);
    position: relative;
    padding: clamp(0.1rem, 0.4vh, 0.25rem);
}

.player-position.north {
    grid-area: north;
}

.player-position.west {
    grid-area: west;
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.75rem;
}

.player-position.east {
    grid-area: east;
    flex-direction: row-reverse;
    justify-content: flex-end;
    gap: 0.75rem;
}

.player-position.south {
    grid-area: south;
}

.player-position.is-thinking {
    background: rgba(163, 230, 53, 0.08);
    border: 2px solid rgba(163, 230, 53, 0.6);
    border-radius: 4px;
    box-shadow:
        0 0 15px rgba(163, 230, 53, 0.3),
        0 0 30px rgba(163, 230, 53, 0.15),
        inset 0 0 20px rgba(163, 230, 53, 0.05);
    animation: thinking-pulse 2s ease-in-out infinite;
}

@keyframes thinking-pulse {
    0%, 100% {
        box-shadow:
            0 0 15px rgba(163, 230, 53, 0.3),
            0 0 30px rgba(163, 230, 53, 0.15),
            inset 0 0 20px rgba(163, 230, 53, 0.05);
        border-color: rgba(163, 230, 53, 0.6);
    }
    50% {
        box-shadow:
            0 0 25px rgba(163, 230, 53, 0.5),
            0 0 50px rgba(163, 230, 53, 0.25),
            inset 0 0 30px rgba(163, 230, 53, 0.08);
        border-color: rgba(163, 230, 53, 0.9);
    }
}

.player-position.sitting-out {
    opacity: 0.35;
    filter: grayscale(0.7);
}

.center-area {
    grid-area: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.played-cards-diamond {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.5rem, 2vh, 1.5rem);
}

.diamond-north {
    display: flex;
    justify-content: center;
}

.diamond-middle {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: clamp(4rem, 12vw, 10rem);
}

.diamond-west,
.diamond-east {
    display: flex;
    justify-content: center;
}

.diamond-south {
    display: flex;
    justify-content: center;
}

.turned-up-card-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(163, 230, 53, 0.03);
    border: 1px solid rgba(163, 230, 53, 0.2);
    border-radius: 2px;
}

.card-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
    letter-spacing: 0.5px;
}
</style>
