import { useParams, Link } from "react-router-dom";
import { getSketch } from "../sketches";
import { SketchCanvas } from "../components/SketchCanvas";
import { MetaPanel } from "../components/MetaPanel";
import { NativeCodePanel } from "../components/NativeCodePanel";
import { NotFoundPage } from "./NotFoundPage";

/** Runs a single sketch (auto-start) and shows its five metadata fields (FR-006/FR-007). */
export function SketchPage() {
  const { id } = useParams<{ id: string }>();
  const sketch = id ? getSketch(id) : undefined;

  // Unknown id → clear not-found state (FR-011).
  if (!sketch) return <NotFoundPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{sketch.meta.name}</h1>
        <Link to="/" className="text-sm text-muted hover:text-fg">
          ← All sketches
        </Link>
      </div>

      <div className="space-y-6">
        <SketchCanvas sketchId={sketch.meta.id} load={sketch.load} runner={sketch.meta.runner} />
        <NativeCodePanel sketchId={sketch.meta.id} loadSource={sketch.loadSource} runner={sketch.meta.runner} />
        <div>
          <h2 className="mb-4 text-sm font-semibold text-muted">Metadata</h2>
          <MetaPanel meta={sketch.meta} />
        </div>
      </div>
    </div>
  );
}
