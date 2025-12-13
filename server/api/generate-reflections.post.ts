/**
 * POST /api/generate-reflections
 *
 * Generates "What I Learned" reflections for each agent after a hand completes.
 * These reflections are stored and injected into future prompts.
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { generateReflections } from '../services/reflection';
import type { ReflectionInput } from '../services/reflection/types';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<ReflectionInput>(event);

        // Validate required fields
        if (!body.summaries || !Array.isArray(body.summaries) || body.summaries.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'summaries array is required and must not be empty',
            });
        }

        // Generate reflections
        const result = await generateReflections(body);

        return {
            success: true,
            ...result,
        };
    } catch (error) {
        console.error('Reflection generation error:', error);

        if ((error as { statusCode?: number }).statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Reflection generation failed',
        });
    }
});
