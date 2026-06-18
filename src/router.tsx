import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { SketchPage } from "./pages/SketchPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * App routes (contracts/sketch-module.md routing contract):
 *   /             → home table
 *   /sketch/:id   → run a sketch + show its metadata
 *   *             → not found
 *
 * The id in the URL is the source of truth for which sketch is shown, so HMR /
 * reloads keep the user on the same sketch page.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sketch/:id" element={<SketchPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
