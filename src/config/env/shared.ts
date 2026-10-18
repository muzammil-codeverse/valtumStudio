import { z } from "zod";

export const applicationEnvironmentSchema = z.enum([
  "local",
  "test",
  "preview",
  "staging",
  "production"
]);

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

export const serverEnvironmentSchema = z.object({
  APP_BASE_URL: z.url({ error: "APP_BASE_URL must be a valid absolute URL." }),
  APP_ENV: applicationEnvironmentSchema,
  DATABASE_URL: z.url({ error: "DATABASE_URL must be a valid PostgreSQL URL." }),
  DIRECT_URL: z.url({ error: "DIRECT_URL must be a valid PostgreSQL URL." }),
  LOG_LEVEL: logLevelSchema
});

export type ApplicationEnvironment = z.infer<typeof applicationEnvironmentSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export type EnvironmentInput = Readonly<Record<string, string | undefined>>;

export function parseServerEnvironment(input: EnvironmentInput): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse({
    APP_BASE_URL: input["APP_BASE_URL"],
    APP_ENV: input["APP_ENV"],
    DATABASE_URL: input["DATABASE_URL"],
    DIRECT_URL: input["DIRECT_URL"],
    LOG_LEVEL: input["LOG_LEVEL"]
  });

  if (result.success) {
    return Object.freeze(result.data);
  }

  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(
    `Invalid server environment configuration. ${issues} ` +
      "Copy .env.example to .env.local and provide valid values."
  );
}
