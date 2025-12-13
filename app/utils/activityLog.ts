import type { Card, Position, Suit } from "~/types/game";
import { formatCard, formatPosition, formatSuit } from "../../lib/game/formatting";

export interface ActivityLogEntry {
  step: number;
  message: string;
}

// Individual action formatters
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
  action: string,
  goingAlone?: boolean
): string {
  const aloneStr = goingAlone ? " (GOING ALONE)" : "";
  return `${String(step).padStart(2, "0")} | [${formatPosition(player)}] ACTION: ${action.toUpperCase()}${aloneStr}`;
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

export function formatErrorEntry(error: string): string {
  return `ERROR: ${error}`;
}

// Round completion formatters - format structured data into display strings

export interface TrumpSelectionRoundData {
  selectionRound: 1 | 2;
  allPassed: boolean;
  trumpSelectionResult?: {
    trumpCaller: Position;
    trump: Suit;
    goingAlone: Position | null;
  } | null;
}

export function formatTrumpSelectionComplete(data: TrumpSelectionRoundData): string {
  if (data.trumpSelectionResult) {
    const { trumpCaller, trump, goingAlone } = data.trumpSelectionResult;
    const aloneStr = goingAlone ? " and is going alone" : "";
    return `--- Trump Selection Round ${data.selectionRound} complete: ${formatPosition(trumpCaller)} called ${formatSuit(trump)} as trump${aloneStr} ---`;
  }

  if (data.allPassed) {
    if (data.selectionRound === 1) {
      return `--- Trump Selection Round 1 complete: All passed, moving to Round 2 ---`;
    }
    return `--- Trump Selection Round 2 complete: All passed ---`;
  }

  return `--- Trump Selection Round ${data.selectionRound} complete ---`;
}

export interface TrickCompleteData {
  trickNumber: number;
  trickWinner: Position;
}

export function formatTrickComplete(data: TrickCompleteData): string {
  return `--- Trick ${data.trickNumber} complete: ${formatPosition(data.trickWinner)} wins ---`;
}

export interface HandCompleteData {
  handNumber: number;
  handScores: [number, number];
  gameScores: [number, number];
}

export function formatHandComplete(data: HandCompleteData): string {
  return `--- Hand ${data.handNumber} complete! Team 1: +${data.handScores[0]} (${data.gameScores[0]} total), Team 2: +${data.handScores[1]} (${data.gameScores[1]} total) ---`;
}

export interface GameCompleteData {
  gameScores: [number, number];
  winningTeam: 0 | 1;
}

export function formatGameComplete(data: GameCompleteData): string {
  const winner = data.winningTeam === 0 ? "Team 1" : "Team 2";
  return `=== GAME OVER! ${winner} wins ${data.gameScores[0]}-${data.gameScores[1]} ===`;
}

export function formatNewHandStart(handNumber: number, dealer: Position): string {
  return `--- Hand ${handNumber} starting (Dealer: ${formatPosition(dealer)}) ---`;
}

export function formatGameInitialized(): string {
  return "Game initialized successfully";
}

// Legacy function for backwards compatibility (deprecated)
export function formatRoundSummaryEntry(summary: string): string {
  return summary;
}
