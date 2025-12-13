/**
 * Types for the Agent Reflection system ("What I Learned")
 *
 * After each hand, agents reflect on what went well or poorly,
 * and these reflections are injected into future prompts.
 */

import type { Position, Suit, Card } from '../../../lib/game/types';

/**
 * Summary of what happened in the hand for the reflecting agent
 */
export interface HandSummaryForAgent {
    handNumber: number;
    position: Position;
    modelId: string;

    // What trump decisions were made
    trumpDecision: {
        action: 'pass' | 'order_up' | 'call_trump';
        suit?: Suit;
        confidence?: number;
        wasSuccessful: boolean;  // Did the calling team win?
    } | null;

    // How many tricks did the agent's team win
    tricksWon: number;

    // Did the agent use a tool? How did it go?
    toolUsed: { tool: string; cost: number } | null;

    // Overall hand outcome
    outcome: {
        winningTeam: 'NS' | 'EW';
        callingTeam: 'NS' | 'EW';
        wasEuchred: boolean;
        wasMarch: boolean;
        points: number;
    };

    // Team information
    isOnCallingTeam: boolean;
    teamWon: boolean;
}

/**
 * Input to the reflection endpoint
 */
export interface ReflectionInput {
    summaries: HandSummaryForAgent[];  // One per agent
    previousReflections: Record<Position, string[]>;  // Previous reflections per agent
}

/**
 * Single agent's reflection output
 */
export interface AgentReflectionOutput {
    position: Position;
    reflection: string;  // 1-2 sentence insight
}

/**
 * Output from the reflection endpoint
 */
export interface ReflectionOutput {
    handNumber: number;
    reflections: AgentReflectionOutput[];
}
