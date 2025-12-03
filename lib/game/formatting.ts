import type { Card, Suit, Position } from "./types";

export function formatSuit(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[suit];
}

export function formatCard(card: Card): string {
  return `${card.rank}${formatSuit(card.suit)}`;
}

export function formatPosition(position: Position): string {
  return position.toUpperCase();
}
