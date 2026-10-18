import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { prisma } from "./schema-generation-config";

export async function prompt(label: string): Promise<string> {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return (await readline.question(label)).trim();
  } finally {
    readline.close();
  }
}

export async function confirm(label: string): Promise<boolean> {
  return (await prompt(`${label} Type YES to continue: `)) === "YES";
}

export async function runCli(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operator command failed.";
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
