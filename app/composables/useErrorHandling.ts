import { ref, computed } from "vue";

/**
 * Error handling composable with retry logic and timeout handling
 */

export type ErrorType =
  | "connection"
  | "timeout"
  | "api_error"
  | "illegal_move"
  | "unknown";

export interface ErrorState {
  type: ErrorType;
  message: string;
  retryable: boolean;
  timestamp: number;
}

const currentError = ref<ErrorState | null>(null);
const isRetrying = ref(false);

export function useErrorHandling() {
  /**
   * Set an error state
   */
  function setError(
    type: ErrorType,
    message: string,
    retryable: boolean = true,
  ) {
    currentError.value = {
      type,
      message,
      retryable,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear the current error
   */
  function clearError() {
    currentError.value = null;
  }

  /**
   * Execute a function with retry logic and exponential backoff
   * @param fn - Function to execute
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param timeout - Timeout in milliseconds (default: 30000)
   * @returns Result of the function
   */
  async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    timeout: number = 30000,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        isRetrying.value = attempt > 0;

        // Execute with timeout
        const result = await executeWithTimeout(fn, timeout);

        // Success - clear retry state and return
        isRetrying.value = false;
        clearError();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // All retries failed
    isRetrying.value = false;

    // Determine error type
    const errorMessage = lastError?.message || "Unknown error occurred";
    const lowerMessage = errorMessage.toLowerCase();
    let errorType: ErrorType = "unknown";

    if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
      errorType = "timeout";
    } else if (lowerMessage.includes("fetch") || lowerMessage.includes("network")) {
      errorType = "connection";
    } else if (lowerMessage.includes("illegal")) {
      errorType = "illegal_move";
    } else {
      errorType = "api_error";
    }

    setError(errorType, errorMessage, errorType !== "illegal_move");
    throw lastError;
  }

  /**
   * Execute a function with a timeout
   */
  async function executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
  }

  /**
   * Get user-friendly error message
   */
  function getUserFriendlyMessage(error: ErrorState | null): string {
    if (!error) return "";

    switch (error.type) {
      case "timeout":
        return "The AI is taking longer than expected. Please try again.";
      case "connection":
        return "Connection error. Please check your internet and try again.";
      case "illegal_move":
        return "The AI attempted an illegal move. This has been logged.";
      case "api_error":
        return "An error occurred while processing the request. Please try again.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }

  /**
   * Check if there's an active error
   */
  const hasError = computed(() => currentError.value !== null);

  /**
   * Check if the current error is retryable
   */
  const canRetry = computed(() => currentError.value?.retryable || false);

  return {
    // State
    currentError: computed(() => currentError.value),
    isRetrying: computed(() => isRetrying.value),
    hasError,
    canRetry,

    // Actions
    setError,
    clearError,
    withRetry,
    executeWithTimeout,
    getUserFriendlyMessage,
  };
}
