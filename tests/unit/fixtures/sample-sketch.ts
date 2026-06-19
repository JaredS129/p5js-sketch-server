import type p5 from "p5";

/**
 * Pinned input for the native-conversion character-for-character test.
 *
 * This is a standalone fixture (NOT a live sketch under `sketches/`) so that
 * editing a real sketch can never break the converter's golden-output test.
 * It is written to exercise the full set of transform rules together:
 * imports, the factory wrapper, hook assignments, the instance prefix,
 * TypeScript annotations, instance destructuring, and comment preservation.
 */
export default function sketch(p: p5): void {
  const { TWO_PI, sin, cos } = p;
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
        const wobble = sin(i * TWO_PI) + cos(j * TWO_PI);
        toMouse.setMag(len + wobble * 0);

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
