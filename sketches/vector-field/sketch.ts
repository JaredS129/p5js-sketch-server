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

  let {
    setup,
    draw,
    createCanvas,
    floor,
    strokeCap,
    background,
    point,
    lerpColor,
    stroke,
    strokeWeight,
    line,
    map,
    createVector,
    color,
    windowResized,
    resizeCanvas,
    windowHeight,
    windowWidth,
    width,
    height,
    mouseX,
    mouseY,
    ROUND,
  } = p;

  setup = () => {
    createCanvas(windowWidth, windowHeight);
    cols = floor(width / SPACING);
    rows = floor(height / SPACING);
    strokeCap(ROUND);
  };

  draw = () => {
    background(15);

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * SPACING;
        const y = j * SPACING;

        const toMouse = createVector(mouseX - x, mouseY - y);
        const dist = toMouse.mag();

        // strength: 0 outside radius, 1 at the mouse, linear in between
        let strength = 0;
        if (dist < RADIUS) {
          strength = map(dist, RADIUS, 0, 0, 1);
        }

        if (strength <= 0) {
          // optional: draw a faint dot for zero vectors
          stroke(60);
          point(x, y);
          continue;
        }

        const len = strength * MAX_LEN;
        toMouse.setMag(len);

        stroke(lerpColor(color(60, 120, 255), color(255, 90, 90), strength));
        strokeWeight(map(strength, 0, 1, 1, 2.5));
        line(x, y, x + toMouse.x, y + toMouse.y);
      }
    }
  };

  windowResized = () => {
    resizeCanvas(windowWidth, windowHeight);
    cols = floor(width / SPACING);
    rows = floor(height / SPACING);
  };
}
