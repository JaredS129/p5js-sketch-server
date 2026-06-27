//@ts-nocheck

import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */

let gBuffR;
let gBuffL;
let gBuffU;
let gBuffD;

let canvasWidth = 800;
let canvasHeight = 800;

let buffWidth = 20;
let buffHeight = 20;

export default function sketch(p: p5): void {
  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);
    p.noStroke();
    p.angleMode(p.DEGREES);
    gBuffR = p.createGraphics(buffWidth, buffHeight);
    gBuffL = p.createGraphics(buffWidth, buffHeight);
    gBuffU = p.createGraphics(buffWidth, buffHeight);
    gBuffD = p.createGraphics(buffWidth, buffHeight);
  };

  let circleSize = buffWidth * 0.5;
  let animSpan = buffWidth * 0.3;
  let phaseOffset = 45;
  let speedFactor = 8;

  function circleAnimX(buffer, xCenter, yCenter, size, span, phase) {
    buffer.blendMode(p.ADD);

    let phaseMod = phase + p.frameCount * speedFactor;
    let xPos = xCenter + p.sin(phaseMod) * span;
    let yPos = yCenter;

    buffer.circle(xPos, yPos, size);
  }

  function circleAnimY(buffer, xCenter, yCenter, size, span, phase) {
    buffer.blendMode(p.ADD);

    let phaseMod = phase + p.frameCount * speedFactor;
    let xPos = xCenter;
    let yPos = yCenter + p.cos(phaseMod) * span;

    buffer.circle(xPos, yPos, size);
  }

  function chromaCircles(buffer, phaseInit, isVert) {
    if (isVert) {
      buffer.fill(255, 0, 0);
      circleAnimY(
        buffer,
        buffWidth * 0.5,
        buffHeight * 0.5,
        circleSize,
        animSpan,
        phaseInit + phaseOffset * 0,
      );
      buffer.fill(0, 255, 0);
      circleAnimY(
        buffer,
        buffWidth * 0.5,
        buffHeight * 0.5,
        circleSize,
        animSpan,
        phaseInit + phaseOffset * 1,
      );
      buffer.fill(0, 0, 255);
      circleAnimY(
        buffer,
        buffWidth * 0.5,
        buffHeight * 0.5,
        circleSize,
        animSpan,
        phaseInit + phaseOffset * 2,
      );
    } else {
      buffer.fill(255, 0, 0);
      circleAnimX(
        buffer,
        buffWidth * 0.5,
        buffHeight * 0.5,
        circleSize,
        animSpan,
        phaseInit + phaseOffset * 0,
      );
      buffer.fill(0, 255, 0);
      circleAnimX(
        buffer,
        buffWidth * 0.5,
        buffHeight * 0.5,
        circleSize,
        animSpan,
        phaseInit + phaseOffset * 1,
      );
      buffer.fill(0, 0, 255);
      circleAnimX(
        buffer,
        buffWidth * 0.5,
        buffHeight * 0.5,
        circleSize,
        animSpan,
        phaseInit + phaseOffset * 2,
      );
    }
  }

  function clearBuffers() {
    gBuffR.clear();
    gBuffL.clear();
    gBuffU.clear();
    gBuffD.clear();
  }

  p.draw = () => {
    clearBuffers();

    p.blendMode(p.BLEND);
    p.colorMode(p.RGB, 255, 255, 255, 1);
    p.background(20);

    chromaCircles(gBuffR, 0, false);
    chromaCircles(gBuffL, 180, true);

    for (let y = 0; y < canvasHeight / buffHeight; y++) {
      for (let x = 0; x < canvasWidth / buffWidth; x++) {
        if (x % 2 != 0) {
          p.image(gBuffR, buffWidth * x, buffHeight * y);
        } else {
          p.image(gBuffL, buffWidth * x, buffHeight * y);
        }
      }
    }
  };
}
