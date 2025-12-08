/**
 * Prompts for the Evolving Game Insights LLM analysis
 */

import type { HandAnalysisInput, EvolvedInsights } from './types';
import type { Position } from '../../../lib/game/types';

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert Euchre analyst providing commentary on an AI vs AI game.

Your role is to:
1. Summarize what happened in this hand concisely
2. Identify behavioral patterns for each AI agent
3. Compare decision-making styles across different AI models
4. Build a narrative that evolves as the game progresses

Guidelines:
- Be concise but insightful (1-2 sentences per field)
- Focus on CALIBRATION: Does confidence match outcomes?
- Focus on STRATEGY: Are decisions well-reasoned given the hand?
- Focus on PATTERNS: What tendencies emerge over time?
- Focus on COMPARISONS: How do different AI models approach similar situations?

Teams:
- NS (North-South): Teammates
- EW (East-West): Teammates

When updating insights from previous hands, REFINE rather than rewrite.
Build on established patterns, don't contradict them without evidence.

Output valid JSON matching the HandAnalysisOutput schema.`;

export function buildAnalysisUserPrompt(input: HandAnalysisInput): string {
    const {
        handNumber,
        trumpDecisions,
        tricks,
        outcome,
        modelIds,
        previousInsights,
    } = input;

    let prompt = `## Hand ${handNumber} Analysis\n\n`;

    // Model info
    prompt += `### AI Models\n`;
    prompt += `- North: ${modelIds.north}\n`;
    prompt += `- East: ${modelIds.east}\n`;
    prompt += `- South: ${modelIds.south}\n`;
    prompt += `- West: ${modelIds.west}\n\n`;

    // Trump decisions
    prompt += `### Trump Decisions\n`;
    for (const decision of trumpDecisions) {
        const confStr = decision.confidence !== undefined ? ` (${decision.confidence}% confidence)` : '';
        const reasonStr = decision.reasoning ? `\n  Reasoning: "${truncate(decision.reasoning, 150)}"` : '';
        if (decision.action === 'call' || decision.action === 'call_suit') {
            prompt += `- ${decision.player.toUpperCase()}: Called ${decision.suit || 'trump'}${confStr}${reasonStr}\n`;
        } else {
            prompt += `- ${decision.player.toUpperCase()}: Passed${confStr}${reasonStr}\n`;
        }
    }
    prompt += '\n';

    // Tricks summary
    prompt += `### Tricks Played (${tricks.length} tricks)\n`;
    for (let i = 0; i < tricks.length; i++) {
        const trick = tricks[i];
        if (!trick) continue;
        const plays = trick.plays.map(p => {
            const confStr = p.confidence !== undefined ? ` (${p.confidence}%)` : '';
            return `${p.player.charAt(0).toUpperCase()}:${p.card.rank}${getSuitSymbol(p.card.suit)}${confStr}`;
        }).join(', ');
        const winnerStr = trick.winner ? trick.winner.toUpperCase() : 'unknown';
        prompt += `- Trick ${i + 1}: ${plays} → Winner: ${winnerStr}\n`;
    }
    prompt += '\n';

    // Outcome
    prompt += `### Hand Outcome\n`;
    prompt += `- Calling team: ${outcome.callingTeam}\n`;
    prompt += `- Winner: ${outcome.winningTeam}\n`;
    prompt += `- Points: ${outcome.points}\n`;
    if (outcome.wasEuchred) prompt += `- **EUCHRED!** (calling team failed)\n`;
    if (outcome.wasMarch) prompt += `- **MARCH!** (won all 5 tricks)\n`;
    if (outcome.wasLoner) prompt += `- Loner attempt\n`;
    prompt += '\n';

    // Previous insights
    if (previousInsights) {
        prompt += `### Previous Insights (from hands 1-${handNumber - 1})\n`;
        prompt += `Agent Patterns:\n`;
        for (const pos of ['north', 'east', 'south', 'west'] as Position[]) {
            prompt += `- ${pos.toUpperCase()}: ${previousInsights.agentPatterns[pos]}\n`;
        }
        prompt += `\nDecision Comparison: ${previousInsights.decisionStyleComparison}\n`;
        prompt += `\nGame Narrative: ${previousInsights.gameNarrative}\n`;
        if (previousInsights.keyMoments.length > 0) {
            prompt += `\nKey Moments:\n`;
            for (const moment of previousInsights.keyMoments.slice(-3)) {
                prompt += `- ${moment}\n`;
            }
        }
        prompt += `\n**UPDATE these insights based on the new hand. Patterns should become more refined, not completely rewritten.**\n\n`;
    } else {
        prompt += `This is the first hand - establish initial patterns based on what you observe.\n\n`;
    }

    prompt += `Provide your analysis as JSON with this structure:
{
  "handSummary": "Brief 1-2 sentence summary of what happened this hand",
  "insights": {
    "agentPatterns": {
      "north": "Pattern description for North",
      "east": "Pattern description for East",
      "south": "Pattern description for South",
      "west": "Pattern description for West"
    },
    "decisionStyleComparison": "How do the different AI models compare in their approach?",
    "keyMoments": ["Array of memorable plays/decisions from all hands so far"],
    "gameNarrative": "Overall story of the game so far",
    "statistics": {
      "callSuccessRate": { "NS": 0.0, "EW": 0.0 },
      "avgConfidenceWhenCorrect": { "north": 0, "east": 0, "south": 0, "west": 0 },
      "avgConfidenceWhenWrong": { "north": 0, "east": 0, "south": 0, "west": 0 }
    }
  }
}`;

    return prompt;
}

function getSuitSymbol(suit: string): string {
    const symbols: Record<string, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
    };
    return symbols[suit] || suit;
}

function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
}
