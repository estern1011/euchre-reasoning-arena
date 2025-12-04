import type { LogContext } from "./types";

/**
 * Structured JSON logger for Vercel observability
 * Outputs logs in JSON format for easy parsing in Vercel's log viewer
 */

type LogLevel = "info" | "warn" | "error";

export const logger = {
  _log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: "ai-agent",
      message,
      ...context,
    };
    const output = JSON.stringify(entry);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
  },

  info: (message: string, context?: LogContext) => logger._log("info", message, context),
  warn: (message: string, context?: LogContext) => logger._log("warn", message, context),
  error: (message: string, context?: LogContext) => logger._log("error", message, context),
};

/** Generate a unique correlation ID for request tracing */
export function generateCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
