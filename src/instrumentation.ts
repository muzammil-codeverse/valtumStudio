import { env } from "@/config/env/server";

/** Validates critical server configuration when the Next.js server starts. */
export async function register(): Promise<void> {
  void env;
}
