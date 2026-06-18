import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import p5 from "p5";
import type { SketchModule } from "../sketches";

/**
 * Mounts a p5 instance-mode sketch into a container and tears it down cleanly.
 *
 * Lifecycle (contracts/sketch-module.md, research D6):
 *   - on mount / id change: lazily import the module, `new p5(default, el)` → auto-runs
 *   - on unmount / before re-creating: `instance.remove()` (no leaks/duplicate loops)
 *
 * HMR: editing a sketch file triggers a Vite update; because the URL holds the
 * sketch id, the user stays on /sketch/:id (never reverts to home) and the change
 * is reflected on reload. (FR-008, US3)
 */
function SketchRunner({ load }: { load: () => Promise<SketchModule> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let instance: p5 | null = null;
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    load()
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        instance = new p5(mod.default, containerRef.current);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      instance?.remove();
    };
  }, [load]);

  if (error) throw error; // surfaced by the surrounding SketchErrorBoundary

  return (
    <div
      ref={containerRef}
      className="max-h-[85vh] overflow-auto rounded-xl border border-edge bg-black"
    />
  );
}

interface BoundaryProps {
  children: ReactNode;
  sketchId: string;
}
interface BoundaryState {
  error: Error | null;
}

/** Isolates a crashing sketch so the rest of the app keeps working (Edge Cases). */
class SketchErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.sketchId !== this.props.sketchId && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-edge bg-surface p-6 text-sm">
          <h2 className="font-semibold text-fg">This sketch crashed</h2>
          <pre className="mt-2 overflow-auto font-mono text-xs text-muted">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Public component: error-isolated, auto-running p5 sketch canvas. */
export function SketchCanvas({
  sketchId,
  load,
}: {
  sketchId: string;
  load: () => Promise<SketchModule>;
}) {
  return (
    <SketchErrorBoundary sketchId={sketchId}>
      <SketchRunner key={sketchId} load={load} />
    </SketchErrorBoundary>
  );
}
