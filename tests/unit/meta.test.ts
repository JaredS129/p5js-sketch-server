import { describe, it, expect } from "vitest";
import {
  parseMeta,
  safeParseMeta,
  serializeMeta,
  type SketchMeta,
} from "../../scripts/lib/meta";

const valid: SketchMeta = {
  id: "flow-field",
  name: "Flow Field",
  dateCreated: "2026-06-18",
  dateUpdated: "2026-06-18",
  createdBy: "Jared Stevenson",
  lastUpdatedBy: "Jared Stevenson",
  runner: "p5",
};

describe("parseMeta", () => {
  it("accepts a valid record", () => {
    expect(parseMeta(valid)).toEqual(valid);
  });

  it("rejects a bad id slug", () => {
    expect(() => parseMeta({ ...valid, id: "Flow Field" })).toThrow();
  });

  it("rejects a malformed date", () => {
    expect(() => parseMeta({ ...valid, dateUpdated: "06/18/2026" })).toThrow();
  });

  it("rejects empty required strings", () => {
    expect(() => parseMeta({ ...valid, createdBy: "" })).toThrow();
  });

  it("rejects unknown extra properties (strict)", () => {
    expect(() => parseMeta({ ...valid, extra: true })).toThrow();
  });
});

describe("safeParseMeta", () => {
  it("returns success=false instead of throwing", () => {
    expect(safeParseMeta({}).success).toBe(false);
    expect(safeParseMeta(valid).success).toBe(true);
  });
});

describe("serializeMeta", () => {
  it("produces canonical field order + trailing newline and round-trips", () => {
    const json = serializeMeta(valid);
    expect(json.endsWith("\n")).toBe(true);
    expect(Object.keys(JSON.parse(json))).toEqual([
      "id",
      "name",
      "dateCreated",
      "dateUpdated",
      "createdBy",
      "lastUpdatedBy",
    ]);
    expect(parseMeta(JSON.parse(json))).toEqual(valid);
  });
});
