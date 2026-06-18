import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runScript, REPO_ROOT } from "../helpers";
import { parseMeta } from "../../scripts/lib/meta";

const FIXTURE_NAME = "Vitest Fixture Sketch";
const FIXTURE_ID = "vitest-fixture-sketch";
const fixtureDir = path.join(REPO_ROOT, "sketches", FIXTURE_ID);

function cleanup() {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
}

afterEach(cleanup);

describe("create-sketch", () => {
  it("scaffolds folder, sketch.ts and a valid meta.json", () => {
    const res = runScript("create-sketch.ts", [FIXTURE_NAME]);
    expect(res.code).toBe(0);
    expect(fs.existsSync(path.join(fixtureDir, "sketch.ts"))).toBe(true);

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(fixtureDir, "meta.json"), "utf8")),
    );
    expect(meta.id).toBe(FIXTURE_ID);
    expect(meta.name).toBe(FIXTURE_NAME);
    expect(meta.dateUpdated).toBe(meta.dateCreated);
    expect(meta.lastUpdatedBy).toBe(meta.createdBy);
    expect(meta.createdBy.length).toBeGreaterThan(0);
  });

  it("fails with usage when no name is given (no mutation)", () => {
    const res = runScript("create-sketch.ts", []);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/Usage/);
  });

  it("fails on an invalid name (no mutation)", () => {
    const res = runScript("create-sketch.ts", ["!!!"]);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/Invalid sketch name/);
  });

  it("refuses to overwrite an existing sketch", () => {
    expect(runScript("create-sketch.ts", [FIXTURE_NAME]).code).toBe(0);
    const res = runScript("create-sketch.ts", [FIXTURE_NAME]);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/already exists/);
  });
});
