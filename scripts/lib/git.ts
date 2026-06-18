import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "./paths";

/** Field separator for git --format output (ASCII unit separator). */
const SEP = "\x1f";

/** Run a git command from the repo root and return trimmed stdout. */
function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

/** Same as git() but returns "" instead of throwing on non-zero exit. */
function gitSafe(args: string[]): string {
  try {
    return git(args);
  } catch {
    return "";
  }
}

/**
 * Resolve the local git user name (`git config user.name`).
 * Throws a clear error when it is not configured — create-sketch relies on this.
 */
export function getGitUserName(): string {
  const name = gitSafe(["config", "user.name"]);
  if (!name) {
    throw new Error(
      'git user.name is not configured. Set it with: git config user.name "Your Name"',
    );
  }
  return name;
}

/**
 * Resolve the commit range for an update-sketch-meta run.
 *
 * Base ref comes from CI (GITHUB_BASE_REF) with a local fallback (origin/main,
 * then main). Returns `BASE..HEAD` where BASE is the merge-base, or null when no
 * usable base can be determined (e.g. shallow clone / first commit) — callers
 * then fall back to scanning full history.
 */
export function resolveCommitRange(): string | null {
  const baseRef =
    process.env.GITHUB_BASE_REF?.trim() ||
    process.env.BASE_REF?.trim() ||
    "origin/main";

  const candidates = [baseRef, "main", "HEAD~1"];
  for (const candidate of candidates) {
    const base = gitSafe(["merge-base", candidate, "HEAD"]);
    if (base) return `${base}..HEAD`;
  }
  return null;
}

/** Author info for a single commit. */
export interface CommitInfo {
  hash: string;
  authorName: string;
  /** Author date as YYYY-MM-DD. */
  date: string;
}

/**
 * Find the latest commit that changed any file under `sketches/<id>/` other than
 * `meta.json`, restricted to the given range (or full history when range is null).
 * Returns null when no such commit exists. (research D8, FR-023/FR-024)
 */
export function latestSketchCodeCommit(
  id: string,
  range: string | null,
): CommitInfo | null {
  const args = [
    "log",
    "-1",
    `--format=%H${SEP}%an${SEP}%ad`,
    "--date=format:%Y-%m-%d",
  ];
  if (range) args.push(range);
  args.push("--", `sketches/${id}/`, `:(exclude)sketches/${id}/meta.json`);

  const out = gitSafe(args);
  if (!out) return null;

  const [hash, authorName, date] = out.split(SEP);
  if (!hash || !authorName || !date) return null;
  return { hash, authorName, date };
}
