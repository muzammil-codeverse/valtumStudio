import { spawn } from "node:child_process";

// Accept the preview supervisor's Vite-style flags without changing Next's defaults.
const args = process.argv
  .slice(2)
  .flatMap((argument) =>
    argument === "--strictPort" ? [] : [argument === "--host" ? "--hostname" : argument]
  );
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--webpack", ...args],
  { stdio: "inherit", env: process.env }
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
