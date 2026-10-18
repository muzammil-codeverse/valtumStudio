import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const models = [
  "User",
  "Session",
  "Account",
  "Verification",
  "TwoFactor",
  "RateLimit"
] as const;

function fieldNames(schema: string, model: string): readonly string[] {
  const match = schema.match(
    new RegExp(`model\\s+${model}\\s+\\{([\\s\\S]*?)\\n\\}`, "m")
  );
  const body = match?.[1];
  if (body === undefined) throw new Error(`Model ${model} was not found.`);
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line.length > 0 && !line.startsWith("@@") && !line.startsWith("//")
    )
    .map((line) => line.split(/\s+/, 1)[0])
    .filter((field): field is string => field !== undefined);
}

async function main(): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "siglum-auth-schema-"));
  const output = join(directory, "auth.prisma");
  try {
    await execFileAsync(
      "pnpm",
      [
        "exec",
        "auth",
        "generate",
        "--yes",
        "--config",
        "scripts/auth/schema-generation-config.ts",
        "--output",
        output
      ],
      {
        cwd: process.cwd(),
        env: process.env
      }
    );
    const [generated, application] = await Promise.all([
      readFile(output, "utf8"),
      readFile(join(process.cwd(), "prisma", "schema.prisma"), "utf8")
    ]);
    for (const model of models) {
      const actual = new Set(fieldNames(application, model));
      const missing = fieldNames(generated, model).filter(
        (field) => !actual.has(field)
      );
      if (missing.length > 0)
        throw new Error(`${model} is missing generated fields: ${missing.join(", ")}.`);
    }
    console.log("Better Auth generated schema fields are present in Prisma schema.");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

await main();
