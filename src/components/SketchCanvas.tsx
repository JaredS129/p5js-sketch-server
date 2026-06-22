import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import p5 from "p5";
import type { Q5SketchModule, SketchModule } from "../sketches";

const CANVAS_CLASS = "max-h-[85vh] overflow-auto rounded-xl border border-edge bg-black";

/**
 * Mounts a p5 instance-mode sketch and tears it down cleanly on unmount.
 */
function P5SketchRunner({ load }: { load: () => Promise<SketchModule> }) {
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
        instance = new p5((mod as { default: (p: p5) => void }).default, containerRef.current);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      instance?.remove();
    };
  }, [load]);

  if (error) throw error;

  return <div ref={containerRef} className={CANVAS_CLASS} />;
}

/**
 * Mounts a Q5 instance-mode sketch and tears it down cleanly on unmount.
 * The sketch module default-exports `(q: Q5) => void` — Q5 calls it immediately,
 * so `q.setup` / `q.draw` assignments happen synchronously before the first frame.
 */
function Q5SketchRunner({ load }: { load: () => Promise<SketchModule> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let instance: Q5 | null = null;
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    load()
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        instance = new Q5((mod as Q5SketchModule).default, containerRef.current);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      void instance?.remove();
    };
  }, [load]);

  if (error) throw error;

  return <div ref={containerRef} className={CANVAS_CLASS} />;
}

interface BoundaryProps {
  children: ReactNode;
  sketchId: string;
}
interface BoundaryState {
  error: Error | null;
}

/** Isolates a crashing sketch so the rest of the app keeps working. */
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

/** Public component: error-isolated, auto-running sketch canvas. */
export function SketchCanvas({
  sketchId,
  load,
  runner,
}: {
  sketchId: string;
  load: () => Promise<SketchModule>;
  runner: "p5" | "q5";
}) {
  const Runner = runner === "q5" ? Q5SketchRunner : P5SketchRunner;
  return (
    <SketchErrorBoundary sketchId={sketchId}>
      <Runner key={sketchId} load={load} />
    </SketchErrorBoundary>
  );
}
