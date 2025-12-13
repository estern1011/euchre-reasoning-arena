/**
 * Agent Reflection Service ("What I Learned")
 *
 * Generates post-hand reflections for each agent that can be
 * injected into their prompts for future hands.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '../ai-agent/config';
import { REFLECTION_SYSTEM_PROMPT, buildReflectionPrompt } from './prompts';
import type {
    ReflectionInput,
    ReflectionOutput,
    AgentReflectionOutput,
    HandSummaryForAgent,
} from './types';
import type { Position } from '../../../lib/game/types';

// Schema for reflection output
const ReflectionSchema = z.object({
    reflection: z.string().describe('Your 1-2 sentence reflection on what you learned this hand'),
});

// Use a fast model for reflections (each agent uses their own model)
const FALLBACK_MODEL = 'anthropic/claude-3-5-haiku-latest';

/**
 * Generate a reflection for a single agent
 */
async function generateAgentReflection(
    summary: HandSummaryForAgent,
    previousReflections: string[],
): Promise<string> {
    const prompt = buildReflectionPrompt(summary, previousReflections);

    try {
        // Use the agent's own model for their reflection
        const model = getModel(summary.modelId);

        const result = await generateObject({
            model,
            schema: ReflectionSchema,
            system: REFLECTION_SYSTEM_PROMPT,
            prompt,
            temperature: 0.7,
        });

        return result.object.reflection;
    } catch (error) {
        console.error(`Reflection generation failed for ${summary.position}:`, error);
        // Fallback: simple reflection based on outcome
        return generateFallbackReflection(summary);
    }
}

/**
 * Generate a simple fallback reflection if LLM fails
 */
function generateFallbackReflection(summary: HandSummaryForAgent): string {
    if (summary.outcome.wasEuchred && summary.isOnCallingTeam) {
        return 'Calling trump without enough support cost us the hand.';
    }
    if (summary.outcome.wasMarch && summary.teamWon) {
        return 'Strong hand and good card play led to a clean sweep.';
    }
    if (summary.toolUsed) {
        return summary.teamWon
            ? `Using ${summary.toolUsed.tool} helped make a confident decision.`
            : `The tool cost may not have been worth it this hand.`;
    }
    return summary.teamWon
        ? 'Solid play this hand - maintain consistency.'
        : 'Need to be more careful with trump calls and card selection.';
}

/**
 * Generate reflections for all agents after a hand
 */
export async function generateReflections(input: ReflectionInput): Promise<ReflectionOutput> {
    const { summaries, previousReflections } = input;

    if (summaries.length === 0) {
        throw new Error('No summaries provided for reflection');
    }

    const handNumber = summaries[0]!.handNumber;

    // Generate reflections in parallel for all agents
    const reflectionPromises = summaries.map(async (summary): Promise<AgentReflectionOutput> => {
        const prevRefs = previousReflections[summary.position] || [];
        const reflection = await generateAgentReflection(summary, prevRefs);
        return {
            position: summary.position,
            reflection,
        };
    });

    const reflections = await Promise.all(reflectionPromises);

    return {
        handNumber,
        reflections,
    };
}

export type { ReflectionInput, ReflectionOutput, AgentReflectionOutput, HandSummaryForAgent };
