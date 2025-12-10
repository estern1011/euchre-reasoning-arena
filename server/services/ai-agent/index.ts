/**
 * AI Agent service for making game decisions via Vercel AI Gateway
 * Uses structured output (Zod schemas) for reliable parsing
 * Includes telemetry for Vercel observability
 */

// Re-export public types
export type { TrumpBidResult, CardPlayResult, DiscardResult } from "./types";

// Re-export functions
export { makeTrumpBidDecision, makeTrumpBidDecisionStreaming } from "./trump-bid";
export { makeCardPlayDecision, makeCardPlayDecisionStreaming } from "./card-play";
export { makeDiscardDecision, makeDiscardDecisionStreaming } from "./discard";

// Re-export config utilities (for testing)
export { clearGatewayCache } from "./config";
