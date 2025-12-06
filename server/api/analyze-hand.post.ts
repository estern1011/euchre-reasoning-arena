/**
 * POST /api/analyze-hand
 *
 * Analyzes a completed hand and returns evolved insights.
 * Called after each hand completes to build up game analysis.
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { analyzeHand } from '../services/analysis';
import type { HandAnalysisInput } from '../services/analysis/types';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<HandAnalysisInput>(event);

        // Validate required fields
        if (typeof body.handNumber !== 'number') {
            throw createError({
                statusCode: 400,
                message: 'handNumber is required',
            });
        }

        if (!body.outcome) {
            throw createError({
                statusCode: 400,
                message: 'outcome is required',
            });
        }

        if (!body.modelIds) {
            throw createError({
                statusCode: 400,
                message: 'modelIds is required',
            });
        }

        // Perform the analysis
        const result = await analyzeHand(body);

        return {
            success: true,
            ...result,
        };
    } catch (error) {
        console.error('Hand analysis error:', error);

        if ((error as any).statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Analysis failed',
        });
    }
});
