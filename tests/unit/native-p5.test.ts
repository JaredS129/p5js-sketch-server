import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { convertToNative } from "../../src/lib/native-p5";

const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");

/** Assert success and return the converted code. */
function code(source: string): string {
  const res = convertToNative(source);
  expect(res.ok, res.ok ? "" : `expected success, got: ${res.reason}`).toBe(true);
  return res.ok ? res.code : "";
}

describe("convertToNative — vector-field fixture (SC-002)", () => {
  it("converts the example sketch character-for-character to the pinned fixture", () => {
    const source = read("sketches/vector-field/sketch.ts");
    const expected = read("tests/unit/fixtures/vector-field.native.js");
    const res = convertToNative(source);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.code).toBe(expected);
  });
});

describe("convertToNative — transform rules", () => {
  it("R1: removes import / import type statements", () => {
    const out = code(`import type p5 from "p5";\nimport { x } from "y";\nexport default function sketch(p: p5): void {\n  p.setup = () => {};\n}\n`);
    expect(out).not.toContain("import");
  });

  it("R2/R3: unwraps the factory and drops its signature & leading JSDoc", () => {
    const out = code(`import type p5 from "p5";\n\n/** docs */\nexport default function sketch(p: p5): void {\n  p.setup = () => {};\n}\n`);
    expect(out).not.toContain("export default");
    expect(out).not.toContain("sketch(");
    expect(out).not.toContain("docs");
  });

  it("R4: converts instance hook assignments to global functions", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.setup = () => { p.createCanvas(100, 100); };\n  p.draw = () => {};\n  p.windowResized = () => {};\n}\n`);
    expect(out).toContain("function setup() {");
    expect(out).toContain("function draw() {");
    expect(out).toContain("function windowResized() {");
    expect(out).not.toContain("p.setup");
    expect(out).not.toMatch(/};\s*$/); // trailing assignment semicolons dropped
  });

  it("R4: preserves hook parameters (e.g. mousePressed(event))", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.mousePressed = (event) => { p.print(event); };\n}\n`);
    expect(out).toContain("function mousePressed(event) {");
  });

  it("R5: removes the instance prefix from calls, properties, and constants", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.setup = () => {\n    p.createCanvas(p.windowWidth, p.windowHeight);\n    p.strokeCap(p.ROUND);\n  };\n}\n`);
    expect(out).toContain("createCanvas(windowWidth, windowHeight)");
    expect(out).toContain("strokeCap(ROUND)");
    expect(out).not.toContain("p.");
  });

  it("R5 guard: does NOT strip member access on non-instance objects", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.draw = () => {\n    const v = p.createVector(1, 2);\n    v.setMag(3);\n    const m = v.mag();\n    return v.x + v.y + m;\n  };\n}\n`);
    expect(out).toContain("v.setMag(3)");
    expect(out).toContain("v.mag()");
    expect(out).toContain("v.x + v.y");
    expect(out).toContain("createVector(1, 2)");
  });

  it("R6: strips type annotations on variables, parameters, and returns", () => {
    const out = code(`export default function sketch(p: p5): void {\n  let cols: number, rows: number;\n  function area(w: number, h: number): number { return w * h; }\n  cols = area(2, 3);\n}\n`);
    expect(out).toContain("let cols, rows;");
    expect(out).toContain("function area(w, h) {");
    expect(out).not.toContain(": number");
  });

  it("R8: preserves literal values and in-body comments exactly", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.setup = () => {\n    // keep me\n    p.createCanvas(1200, 1200);\n  };\n}\n`);
    expect(out).toContain("// keep me");
    expect(out).toContain("createCanvas(1200, 1200)");
  });

  it("supports an exported default arrow factory with a non-`p` instance name", () => {
    const out = code(`export default (sk: p5): void => {\n  sk.setup = () => { sk.background(0); };\n};\n`);
    expect(out).toContain("function setup() {");
    expect(out).toContain("background(0)");
    expect(out).not.toContain("sk.");
  });
});

describe("convertToNative — external import reporting", () => {
  it("reports non-p5 imports whose definitions are dropped from the output", () => {
    const res = convertToNative(
      `import type p5 from "p5";\nimport { createNoise2D } from "simplex-noise";\nimport { clamp } from "./utils";\nexport default function sketch(p: p5): void {\n  p.draw = () => { p.print(createNoise2D()(0, 0)); };\n}\n`,
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.externalImports).toEqual(["simplex-noise", "./utils"]);
  });

  it("does not flag the p5 import (or its subpaths)", () => {
    const res = convertToNative(
      `import p5 from "p5";\nimport "p5/lib/addons/p5.sound";\nexport default function sketch(p: p5): void {\n  p.setup = () => {};\n}\n`,
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.externalImports).toEqual([]);
  });
});

describe("convertToNative — failure contract (FR-015)", () => {
  const fails = (source: string) => {
    const res = convertToNative(source);
    expect(res.ok).toBe(false);
    return res.ok ? "" : res.reason;
  };

  it("fails when there is no default-export factory", () => {
    expect(fails(`function setup() {}\n`)).toMatch(/no default-export/i);
  });

  it("fails when the factory has no instance parameter", () => {
    expect(fails(`export default function sketch() {\n  setup = () => {};\n}\n`)).toMatch(/instance parameter/i);
  });

  it("fails on empty source", () => {
    expect(fails("   \n  ")).toMatch(/empty or could not be parsed/i);
  });

  it("fails on unsupported top-level constructs outside the factory", () => {
    expect(fails(`const GLOBAL = 1;\nexport default function sketch(p: p5) {\n  p.setup = () => {};\n}\n`)).toMatch(/unsupported module structure/i);
  });
});
