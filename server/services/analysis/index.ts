/**
 * Evolving Game Insights Analysis Service
 *
 * Provides LLM-powered analysis of hands that builds up over the game.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '../ai-gateway';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserPrompt } from './prompts';
import type { HandAnalysisInput, HandAnalysisOutput, EvolvedInsights } from './types';
import { createEmptyInsights } from './types';

// Zod schema for the analysis output
const InsightStatisticsSchema = z.object({
    callSuccessRate: z.object({
        NS: z.number(),
        EW: z.number(),
    }),
    avgConfidenceWhenCorrect: z.object({
        north: z.number(),
        east: z.number(),
        south: z.number(),
        west: z.number(),
    }),
    avgConfidenceWhenWrong: z.object({
        north: z.number(),
        east: z.number(),
        south: z.number(),
        west: z.number(),
    }),
});

const EvolvedInsightsSchema = z.object({
    agentPatterns: z.object({
        north: z.string(),
        east: z.string(),
        south: z.string(),
        west: z.string(),
    }),
    decisionStyleComparison: z.string(),
    keyMoments: z.array(z.string()),
    gameNarrative: z.string(),
    statistics: InsightStatisticsSchema,
});

const HandAnalysisOutputSchema = z.object({
    handSummary: z.string(),
    insights: EvolvedInsightsSchema,
});

// Use a fast, cheap model for analysis
const ANALYSIS_MODEL = 'anthropic/claude-3-5-haiku-latest';

/**
 * Analyze a completed hand and return updated insights
 */
export async function analyzeHand(input: HandAnalysisInput): Promise<HandAnalysisOutput> {
    const userPrompt = buildAnalysisUserPrompt(input);

    try {
        const model = getModel(ANALYSIS_MODEL);

        const result = await generateObject({
            model,
            schema: HandAnalysisOutputSchema,
            system: ANALYSIS_SYSTEM_PROMPT,
            prompt: userPrompt,
            temperature: 0.7,
        });

        return result.object;
    } catch (error) {
        console.error('Analysis failed, returning fallback:', error);
        return createFallbackAnalysis(input);
    }
}

/**
 * Create a fallback analysis if LLM fails
 */
function createFallbackAnalysis(input: HandAnalysisInput): HandAnalysisOutput {
    const { outcome, previousInsights, handNumber } = input;

    const winner = outcome.winningTeam;
    const caller = outcome.callingTeam;
    const wasSuccessful = winner === caller;

    let handSummary = `Hand ${handNumber}: ${caller} called trump and `;
    if (outcome.wasEuchred) {
        handSummary += `got euchred! ${winner} scored ${outcome.points} points.`;
    } else if (outcome.wasMarch) {
        handSummary += `marched for ${outcome.points} points!`;
    } else {
        handSummary += wasSuccessful
            ? `won ${outcome.points} point${outcome.points > 1 ? 's' : ''}.`
            : `lost to ${winner}.`;
    }

    // Use previous insights or create new ones
    const insights: EvolvedInsights = previousInsights
        ? { ...previousInsights }
        : createEmptyInsights();

    // Add this hand as a key moment if notable
    if (outcome.wasEuchred || outcome.wasMarch) {
        insights.keyMoments.push(
            `Hand ${handNumber}: ${outcome.wasEuchred ? `${caller} got euchred` : `${winner} marched`}`
        );
    }

    // Update narrative
    insights.gameNarrative = `After ${handNumber} hand${handNumber > 1 ? 's' : ''}, the game continues...`;

    return {
        handSummary,
        insights,
    };
}

/**
 * Merge new analysis with existing insights
 * (Useful if we want to do client-side merging)
 */
export function mergeInsights(
    existing: EvolvedInsights | null,
    newAnalysis: HandAnalysisOutput
): EvolvedInsights {
    if (!existing) {
        return newAnalysis.insights;
    }

    // The LLM should have already merged, but we can do additional processing here
    return {
        ...newAnalysis.insights,
        // Preserve key moments from previous + add new ones
        keyMoments: [
            ...existing.keyMoments,
            ...newAnalysis.insights.keyMoments.filter(
                m => !existing.keyMoments.includes(m)
            ),
        ].slice(-10), // Keep last 10 moments
    };
}

export { createEmptyInsights };
export type { HandAnalysisInput, HandAnalysisOutput, EvolvedInsights };
