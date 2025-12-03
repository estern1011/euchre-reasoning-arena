<template>
    <div class="card-table">
        <!-- North Position -->
        <div class="player-position north" :class="{ 'is-thinking': isCurrentPlayer('north') }">
            <PlayerHand :cards="playerHands.north" orientation="horizontal" />
            <PlayerInfo
                position="north"
                :model-name="formattedModels.north"
                :is-thinking="isCurrentPlayer('north') && isStreaming"
            />
        </div>

        <!-- West Position -->
        <div class="player-position west" :class="{ 'is-thinking': isCurrentPlayer('west') }">
            <PlayerInfo
                position="west"
                :model-name="formattedModels.west"
                :is-thinking="isCurrentPlayer('west') && isStreaming"
            />
            <PlayerHand :cards="playerHands.west" orientation="vertical" />

            <!-- Played Card -->
            <div v-if="playedCards.west" class="played-card">
                <Card
                    :suit="playedCards.west.suit"
                    :rank="playedCards.west.rank"
                />
            </div>
        </div>

        <!-- Center Area -->
        <div class="center-area">
            <div v-if="playedCards.center" class="center-card">
                <Card
                    :suit="playedCards.center.suit"
                    :rank="playedCards.center.rank"
                />
            </div>
            <div v-if="turnedUpCard" class="turned-up-card-display">
                <div class="card-label">// turned_up</div>
                <Card
                    :suit="turnedUpCard.suit"
                    :rank="turnedUpCard.rank"
                    size="md"
                />
            </div>
        </div>

        <!-- East Position -->
        <div class="player-position east" :class="{ 'is-thinking': isCurrentPlayer('east') }">
            <PlayerHand :cards="playerHands.east" orientation="vertical" />
            <PlayerInfo
                position="east"
                :model-name="formattedModels.east"
                :is-thinking="isCurrentPlayer('east') && isStreaming"
            />

            <!-- Played Card -->
            <div v-if="playedCards.east" class="played-card">
                <Card
                    :suit="playedCards.east.suit"
                    :rank="playedCards.east.rank"
                />
            </div>
        </div>

        <!-- South Position -->
        <div class="player-position south" :class="{ 'is-thinking': isCurrentPlayer('south') }">
            <PlayerInfo
                position="south"
                :model-name="formattedModels.south"
                :is-thinking="isCurrentPlayer('south') && isStreaming"
            />
            <PlayerHand :cards="playerHands.south" orientation="horizontal" />
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from "~/components/Card.vue";
import PlayerInfo from "~/components/PlayerInfo.vue";
import PlayerHand from "~/components/PlayerHand.vue";

interface CardType {
    suit: string;
    rank: string;
}

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
    currentPlayer: string | null;
    isStreaming: boolean;
}

const props = defineProps<Props>();

const isCurrentPlayer = (position: string) => {
    return props.currentPlayer === position;
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
    background: rgba(163, 230, 53, 0.03);
    border-color: rgba(163, 230, 53, 0.3);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.1);
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

.center-area {
    grid-area: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.center-card {
    /* Center played card styling */
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
    color: #6b7280;
    font-family: "Courier New", monospace;
    letter-spacing: 0.5px;
}
</style>
