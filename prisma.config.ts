import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: process.env["ENV_FILE"] ?? ".env.local" });

export default defineConfig({
  datasource: {
    url: process.env["DIRECT_URL"] ?? ""
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  schema: "prisma/schema.prisma"
});
