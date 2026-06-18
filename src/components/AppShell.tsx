import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Dark-themed app frame: sticky header + main content area. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 border-b border-edge bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-fg hover:text-accent"
          >
            p5.js Sketch Gallery
          </Link>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
            local dev server
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
