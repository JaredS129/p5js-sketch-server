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
  let ssBuff;

  p.setup = () => {
    p.createCanvas(200, 200);
    p.stroke(215, 20);
    p.noFill();
    p.strokeWeight(7);

    p.angleMode(p.DEGREES);
    p.pixelDensity(2);
  };

  let circleRad = 50;
  let vertexSpacing = 7;
  let maxLength = 300;

  function drawCircle(rad, vertSpacingVal, length) {
    let vertexAmt = length / vertSpacingVal;

    p.beginShape();

    for (let i = 0; i < vertexAmt; i++) {
      let x = p.sin(vertSpacingVal * i) * rad;
      let y = p.cos(vertSpacingVal * i) * rad;
      p.vertex(x, y);

      p.endShape();
    }
  }

  p.draw = () => {
    let length = p.abs(p.cos(p.frameCount * 1.8) * maxLength) + 20;
    let animSpeedFactor = p.PI;

    p.background(40);

    p.push();
    p.translate(p.width * 0.5, p.height * 0.5);
    p.rotate(p.frameCount * animSpeedFactor);
    drawCircle(circleRad, vertexSpacing, length);
    p.pop();
  };
}
