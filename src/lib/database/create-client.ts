import { checkServerIdentity } from "node:tls";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

export function createPrismaClient(connectionString: string): PrismaClient {
  const ca = process.env["DATABASE_TLS_CA"];
  const serverName = process.env["DATABASE_TLS_SERVER_NAME"];

  if (ca || serverName) {
    if (!ca || !serverName) {
      throw new Error(
        "DATABASE_TLS_CA and DATABASE_TLS_SERVER_NAME must be configured together."
      );
    }

    // pg connection-string SSL options replace the explicit SSL configuration.
    // Trust the configured database CA and verify the certificate's internal DNS
    // identity, even when connecting through a public TCP forwarding endpoint.
    const url = new URL(connectionString);
    for (const parameter of ["sslmode", "sslrootcert", "sslcert", "sslkey", "ssl"]) {
      url.searchParams.delete(parameter);
    }

    return new PrismaClient({
      adapter: new PrismaPg({
        connectionString: url.toString(),
        ssl: {
          ca,
          rejectUnauthorized: true,
          checkServerIdentity: (_hostname, certificate) =>
            checkServerIdentity(serverName, certificate)
        }
      })
    });
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  });
}
