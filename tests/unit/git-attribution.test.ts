import { describe, it, expect } from "vitest";
import {
  getGitUserName,
  resolveCommitRange,
  latestSketchCodeCommit,
} from "../../scripts/lib/git";

describe("git attribution helpers", () => {
  it("reads a configured git user name", () => {
    expect(getGitUserName().length).toBeGreaterThan(0);
  });

  it("resolves a commit range without throwing (string or null)", () => {
    const range = resolveCommitRange();
    expect(range === null || typeof range === "string").toBe(true);
  });

  it("returns null for a sketch with no qualifying commits", () => {
    expect(latestSketchCodeCommit("definitely-not-a-real-sketch-id", null)).toBeNull();
  });
});
