import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "../../src/pages/NotFoundPage";

describe("NotFoundPage", () => {
  it("renders a clear not-found state with a link back to the gallery", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Sketch not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to gallery/i })).toBeInTheDocument();
  });
});
