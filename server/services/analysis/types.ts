/**
 * Types for the Evolving Game Insights analysis system
 */

import type { Position, Suit, Card } from '../../../lib/game/types';

/**
 * Trump decision data for analysis
 */
export interface TrumpDecisionData {
    player: Position;
    action: 'call' | 'pass' | 'call_suit';
    confidence?: number;
    reasoning?: string;
    suit?: Suit;
}

/**
 * Card play data for analysis
 */
export interface CardPlayData {
    player: Position;
    card: Card;
    confidence?: number;
    reasoning?: string;
}

/**
 * Trick data for analysis
 */
export interface TrickData {
    plays: CardPlayData[];
    winner: Position;
}

/**
 * Hand outcome data
 */
export interface HandOutcome {
    callingTeam: 'NS' | 'EW';
    winningTeam: 'NS' | 'EW';
    points: number;
    wasEuchred: boolean;
    wasMarch: boolean;
    wasLoner: boolean;
}

/**
 * Input to the analysis endpoint
 */
export interface HandAnalysisInput {
    handNumber: number;
    trumpDecisions: TrumpDecisionData[];
    tricks: TrickData[];
    outcome: HandOutcome;
    modelIds: Record<Position, string>;
    previousInsights: EvolvedInsights | null;
}

/**
 * Statistical observations tracked over time
 */
export interface InsightStatistics {
    callSuccessRate: { NS: number; EW: number };
    avgConfidenceWhenCorrect: Record<Position, number>;
    avgConfidenceWhenWrong: Record<Position, number>;
}

/**
 * The evolving insights structure - cumulative analysis
 */
export interface EvolvedInsights {
    // Per-agent behavioral patterns (trend analysis)
    agentPatterns: Record<Position, string>;

    // Cross-model decision style comparison
    decisionStyleComparison: string;

    // Key memorable moments from the game
    keyMoments: string[];

    // Running game narrative
    gameNarrative: string;

    // Statistical observations
    statistics: InsightStatistics;
}

/**
 * Output from the analysis endpoint
 */
export interface HandAnalysisOutput {
    // Summary of this specific hand
    handSummary: string;

    // Evolved insights (cumulative)
    insights: EvolvedInsights;
}

/**
 * Default empty insights for starting a new game
 */
export function createEmptyInsights(): EvolvedInsights {
    return {
        agentPatterns: {
            north: 'No patterns observed yet',
            east: 'No patterns observed yet',
            south: 'No patterns observed yet',
            west: 'No patterns observed yet',
        },
        decisionStyleComparison: 'Awaiting data for comparison',
        keyMoments: [],
        gameNarrative: 'Game in progress...',
        statistics: {
            callSuccessRate: { NS: 0, EW: 0 },
            avgConfidenceWhenCorrect: { north: 0, east: 0, south: 0, west: 0 },
            avgConfidenceWhenWrong: { north: 0, east: 0, south: 0, west: 0 },
        },
    };
}
