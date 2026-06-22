import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import { convertToNative } from "../lib/native-p5";

export interface NativeCodePanelProps {
  /** Lazy loader for the sketch's raw source (from SketchEntry.loadSource). */
  loadSource: () => Promise<string>;
  /** Sketch id — used as a remount/refresh key. */
  sketchId: string;
  /** Controls the panel heading and copy label. Defaults to "p5". */
  runner?: "p5" | "q5";
}

type Status = "loading" | "ready" | "error";
type CopyState = "idle" | "copied" | "failed";

/**
 * Read-only panel showing the native global-mode JavaScript equivalent of a sketch's
 * instance-mode source, with Prism syntax highlighting, one-click copy, and `CTRL + A`
 * selection scoped to the panel. See contracts/native-output-panel.md.
 */
export function NativeCodePanel({ loadSource, sketchId, runner = "p5" }: NativeCodePanelProps) {
  const label = runner === "q5" ? "Native q5.js" : "Native p5.js";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  // The raw converted string is the source of truth for copy & selection (FR-016, B4).
  const [code, setCode] = useState("");
  // Non-p5 imports whose definitions were dropped from the native output (see native-p5.ts).
  const [externalImports, setExternalImports] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const codeRef = useRef<HTMLElement>(null);

  // Load source + derive native code. Keyed on sketchId so Vite HMR re-runs this
  // when the underlying sketch.ts changes, without a page reload (B8, FR-014).
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setCopyState("idle");

    loadSource()
      .then((source) => {
        if (cancelled) return;
        const result = convertToNative(source);
        if (result.ok) {
          setCode(result.code);
          setExternalImports(result.externalImports);
          setStatus("ready");
        } else {
          setMessage(result.reason);
          setStatus("error");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMessage("Could not load the sketch source.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [loadSource, sketchId]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  // Scoped CTRL/CMD + A: select only the panel's code, never the whole page (FR-012, B7).
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      const el = codeRef.current;
      const selection = window.getSelection();
      if (el && selection) selection.selectAllChildren(el);
    }
  }

  const grammar = Prism.languages.javascript;
  const highlighted =
    status === "ready" && grammar ? Prism.highlight(code, grammar, "javascript") : "";

  return (
    <section className="rounded-lg border border-edge bg-surface">
      <header className="flex items-center justify-between border-b border-edge px-4 py-2">
        <h2 className="text-sm font-semibold text-muted">{label}</h2>
        {status === "ready" && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${label} code`}
            className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg transition-colors hover:border-accent"
          >
            {copyState === "copied" ? (
              <>
                <CheckIcon /> Copied
              </>
            ) : copyState === "failed" ? (
              <>
                <CopyIcon /> Copy failed
              </>
            ) : (
              <>
                <CopyIcon /> Copy
              </>
            )}
          </button>
        )}
      </header>

      {status === "loading" && (
        <p className="px-4 py-6 text-sm text-muted">Deriving native code…</p>
      )}

      {status === "error" && (
        <p className="px-4 py-6 text-sm text-muted">
          This sketch could not be converted to {label}: {message}
        </p>
      )}

      {status === "ready" && externalImports.length > 0 && (
        <p
          role="note"
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300/90"
        >
          This sketch imports{" "}
          {externalImports.map((mod, i) => (
            <span key={mod}>
              {i > 0 && ", "}
              <code className="font-mono">{mod}</code>
            </span>
          ))}
          . Imports are dropped from the native output, so this code won't run standalone
          in the p5.js editor until those dependencies are inlined or removed.
        </p>
      )}

      {status === "ready" && (
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="max-h-[28rem] overflow-auto px-4 py-3 outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <pre className="!m-0 !bg-transparent !p-0 text-sm leading-relaxed">
            <code
              ref={codeRef}
              className="language-javascript font-mono"
              // Read-only: highlighted markup is display-only; copy/select read `code` (B1, B4).
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      )}
    </section>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
