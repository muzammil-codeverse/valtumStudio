import "server-only";

import { env } from "@/config/env/server";
import type { LogLevel } from "@/config/env/shared";

export type LogContext = Readonly<Record<string, unknown>>;

type LogEntry = Readonly<{
  context: LogContext;
  environment: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}>;

const logWeights: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const sensitiveKeyPattern = /authorization|cookie|key|password|secret|token/i;
const sensitiveValuePattern = /(bearer\s+|postgres(?:ql)?:\/\/|mysql:\/\/)/i;

function redactString(value: string): string {
  return sensitiveValuePattern.test(value) ? "[REDACTED]" : value;
}

function normalizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) {
    return "[TRUNCATED]";
  }

  if (value instanceof Error) {
    return {
      message: redactString(value.message),
      name: value.name
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[REDACTED]" : normalizeValue(entry, depth + 1)
      ])
    );
  }

  return typeof value === "string" ? redactString(value) : value;
}

function normalizeContext(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : normalizeValue(value)
    ])
  );
}

function shouldLog(level: LogLevel): boolean {
  return logWeights[level] >= logWeights[env.LOG_LEVEL];
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    context: normalizeContext(context),
    environment: env.APP_ENV,
    level,
    message: redactString(message),
    timestamp: new Date().toISOString()
  };

  const serializedEntry = JSON.stringify(entry);

  switch (level) {
    case "debug":
    case "info":
      console.info(serializedEntry);
      return;
    case "warn":
      console.warn(serializedEntry);
      return;
    case "error":
      console.error(serializedEntry);
      return;
  }
}

export const logger = Object.freeze({
  debug(message: string, context?: LogContext): void {
    writeLog("debug", message, context);
  },
  error(message: string, context?: LogContext): void {
    writeLog("error", message, context);
  },
  info(message: string, context?: LogContext): void {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    writeLog("warn", message, context);
  }
});
