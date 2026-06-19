import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  const SPACING = 30; // grid spacing between vectors
  const RADIUS = 200; // influence radius
  const MAX_LEN = 22; // max arrow length at the mouse
  let cols: number, rows: number;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    cols = p.floor(p.width / SPACING);
    rows = p.floor(p.height / SPACING);
    p.strokeCap(p.ROUND);
  };

  p.draw = () => {
    p.background(15);

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * SPACING;
        const y = j * SPACING;

        const toMouse = p.createVector(p.mouseX - x, p.mouseY - y);
        const dist = toMouse.mag();

        // strength: 0 outside radius, 1 at the mouse, linear in between
        let strength = 0;
        if (dist < RADIUS) {
          strength = p.map(dist, RADIUS, 0, 0, 1);
        }

        if (strength <= 0) {
          // optional: draw a faint dot for zero vectors
          p.stroke(60);
          p.point(x, y);
          continue;
        }

        const len = strength * MAX_LEN;
        toMouse.setMag(len);

        p.stroke(p.lerpColor(p.color(60, 120, 255), p.color(255, 90, 90), strength));
        p.strokeWeight(p.map(strength, 0, 1, 1, 2.5));
        p.line(x, y, x + toMouse.x, y + toMouse.y);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    cols = p.floor(p.width / SPACING);
    rows = p.floor(p.height / SPACING);
  };
}
