import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../src/components/EmptyState";

describe("EmptyState", () => {
  it("shows a clear empty message and the create command", () => {
    render(<EmptyState />);
    expect(screen.getByText(/No sketches yet/i)).toBeInTheDocument();
    expect(screen.getByText(/npm run create-sketch/)).toBeInTheDocument();
  });
});
