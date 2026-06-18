import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "../../scripts/lib/slug";

describe("slugify", () => {
  it("lowercases and converts spaces to dashes", () => {
    expect(slugify("Flow Field")).toBe("flow-field");
  });

  it("converts underscores to dashes", () => {
    expect(slugify("particle_system")).toBe("particle-system");
  });

  it("strips invalid characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses repeated and trims leading/trailing dashes", () => {
    expect(slugify("  --Cool   Sketch--  ")).toBe("cool-sketch");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Noir")).toBe("cafe-noir");
  });

  it("returns empty string when no valid characters remain", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("accepts kebab-case slugs", () => {
    expect(isValidSlug("flow-field")).toBe(true);
    expect(isValidSlug("particle-system-2")).toBe(true);
  });

  it("rejects empty, leading/trailing/double dashes and invalid chars", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("-x")).toBe(false);
    expect(isValidSlug("x-")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("Flow Field")).toBe(false);
  });
});
