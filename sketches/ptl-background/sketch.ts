//@ts-nocheck
import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  let canvasWidth = 1920;
  let canvasHeight = 1080;

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);
    p.stroke(210, 190, 190);

    p.angleMode(p.DEGREES);
    p.fill(220);
  };

  let strokeInit = 0.01;

  let diamondWidth = 300;
  let diamondHeight = 300;

  let xAnim = 4;
  let yAnim = 50;

  function diamond(cx, cy, dWidth, dHeight) {
    p.beginShape();

    let w = dWidth * 0.5;
    let h = dHeight * 0.5;

    p.vertex(cx + w, cy);
    p.vertex(cx, cy + h);
    p.vertex(cx - w, cy);
    p.vertex(cx, cy - h);

    p.endShape(p.CLOSE);
  }

  function isoGrid(origX, origY, gWidth, gHeight) {
    let sWeight = strokeInit;

    let sideLength = diamondWidth * Math.sqrt(2) - diamondWidth;

    let originX = origX;
    let originY = origY;
    let strokeInc = 0.05;

    for (let y = 1; y <= gHeight / diamondHeight; y++) {
      for (let x = 1; x <= (gWidth / diamondWidth) * 2; x++) {
        let xInc = x * (diamondWidth * 0.5);
        let yDec = 0;

        if (x % 2 == 0) {
          yDec = diamondHeight * 0.5;
        } else {
          yDec = 0;
        }
        diamond(
          originX + xInc * (p.sin(p.map(p.mouseX, 0, p.width, 0, xAnim)) + 0.35),
          originY - yDec * p.cos(p.map(p.mouseY, 0, p.height, 0, yAnim)),
          diamondWidth,
          diamondHeight,
        );

        p.strokeWeight((sWeight += strokeInc));
      }
      originX = origX;
      originY += diamondHeight;
    }
  }

  p.draw = () => {
    p.background(220);

    p.strokeWeight(strokeInit);

    isoGrid(-100, -100, p.width * 4.2, p.height * 4.2);
  };
}
