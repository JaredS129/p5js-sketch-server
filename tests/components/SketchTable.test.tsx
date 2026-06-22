import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SketchTable } from "../../src/components/SketchTable";
import type { SketchMeta } from "../../scripts/lib/meta";

const data: SketchMeta[] = [
  {
    id: "flow-field",
    name: "Flow Field",
    dateCreated: "2026-06-01",
    dateUpdated: "2026-06-10",
    createdBy: "Ada Lovelace",
    lastUpdatedBy: "Grace Hopper",
    runner: "p5",
  },
  {
    id: "particle-system",
    name: "Particle System",
    dateCreated: "2026-05-02",
    dateUpdated: "2026-05-20",
    createdBy: "Alan Turing",
    lastUpdatedBy: "Alan Turing",
    runner: "p5",
  },
];

describe("SketchTable", () => {
  it("renders one row per sketch with all five metadata fields", () => {
    render(
      <MemoryRouter>
        <SketchTable data={data} />
      </MemoryRouter>,
    );

    // A row per sketch (plus the header row).
    expect(screen.getAllByRole("link")).toHaveLength(2);

    // All five fields for the first sketch are present.
    expect(screen.getByText("Flow Field")).toBeInTheDocument();
    expect(screen.getByText("2026-06-01")).toBeInTheDocument();
    expect(screen.getByText("2026-06-10")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();

    // Column headers.
    for (const header of ["Name", "Created", "Updated", "Created by", "Last updated by"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });
});
