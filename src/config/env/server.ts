import "server-only";

import { parseServerEnvironment, type ServerEnvironment } from "@/config/env/shared";

import { type AuthEnvironment, parseAuthEnvironment } from "./auth";

const environmentInput = {
  APP_BASE_URL: process.env["APP_BASE_URL"],
  APP_ENV: process.env["APP_ENV"],
  DATABASE_URL: process.env["DATABASE_URL"],
  DIRECT_URL: process.env["DIRECT_URL"],
  LOG_LEVEL: process.env["LOG_LEVEL"]
};

export const env: Readonly<ServerEnvironment> =
  parseServerEnvironment(environmentInput);

export const authEnv: AuthEnvironment = parseAuthEnvironment(
  process.env,
  env.APP_ENV,
  env.APP_BASE_URL
);
