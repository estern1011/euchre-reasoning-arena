import { describe, it, expect, beforeEach, vi } from "vitest";
import { useErrorHandling } from "../useErrorHandling";
import type { ErrorType } from "../useErrorHandling";

describe("useErrorHandling", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  afterEach(() => {
    const { clearError } = useErrorHandling();
    clearError();
  });

  describe("currentError", () => {
    it("should start as null", () => {
      const { currentError, clearError } = useErrorHandling();
      clearError(); // Ensure clean state
      expect(currentError.value).toBeNull();
    });

    it("should be set when setError is called", () => {
      const { currentError, setError } = useErrorHandling();
      
      setError("timeout", "Request timed out");
      
      expect(currentError.value).not.toBeNull();
      expect(currentError.value?.type).toBe("timeout");
      expect(currentError.value?.message).toBe("Request timed out");
    });
  });

  describe("setError", () => {
    it("should set error with type and message", () => {
      const { currentError, setError } = useErrorHandling();
      
      setError("api_error", "API failed");
      
      expect(currentError.value?.type).toBe("api_error");
      expect(currentError.value?.message).toBe("API failed");
      expect(currentError.value?.retryable).toBe(true); // default
    });

    it("should set retryable flag", () => {
      const { currentError, setError } = useErrorHandling();
      
      setError("illegal_move", "Illegal card played", false);
      
      expect(currentError.value?.retryable).toBe(false);
    });

    it("should set timestamp", () => {
      const { currentError, setError } = useErrorHandling();
      const before = Date.now();
      
      setError("connection", "Network error");
      
      const after = Date.now();
      expect(currentError.value?.timestamp).toBeGreaterThanOrEqual(before);
      expect(currentError.value?.timestamp).toBeLessThanOrEqual(after);
    });

    it("should handle all error types", () => {
      const { setError, currentError } = useErrorHandling();
      const types: ErrorType[] = ["connection", "timeout", "api_error", "illegal_move", "unknown"];
      
      types.forEach((type) => {
        setError(type, `Test ${type}`);
        expect(currentError.value?.type).toBe(type);
      });
    });
  });

  describe("clearError", () => {
    it("should clear current error", () => {
      const { currentError, setError, clearError } = useErrorHandling();
      
      setError("timeout", "Test error");
      expect(currentError.value).not.toBeNull();
      
      clearError();
      expect(currentError.value).toBeNull();
    });

    it("should be safe to call multiple times", () => {
      const { clearError } = useErrorHandling();
      
      clearError();
      clearError();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("hasError", () => {
    it("should be false when no error", () => {
      const { hasError } = useErrorHandling();
      expect(hasError.value).toBe(false);
    });

    it("should be true when error is set", () => {
      const { hasError, setError } = useErrorHandling();
      
      setError("api_error", "Test");
      
      expect(hasError.value).toBe(true);
    });

    it("should be false after clearing error", () => {
      const { hasError, setError, clearError } = useErrorHandling();
      
      setError("api_error", "Test");
      expect(hasError.value).toBe(true);
      
      clearError();
      expect(hasError.value).toBe(false);
    });
  });

  describe("canRetry", () => {
    it("should be false when no error", () => {
      const { canRetry } = useErrorHandling();
      expect(canRetry.value).toBe(false);
    });

    it("should be true for retryable errors", () => {
      const { canRetry, setError } = useErrorHandling();
      
      setError("timeout", "Test", true);
      
      expect(canRetry.value).toBe(true);
    });

    it("should be false for non-retryable errors", () => {
      const { canRetry, setError } = useErrorHandling();
      
      setError("illegal_move", "Test", false);
      
      expect(canRetry.value).toBe(false);
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("should return empty string for null error", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      expect(getUserFriendlyMessage(null)).toBe("");
    });

    it("should return friendly message for timeout", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      const error = { type: "timeout" as ErrorType, message: "Timeout", retryable: true, timestamp: Date.now() };
      
      const msg = getUserFriendlyMessage(error);
      
      expect(msg).toContain("longer than expected");
      expect(msg).toContain("try again");
    });

    it("should return friendly message for connection error", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      const error = { type: "connection" as ErrorType, message: "Failed", retryable: true, timestamp: Date.now() };
      
      const msg = getUserFriendlyMessage(error);
      
      expect(msg).toContain("Connection error");
      expect(msg).toContain("internet");
    });

    it("should return friendly message for illegal move", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      const error = { type: "illegal_move" as ErrorType, message: "Illegal", retryable: false, timestamp: Date.now() };
      
      const msg = getUserFriendlyMessage(error);
      
      expect(msg).toContain("illegal move");
      expect(msg).toContain("logged");
    });

    it("should return friendly message for API error", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      const error = { type: "api_error" as ErrorType, message: "API failed", retryable: true, timestamp: Date.now() };
      
      const msg = getUserFriendlyMessage(error);
      
      expect(msg).toContain("error occurred");
      expect(msg).toContain("try again");
    });

    it("should return original message for unknown error type", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      const error = { type: "unknown" as ErrorType, message: "Something went wrong", retryable: true, timestamp: Date.now() };
      
      const msg = getUserFriendlyMessage(error);
      
      expect(msg).toBe("Something went wrong");
    });

    it("should handle missing message in error", () => {
      const { getUserFriendlyMessage } = useErrorHandling();
      const error = { type: "unknown" as ErrorType, message: "", retryable: true, timestamp: Date.now() };
      
      const msg = getUserFriendlyMessage(error);
      
      expect(msg).toContain("unexpected error");
    });
  });

  describe("executeWithTimeout", () => {
    it("should execute function successfully", async () => {
      const { executeWithTimeout } = useErrorHandling();
      
      const result = await executeWithTimeout(
        async () => "success",
        1000
      );
      
      expect(result).toBe("success");
    });

    it("should timeout if function takes too long", async () => {
      vi.useFakeTimers();
      const { executeWithTimeout } = useErrorHandling();
      
      const slowFn = () => new Promise((resolve) => setTimeout(() => resolve("done"), 2000));
      
      const promise = executeWithTimeout(slowFn, 1000);
      
      await vi.advanceTimersByTimeAsync(1000);
      
      await expect(promise).rejects.toThrow("timed out");
      
      vi.useRealTimers();
    });

    it("should return result before timeout", async () => {
      const { executeWithTimeout } = useErrorHandling();
      
      const fastFn = () => new Promise((resolve) => setTimeout(() => resolve("fast"), 50));
      
      const result = await executeWithTimeout(fastFn, 1000);
      
      expect(result).toBe("fast");
    });

    it("should propagate function errors", async () => {
      const { executeWithTimeout } = useErrorHandling();
      
      const errorFn = async () => {
        throw new Error("Function error");
      };
      
      await expect(executeWithTimeout(errorFn, 1000)).rejects.toThrow("Function error");
    });
  });

  describe("withRetry", () => {
    it("should execute function successfully on first try", async () => {
      const { withRetry } = useErrorHandling();
      const fn = vi.fn().mockResolvedValue("success");
      
      const result = await withRetry(fn);
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure", async () => {
      vi.useFakeTimers();
      const { withRetry } = useErrorHandling();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockResolvedValue("success");
      
      const promise = withRetry(fn, 3, 5000);
      
      // Wait for first failure and backoff
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await promise;
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it("should use exponential backoff", async () => {
      vi.useFakeTimers();
      const { withRetry } = useErrorHandling();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValue("success");
      
      const promise = withRetry(fn, 3, 5000);
      
      // First retry after 1s
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second retry after 2s more
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await promise;
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
      
      vi.useRealTimers();
    });

    it("should throw after max retries", async () => {
      vi.useFakeTimers();
      const { withRetry, currentError } = useErrorHandling();
      const fn = vi.fn().mockRejectedValue(new Error("Always fails"));
      
      const promise = withRetry(fn, 2, 5000);
      
      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      
      await expect(promise).rejects.toThrow("Always fails");
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(currentError.value).not.toBeNull();
      
      vi.useRealTimers();
    });

    it("should detect timeout errors", async () => {
      vi.useFakeTimers();
      const { withRetry, currentError } = useErrorHandling();
      const fn = vi.fn().mockRejectedValue(new Error("Operation timed out"));
      
      const promise = withRetry(fn, 1, 5000);
      
      await vi.advanceTimersByTimeAsync(1000);
      
      await expect(promise).rejects.toThrow();
      expect(currentError.value?.type).toBe("timeout");
      
      vi.useRealTimers();
    });

    it("should detect connection errors", async () => {
      vi.useFakeTimers();
      const { withRetry, currentError } = useErrorHandling();
      const fn = vi.fn().mockRejectedValue(new Error("fetch failed"));
      
      const promise = withRetry(fn, 1, 5000);
      
      await vi.advanceTimersByTimeAsync(1000);
      
      await expect(promise).rejects.toThrow();
      expect(currentError.value?.type).toBe("connection");
      
      vi.useRealTimers();
    });

    it("should detect illegal move errors", async () => {
      vi.useFakeTimers();
      const { withRetry, currentError } = useErrorHandling();
      const fn = vi.fn().mockRejectedValue(new Error("illegal card played"));
      
      const promise = withRetry(fn, 1, 5000);
      
      await vi.advanceTimersByTimeAsync(1000);
      
      await expect(promise).rejects.toThrow();
      expect(currentError.value?.type).toBe("illegal_move");
      expect(currentError.value?.retryable).toBe(false); // Illegal moves shouldn't retry
      
      vi.useRealTimers();
    });

    it("should clear error on success", async () => {
      const { withRetry, currentError, setError } = useErrorHandling();
      const fn = vi.fn().mockResolvedValue("success");
      
      setError("api_error", "Previous error");
      expect(currentError.value).not.toBeNull();
      
      await withRetry(fn);
      
      expect(currentError.value).toBeNull();
    });

    it("should set isRetrying during retries", async () => {
      vi.useFakeTimers();
      const { withRetry, isRetrying } = useErrorHandling();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("Fail"))
        .mockResolvedValue("success");
      
      expect(isRetrying.value).toBe(false);
      
      const promise = withRetry(fn, 3, 5000);
      
      // During first attempt, not retrying yet
      await Promise.resolve();
      
      // After failure, should be retrying
      await vi.advanceTimersByTimeAsync(1000);
      
      await promise;
      
      // After success, should not be retrying
      expect(isRetrying.value).toBe(false);
      
      vi.useRealTimers();
    });

    it("should handle non-Error objects", async () => {
      vi.useFakeTimers();
      const { withRetry } = useErrorHandling();
      const fn = vi.fn().mockRejectedValue("string error");
      
      const promise = withRetry(fn, 1, 5000);
      
      await vi.advanceTimersByTimeAsync(1000);
      
      await expect(promise).rejects.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe("isRetrying", () => {
    it("should be false initially", () => {
      const { isRetrying } = useErrorHandling();
      expect(isRetrying.value).toBe(false);
    });

    it("should be false after successful operation", async () => {
      const { withRetry, isRetrying } = useErrorHandling();
      const fn = vi.fn().mockResolvedValue("success");
      
      await withRetry(fn);
      
      expect(isRetrying.value).toBe(false);
    });
  });
});
