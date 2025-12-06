<template>
    <div class="compact-arena">
        <!-- Visual Card Table -->
        <div class="mini-table">
            <!-- North Position -->
            <div class="mini-position north" :class="{ active: currentPlayer === 'north' }">
                <div class="player-label-box">
                    <span class="player-letter" :class="{ active: currentPlayer === 'north' }">N</span>
                </div>
                <div class="mini-cards">
                    <Card
                        v-for="(card, i) in playerHands.north"
                        :key="i"
                        :suit="card.suit"
                        :rank="card.rank"
                        :faceDown="false"
                        size="sm"
                    />
                </div>
            </div>

            <!-- West Position -->
            <div class="mini-position west" :class="{ active: currentPlayer === 'west' }">
                <div class="player-label-box">
                    <span class="player-letter" :class="{ active: currentPlayer === 'west' }">W</span>
                </div>
                <div class="mini-cards vertical">
                    <Card
                        v-for="(card, i) in playerHands.west"
                        :key="i"
                        :suit="card.suit"
                        :rank="card.rank"
                        :faceDown="false"
                        size="sm"
                    />
                </div>
            </div>

            <!-- Center - Turned Up Card -->
            <div class="mini-center">
                <Card
                    v-if="turnedUpCard"
                    :suit="turnedUpCard.suit"
                    :rank="turnedUpCard.rank"
                    :faceDown="false"
                    size="sm"
                />
            </div>

            <!-- East Position -->
            <div class="mini-position east" :class="{ active: currentPlayer === 'east' }">
                <div class="mini-cards vertical">
                    <Card
                        v-for="(card, i) in playerHands.east"
                        :key="i"
                        :suit="card.suit"
                        :rank="card.rank"
                        :faceDown="false"
                        size="sm"
                    />
                </div>
                <div class="player-label-box">
                    <span class="player-letter" :class="{ active: currentPlayer === 'east' }">E</span>
                </div>
            </div>

            <!-- South Position -->
            <div class="mini-position south" :class="{ active: currentPlayer === 'south' }">
                <div class="mini-cards">
                    <Card
                        v-for="(card, i) in playerHands.south"
                        :key="i"
                        :suit="card.suit"
                        :rank="card.rank"
                        :faceDown="false"
                        size="sm"
                    />
                </div>
                <div class="player-label-box">
                    <span class="player-letter" :class="{ active: currentPlayer === 'south' }">S</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from "~/components/Card.vue";
import type { Card as CardType, Position } from "~/types/game";

interface PlayerHands {
    north: CardType[];
    south: CardType[];
    east: CardType[];
    west: CardType[];
}

interface Props {
    playerHands: PlayerHands;
    playedCards: Record<string, CardType | null>;
    currentPlayer: Position | null;
    trumpSuit: string;
    currentTrick: number;
    turnedUpCard?: CardType | null;
}

defineProps<Props>();
</script>

<style scoped>
.compact-arena {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    font-family: "Courier New", Consolas, Monaco, monospace;
}

.mini-table {
    display: grid;
    grid-template-areas:
        ". north ."
        "west center east"
        ". south .";
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: auto 1fr auto;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-radius: 4px;
    min-height: 280px;
    position: relative;
}

.mini-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.mini-position.north {
    grid-area: north;
    justify-self: center;
}

.mini-position.south {
    grid-area: south;
    justify-self: center;
}

.mini-position.west {
    grid-area: west;
    justify-self: end;
    flex-direction: row;
    align-items: center;
}

.mini-position.east {
    grid-area: east;
    justify-self: start;
    flex-direction: row;
    align-items: center;
}

.mini-position.active {
    background: rgba(56, 189, 186, 0.1);
}

.player-label-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 4px;
}

.player-letter {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--color-text-secondary);
    letter-spacing: 0.5px;
}

.player-letter.active {
    color: var(--color-accent);
    text-shadow: 0 0 10px rgba(56, 189, 186, 0.5);
}

.mini-cards {
    display: flex;
}

/* Overlap effect for horizontal cards */
.mini-cards :deep(.playing-card) {
    margin-left: -18px;
}

.mini-cards :deep(.playing-card:first-child) {
    margin-left: 0;
}

.mini-cards.vertical {
    flex-direction: column;
}

/* Overlap effect for vertical cards */
.mini-cards.vertical :deep(.playing-card) {
    margin-left: 0;
    margin-top: -30px;
}

.mini-cards.vertical :deep(.playing-card:first-child) {
    margin-top: 0;
}

.mini-center {
    grid-area: center;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: rgba(56, 189, 186, 0.08);
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 4px;
    box-shadow: 0 0 15px rgba(56, 189, 186, 0.2);
}
</style>
