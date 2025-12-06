/**
 * Utility functions for model name handling
 */

/**
 * Extracts the short model name from a full model ID
 * e.g., "anthropic/claude-haiku-4.5" -> "claude-haiku-4.5"
 */
export function getShortModelName(modelId: string): string {
    if (!modelId) return 'Unknown';
    return modelId.split('/').pop() || modelId;
}
