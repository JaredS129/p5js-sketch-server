import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

/** Shown for the `*` route and for unknown sketch ids (FR-011). */
export function NotFoundPage() {
  return (
    <div className="rounded-xl border border-edge bg-surface px-8 py-16 text-center">
      <h1 className="text-lg font-semibold text-fg">Sketch not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        The sketch you’re looking for doesn’t exist or has been removed.
      </p>
      <div className="mt-6 flex justify-center">
        <Button asChild>
          <Link to="/">Back to gallery</Link>
        </Button>
      </div>
    </div>
  );
}
