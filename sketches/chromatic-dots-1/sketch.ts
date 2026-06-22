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
    p.createCanvas(200, 200);
    p.angleMode(p.DEGREES);
  };

  let xPosR = 0;
  let xPosG = 30;
  let xPosB = 60;
  let sizeBase = 1;
  let sizeMax = 100;
  let sizeFactorR = 0;
  let sizeFactorG = 0;
  let sizeFactorB = 0;
  let speed = 1;

  p.draw = () => {
    p.blendMode(p.BLEND);
    p.background(20);

    let sizeInitR = 0;
    let sizeInitG = 0;
    let sizeInitB = 0;

    sizeFactorR = p.sin(p.map(xPosR, 0, p.width, -70, 250));
    sizeInitR = sizeBase * p.map(sizeFactorR, -1, 1, 0, sizeMax);

    sizeFactorG = p.sin(p.map(xPosG, 0, p.width, -70, 250));
    sizeInitG = sizeBase * p.map(sizeFactorG, -1, 1, 0, sizeMax);

    sizeFactorB = p.sin(p.map(xPosB, 0, p.width, -70, 250));
    sizeInitB = sizeBase * p.map(sizeFactorB, -1, 1, 0, sizeMax);

    p.blendMode(p.ADD);

    p.fill(255, 0, 0);
    p.circle(xPosR, p.height * 0.5, sizeInitR);
    p.fill(0, 255, 0);
    p.circle(xPosG, p.height * 0.5, sizeInitG);
    p.fill(0, 0, 255);
    p.circle(xPosB, p.height * 0.5, sizeInitB);

    if (xPosR >= p.width) {
      xPosR = 0;
    } else {
      xPosR += speed;
    }
    if (xPosG >= p.width) {
      xPosG = 0;
    } else {
      xPosG += speed;
    }
    if (xPosB >= p.width) {
      xPosB = 0;
    } else {
      xPosB += speed;
    }
  };
}
