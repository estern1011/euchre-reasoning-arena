/**
 * Prompts for the Agent Reflection system ("What I Learned")
 */

import type { HandSummaryForAgent } from './types';

export const REFLECTION_SYSTEM_PROMPT = `You are an AI agent playing Euchre. After each hand, you reflect on what you learned.

Your reflection should be:
- ONE or TWO sentences maximum
- Specific to what happened (not generic advice)
- Focused on what YOU would do differently or what worked well
- Written in first person ("I should..." or "Leading trump early...")

Good reflections:
- "Calling trump with only the right bower was risky - I should wait for more support cards."
- "Leading trump early flushed out their bowers which let us take the last two tricks."
- "Using ask_audience was worth the cost since I was genuinely unsure about the bid."

Bad reflections (too generic):
- "I need to play better cards."
- "Trump is important in Euchre."
- "I should think more carefully."

Focus on ONE specific lesson from this hand.`;

export function buildReflectionPrompt(summary: HandSummaryForAgent, previousReflections: string[]): string {
    let prompt = `## Hand ${summary.handNumber} - Your Reflection\n\n`;

    // Position and outcome
    prompt += `You played as ${summary.position.toUpperCase()}.\n`;
    prompt += `Your team: ${summary.position === 'north' || summary.position === 'south' ? 'NS' : 'EW'}\n`;
    prompt += `Result: ${summary.teamWon ? 'WON' : 'LOST'} the hand\n\n`;

    // Trump decision
    if (summary.trumpDecision) {
        const action = summary.trumpDecision.action === 'pass'
            ? 'Passed'
            : `Called ${summary.trumpDecision.suit}`;
        const conf = summary.trumpDecision.confidence
            ? ` (${summary.trumpDecision.confidence}% confidence)`
            : '';
        const result = summary.trumpDecision.wasSuccessful ? 'succeeded' : 'failed';
        prompt += `Your trump decision: ${action}${conf}\n`;
        if (summary.trumpDecision.action !== 'pass') {
            prompt += `Calling ${result}.\n`;
        }
    }

    // Tricks
    prompt += `Your team won ${summary.tricksWon}/5 tricks.\n`;

    // Special outcomes
    if (summary.outcome.wasEuchred) {
        if (summary.isOnCallingTeam) {
            prompt += `**You got EUCHRED** - the calling team failed to win 3 tricks.\n`;
        } else {
            prompt += `**You EUCHRED the opponents** - they called but failed.\n`;
        }
    }
    if (summary.outcome.wasMarch) {
        prompt += `${summary.teamWon ? '**You MARCHED**' : '**Opponents MARCHED**'} - all 5 tricks!\n`;
    }

    // Tool usage
    if (summary.toolUsed) {
        prompt += `\nYou used the ${summary.toolUsed.tool} tool (-${summary.toolUsed.cost} points).\n`;
    }

    // Previous reflections
    if (previousReflections.length > 0) {
        prompt += `\n### Your Previous Reflections\n`;
        for (const ref of previousReflections.slice(-3)) {
            prompt += `- ${ref}\n`;
        }
        prompt += `\nBuild on or refine these insights. Don't repeat the same thing.\n`;
    }

    prompt += `\n### Your Reflection\n`;
    prompt += `What did you learn from this hand? (1-2 sentences, be specific)`;

    return prompt;
}
