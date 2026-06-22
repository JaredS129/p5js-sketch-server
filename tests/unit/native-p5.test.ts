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

describe("convertToNative — golden fixture (SC-002)", () => {
  it("converts the pinned sample sketch character-for-character to the golden output", () => {
    // Both sides are dedicated fixtures (not a live sketch), so editing a real
    // sketch under `sketches/` can never break this golden-output test.
    const source = read("tests/unit/fixtures/sample-sketch.ts");
    const expected = read("tests/unit/fixtures/sample-sketch.native.js");
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

  it("R5b: drops destructuring of the p5 instance, leaving references as globals", () => {
    const out = code(`export default function sketch(p: p5): void {\n  const { createCanvas, background } = p;\n  p.setup = () => {\n    createCanvas(100, 100);\n    background(0);\n  };\n}\n`);
    expect(out).not.toContain("const {");
    expect(out).not.toContain("= p");
    expect(out).not.toMatch(/^\n/); // no leading blank line left where the binding was
    expect(out).toContain("createCanvas(100, 100)");
    expect(out).toContain("background(0)");
    expect(out.startsWith("function setup()")).toBe(true);
  });

  it("R5b: drops instance destructuring inside a hook body too", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.draw = () => {\n    const { background, ellipse } = p;\n    background(0);\n    ellipse(1, 2, 3, 4);\n  };\n}\n`);
    expect(out).not.toContain("const {");
    expect(out).toContain("background(0)");
    expect(out).toContain("ellipse(1, 2, 3, 4)");
  });

  it("R5b guard: keeps non-instance destructuring (e.g. from a vector)", () => {
    const out = code(`export default function sketch(p: p5): void {\n  p.draw = () => {\n    const v = p.createVector(1, 2);\n    const { x, y } = v;\n    p.print(x + y);\n  };\n}\n`);
    expect(out).toContain("const { x, y } = v;");
  });

  it("R6: removes type-only declarations (interface / type alias) entirely", () => {
    const out = code(`export default function sketch(p: p5): void {\n  interface Props {\n    x: number;\n    y: number;\n  }\n  type Id = string;\n  let n: number = 1;\n  p.setup = () => { p.print(n); };\n}\n`);
    expect(out).not.toContain("interface");
    expect(out).not.toContain("type Id");
    expect(out).toContain("let n = 1;");
    expect(out).toContain("function setup() {");
  });

  it("R6: drops uninitialized class fields (TS type-only) but keeps initialized ones", () => {
    const out = code(`export default function sketch(p: p5): void {\n  class Player {\n    readonly startX: number;\n    private posX: number;\n    static count: number = 0;\n    constructor() { this.posX = 0; }\n  }\n  p.setup = () => { new Player(); };\n}\n`);
    // Uninitialized fields are type-only members — removed entirely, NOT emitted
    // as bare `x;` class fields (which the p5 web editor's parser rejects).
    expect(out).not.toMatch(/^\s*startX;?\s*$/m);
    expect(out).not.toMatch(/^\s*posX;?\s*$/m);
    // Initialized field is kept (runtime-meaningful); type + TS modifiers stripped.
    expect(out).toContain("static count = 0;"); // `static` is valid JS, kept
    expect(out).not.toContain("readonly");
    expect(out).not.toContain(": number");
    expect(out).toContain("this.posX = 0;"); // constructor body untouched
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

  it("does not flag known runtime imports (p5, q5, p5play, q5play, ./globals)", () => {
    const res = convertToNative(
      `import "p5";\nimport "q5";\nimport "p5play";\nimport "q5play";\nimport "./globals";\nexport default function sketch(p: p5): void {\n  p.setup = () => {};\n}\n`,
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
