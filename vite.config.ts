import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// q5play defaults to fetching Box2D from its CDN. Replace the entire block
// (CDN URL + try/catch resolve + import(variable)) with a static-literal
// import so Vite can rewrite the bare specifier at transform time.
// import(box2d3) where box2d3 is a runtime variable is opaque to Vite;
// import('box2d3-wasm') as a string literal is rewritten correctly.
function q5playLocalBox2d(): Plugin {
  const CDN_BLOCK =
    "let box2d3 = 'https://q5play.org/Box2D.deluxe.mjs';\n\n\t\t\ttry {\n\t\t\t\tbox2d3 = import.meta.resolve('box2d3-wasm');\n\t\t\t} catch (e) {}\n\n\t\t\tlet Box2DFactory = await import(box2d3);";
  const LOCAL_ONLY = "let Box2DFactory = await import('box2d3-wasm');";

  return {
    name: "q5play-local-box2d",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("q5play")) return;
      if (!code.includes(CDN_BLOCK)) return;
      return { code: code.replace(CDN_BLOCK, LOCAL_ONLY), map: null };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), q5playLocalBox2d()],
  optimizeDeps: {
    // q5play: excluded so the transform plugin above runs before the browser sees it.
    // box2d3-wasm: excluded so its new URL("Box2D.compat.wasm", import.meta.url)
    // WASM loading resolves correctly at runtime (esbuild can't handle that pattern).
    exclude: ["q5play", "box2d3-wasm"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
