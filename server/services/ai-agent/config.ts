import { createGateway } from "ai";
import { logger } from "./logger";

/**
 * Configuration and utilities for AI agent
 * Includes gateway management, retry logic, and timeout handling
 */

// Models that don't support temperature (reasoning models)
const REASONING_MODEL_PATTERNS = [
  /^openai\/o1/i,       // o1, o1-mini, o1-preview
  /^openai\/o3/i,       // o3, o3-mini
  /^openai\/gpt-5/i,    // gpt-5 reasoning models
  /-reasoning/i,        // Any model with -reasoning suffix
];

/** Check if a model is a reasoning model that doesn't support temperature */
function isReasoningModel(modelId: string): boolean {
  return REASONING_MODEL_PATTERNS.some(pattern => pattern.test(modelId));
}

/** Get model-specific config (some models don't support temperature) */
export function getModelConfig(modelId: string): { temperature?: number; maxTokens: number } {
  const baseConfig = { maxTokens: 1024 };

  if (isReasoningModel(modelId)) {
    // Reasoning models don't support temperature
    return baseConfig;
  }

  return {
    ...baseConfig,
    temperature: 0, // Deterministic for game decisions
  };
}

// Legacy export for backwards compatibility (use getModelConfig instead)
export const MODEL_CONFIG = {
  temperature: 0,
  maxTokens: 1024,
} as const;

// Timeout configuration
const TIMEOUT_MS = 30000; // 30 seconds

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
} as const;

// =============================================================================
// Gateway Management
// =============================================================================

let cachedGateway: ReturnType<typeof createGateway> | null = null;

function getGateway() {
  if (cachedGateway) return cachedGateway;

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY environment variable is not set");
  }
  cachedGateway = createGateway({ apiKey });
  return cachedGateway;
}

export function getModel(modelId: string) {
  return getGateway()(modelId);
}

/** Clear the gateway cache (for testing purposes) */
export function clearGatewayCache() {
  cachedGateway = null;
}

// =============================================================================
// Timeout Management
// =============================================================================

export interface TimeoutHandle {
  signal: AbortSignal;
  cleanup: () => void;
}

/** Create an AbortController with timeout that can be cleaned up */
export function createTimeout(): TimeoutHandle {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

// =============================================================================
// Retry Logic
// =============================================================================

/** Check if an error is retryable (network, rate limit, timeout, abort, etc.) */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("abort") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("529") ||
      message.includes("overloaded")
    );
  }
  return false;
}

/** Retry wrapper with exponential backoff for API calls */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error) || attempt === RETRY_CONFIG.maxRetries - 1) {
        throw lastError;
      }

      const delay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs,
      );

      logger.warn(
        `[AI-Agent] ${context} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}): ${lastError.message}. Retrying in ${delay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// =============================================================================
// Telemetry
// =============================================================================

/** Build telemetry config for AI SDK */
export function buildTelemetryConfig(functionId: string, metadata: Record<string, string>) {
  return {
    isEnabled: true,
    functionId,
    metadata,
    recordInputs: true,
    recordOutputs: true,
  };
}
