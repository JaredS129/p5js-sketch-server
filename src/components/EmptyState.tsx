/** Home empty state shown when no sketches exist on disk (FR-010). */
export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-edge bg-surface px-8 py-16 text-center">
      <h2 className="text-lg font-semibold text-fg">No sketches yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Create your first sketch from the command line:
      </p>
      <pre className="mx-auto mt-4 w-fit rounded-md bg-surface-2 px-4 py-2 font-mono text-sm text-fg">
        npm run create-sketch "My Sketch"
      </pre>
    </div>
  );
}
