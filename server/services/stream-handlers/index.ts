/**
 * Stream Phase Handlers
 *
 * Modular handlers for each phase of the Euchre game SSE stream.
 * Each handler is responsible for processing one game phase and
 * sending appropriate events to the client.
 */

export { handleTrumpSelection } from "./trump-selection";
export { handlePlayingPhase } from "./playing";
export { handleHandComplete, handleGameComplete } from "./completion";
export type { StreamContext, PhaseResult, DecisionRecord } from "./types";
