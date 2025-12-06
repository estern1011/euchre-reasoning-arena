<template>
    <div v-if="cards.length > 0" class="hand-cards" :class="orientation">
        <Card
            v-for="(card, index) in cards"
            :key="`${index}`"
            :suit="card.suit"
            :rank="card.rank"
            :faceDown="false"
            :active="isActive"
            size="xs"
        />
    </div>
</template>

<script setup lang="ts">
import Card from "~/components/Card.vue";
import type { Card as CardType } from "~/types/game";

interface Props {
    cards: CardType[];
    orientation: 'horizontal' | 'vertical';
    isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
    isActive: false,
});
</script>

<style scoped>
.hand-cards {
    display: flex;
    justify-content: center;
    flex-wrap: nowrap;
}

.hand-cards.horizontal {
    flex-direction: row;
}

/* Overlap effect for horizontal cards */
.hand-cards.horizontal :deep(.playing-card) {
    margin-left: -20px;
}

.hand-cards.horizontal :deep(.playing-card:first-child) {
    margin-left: 0;
}

.hand-cards.vertical {
    flex-direction: column;
    align-items: center;
}

/* Overlap effect for vertical cards */
.hand-cards.vertical :deep(.playing-card) {
    margin-top: -45px;
}

.hand-cards.vertical :deep(.playing-card:first-child) {
    margin-top: 0;
}
</style>
