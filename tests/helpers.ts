import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export interface CliResult {
  code: number;
  output: string;
}

/** Run a CLI script via tsx, capturing exit code + combined stdout/stderr. */
export function runScript(script: string, args: string[]): CliResult {
  try {
    const out = execFileSync(
      "npx",
      ["tsx", `scripts/${script}`, ...args],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: "pipe" },
    );
    return { code: 0, output: out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return {
      code: e.status ?? 1,
      output: `${e.stdout ?? ""}${e.stderr ?? ""}`,
    };
  }
}
