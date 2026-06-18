import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runScript, REPO_ROOT } from "../helpers";

const FIXTURE_NAME = "Vitest Meta Fixture";
const FIXTURE_ID = "vitest-meta-fixture";
const fixtureDir = path.join(REPO_ROOT, "sketches", FIXTURE_ID);
const metaFile = path.join(fixtureDir, "meta.json");

afterEach(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));

describe("update-sketch-meta", () => {
  it("leaves an uncommitted sketch untouched (no qualifying commits)", () => {
    expect(runScript("create-sketch.ts", [FIXTURE_NAME]).code).toBe(0);
    const before = fs.readFileSync(metaFile, "utf8");

    const res = runScript("update-sketch-meta.ts", []);
    expect(res.code).toBe(0);

    const after = fs.readFileSync(metaFile, "utf8");
    // A brand-new, uncommitted sketch has no commit touching its code → unchanged. (FR-026)
    expect(after).toBe(before);
  });
});
