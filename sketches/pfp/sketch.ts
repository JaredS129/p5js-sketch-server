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
  p.setup = () => {
    p.createCanvas(600, 600);
    p.angleMode(p.DEGREES);
    p.pixelDensity(2);
  };

  function drawPattern(
    xPos,
    yPos,
    circSize,
    circAmt,
    circSpacing,
    initRad,
    radInc,
    colourVal,
    phase,
  ) {
    let radius = initRad;

    for (let i = 0; i < circAmt; i++) {
      let x = xPos + radius * p.sin(circSpacing * i + phase);
      let y = yPos + radius * p.cos(circSpacing * i + phase);

      p.circle(x, y, circSize);
      radius += radInc;

      switch (colourVal) {
        case 0:
          p.fill(255, 0, 0);
          break;
        case 1:
          p.fill(0, 255, 0);
          break;
        case 2:
          p.fill(0, 0, 255);
          break;
      }

      if (colourVal >= 2) {
        colourVal = 0;
      } else {
        colourVal++;
      }
      circSize += 0.03;
    }
  }

  let iterAmt = 8;
  let phaseInc = 1;

  p.draw = () => {
    p.clear();
    p.blendMode(p.ADD);
    p.background(18);
    p.noStroke();

    for (let i = 0; i < iterAmt; i++) {
      drawPattern(p.width * 0.5, p.height * 0.5, 2, 400, 15, 1, 1, 0, phaseInc * i);
    }
    for (let i = 0; i < iterAmt; i++) {
      drawPattern(
        p.width * 0.5,
        p.height * 0.5,
        2,
        400,
        17,
        1,
        1,
        1,
        phaseInc * i + 90,
      );
    }
    p.noLoop();
  };
}
