import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  p.setup = () => {
    p.createCanvas(1200, 1200);
  };

  p.draw = () => {
    p.background(18);
    p.noStroke();
    p.fill(124, 108, 255);
    p.circle(p.mouseX, p.mouseY, 40);
  };
}
