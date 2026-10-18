import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const forbiddenPackages = ["bcrypt", "bcryptjs", "argon2"];

async function main(): Promise<void> {
  const packageJson = await readFile(join(root, "package.json"), "utf8");
  for (const packageName of forbiddenPackages) {
    if (packageJson.includes(`\"${packageName}\"`)) {
      throw new Error(
        `${packageName} must not be introduced beside Better Auth password handling.`
      );
    }
  }
  try {
    await readFile(join(root, "prisma", "auth-generated.prisma"), "utf8");
    throw new Error(
      "Generated Better Auth schema artifact must not be committed; use Prisma schema and migrations."
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ENOENT")) throw error;
  }
  const route = await readFile(
    join(root, "src", "app", "api", "auth", "[...all]", "route.ts"),
    "utf8"
  );
  for (const endpoint of ["/sign-up/email", "/impersonat", "/remove-user"]) {
    if (!route.includes(endpoint))
      throw new Error(`Authentication route must explicitly deny ${endpoint}.`);
  }
  console.log("Authentication static security checks passed.");
}

await main();
