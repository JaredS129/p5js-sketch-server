import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runScript, REPO_ROOT } from "../helpers";

const FIXTURE_NAME = "Vitest Delete Fixture";
const FIXTURE_ID = "vitest-delete-fixture";
const fixtureDir = path.join(REPO_ROOT, "sketches", FIXTURE_ID);

afterEach(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));

describe("delete-sketch", () => {
  it("hard-deletes an existing sketch folder", () => {
    expect(runScript("create-sketch.ts", [FIXTURE_NAME]).code).toBe(0);
    expect(fs.existsSync(fixtureDir)).toBe(true);

    const res = runScript("delete-sketch.ts", [FIXTURE_NAME]);
    expect(res.code).toBe(0);
    expect(fs.existsSync(fixtureDir)).toBe(false);
  });

  it("fails with usage when no name is given", () => {
    const res = runScript("delete-sketch.ts", []);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/Usage/);
  });

  it("fails when the sketch does not exist (no change)", () => {
    const res = runScript("delete-sketch.ts", ["does-not-exist-xyz"]);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/not found/);
  });
});
