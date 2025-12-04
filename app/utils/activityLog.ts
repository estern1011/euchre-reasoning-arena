import type { Card, Position } from "~/types/game";
import { formatCard, formatPosition } from "../../lib/game/formatting";

export interface ActivityLogEntry {
  step: number;
  message: string;
}

export function formatCardPlayEntry(
  step: number,
  player: Position,
  card: Card
): string {
  return `${String(step).padStart(2, "0")} | [${formatPosition(player)}] ACTION: PLAYED ${formatCard(card)}`;
}

export function formatTrumpBidEntry(
  step: number,
  player: Position,
  action: string
): string {
  return `${String(step).padStart(2, "0")} | [${formatPosition(player)}] ACTION: ${action.toUpperCase()}`;
}

export function formatDiscardEntry(
  step: number,
  player: Position,
  card: Card
): string {
  return `${String(step).padStart(2, "0")} | [${formatPosition(player)}] ACTION: DISCARDED ${formatCard(card)}`;
}

export function formatIllegalAttemptEntry(
  step: number,
  player: Position,
  attemptedCard: Card,
  isFallback: boolean
): string {
  const cardStr = formatCard(attemptedCard);
  const playerStr = formatPosition(player);
  
  if (isFallback) {
    return `${String(step).padStart(2, "0")} | [${playerStr}] ⚠️ ILLEGAL → Chose ${cardStr}, retry failed, using fallback`;
  }
  
  return `${String(step).padStart(2, "0")} | [${playerStr}] ⚠️ RETRY → Chose ${cardStr} (illegal), retrying...`;
}

export function formatRoundSummaryEntry(summary: string): string {
  return summary;
}

export function formatErrorEntry(error: string): string {
  return `ERROR: ${error}`;
}
