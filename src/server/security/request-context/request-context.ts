import "server-only";

import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { authEnv, env } from "@/config/env/server";

export type RequestSecurityContext = Readonly<{
  ipAddress?: string | undefined;
  method: string;
  origin?: string | undefined;
  path: string;
  requestId: string;
  userAgent?: string | undefined;
}>;

function normalizeIpAddress(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }
  const candidates = value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0);

  if (candidates.length !== 1 && authEnv.trustedProxyCidrs.length === 0) {
    return undefined;
  }
  const candidate = candidates.at(0);
  return candidate !== undefined && isIP(candidate) !== 0 ? candidate : undefined;
}

export function getRequestSecurityContext(request: Request): RequestSecurityContext {
  const requestId = request.headers.get("x-request-id");
  const origin = request.headers.get("origin");
  const configuredIpHeader = authEnv.ipAddressHeader?.toLowerCase();

  return {
    ipAddress: normalizeIpAddress(
      configuredIpHeader === undefined ? null : request.headers.get(configuredIpHeader)
    ),
    method: request.method,
    origin: origin === null ? undefined : origin,
    path: new URL(request.url).pathname,
    requestId:
      requestId !== null && /^[a-zA-Z0-9._-]{8,128}$/.test(requestId)
        ? requestId
        : randomUUID(),
    userAgent: request.headers.get("user-agent")?.slice(0, 512)
  };
}

export function isTrustedRequestOrigin(origin: string | undefined): boolean {
  if (origin === undefined) {
    return true;
  }
  return authEnv.trustedOrigins.includes(origin);
}

export function assertProductionProxyConfiguration(): void {
  if (
    env.APP_ENV === "production" &&
    authEnv.ipAddressHeader !== undefined &&
    authEnv.trustedProxyCidrs.length === 0
  ) {
    throw new Error(
      "Production trusted proxy CIDRs are required when AUTH_IP_ADDRESS_HEADER is configured."
    );
  }
}
