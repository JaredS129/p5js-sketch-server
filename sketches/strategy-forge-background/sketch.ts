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
  //Set initial canvas size and stroke colour/weight
  let canvasW = 1920,
    canvasH = 1080;
  const gridStrokeColour = (255, 255, 255, 25);
  const gridStrokeWeight = 0.5;

  //Set initial values for background gradient
  let noiseBuffer;
  let bgNoiseResX = 300,
    bgNoiseResY = 150;
  let noiseXoff = 100;
  let noiseYoff = 100;
  let noiseZoff = 100;
  let noiseInc = 0.001;
  let noiseZInc = 1;
  const bgClickWarpInit = 500;
  let bgClickWarpAmt = bgClickWarpInit;
  let clickWarpTarget = 1;

  //Set inital grid density, vertex resolution and grid warping while hovering mouse
  const gridDensity = 80;
  const vertexRes = 20;
  const warpAmtInit = 10;

  //Set radius of the gravity warping effect
  const gravRadius = 1000;

  //Define warping behaviour on mouse click
  let clickDurationScalar = 0.95;
  let clickWarpAmt = 100;
  let easing = 0.07;

  let warpAmt = warpAmtInit; //the current amount of warping
  let warpTarget = warpAmtInit; //the amount of warping that is being targeted (changes with mouse click)

  p.setup = () => {
    p.createCanvas(canvasW, canvasH);

    p.noiseDetail(2);
    p.pixelDensity(1);
    p.angleMode(p.DEGREES);

    noiseBuffer = p.createGraphics(bgNoiseResX, bgNoiseResY);
  };

  function drawNoiseField(w, h, zoff) {
    noiseBuffer.loadPixels();

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let index = (x + y * w) * 4;

        let n = p.noise(
          noiseXoff + x * noiseInc,
          noiseYoff + y * noiseInc,
          zoff * noiseInc,
        );

        noiseBuffer.pixels[index] = n * 38;
        noiseBuffer.pixels[index + 1] = n * 39;
        noiseBuffer.pixels[index + 2] = n * 69;
        noiseBuffer.pixels[index + 3] = 255;
      }
    }

    noiseBuffer.updatePixels();

    p.image(noiseBuffer, 0, 0, p.width, p.height);
  }

  function drawVerticalLine(x, y1, y2, vertexDistance, gravFactor) {
    //y1 = first vertex at starting point, y2 = last vertex at end point
    let y = y1;

    p.beginShape();

    while (y <= y2) {
      //calculate distance of x&y to mouse position
      let dx = p.mouseX - x;
      let dy = p.mouseY - y;

      let d = p.max(p.dist(x, y, p.mouseX, p.mouseY), 1);

      // Unit direction vector
      let nx = dx / d;
      let ny = dy / d;

      // Smoothly interpolate warpAmt toward warpTarget each frame (exponential easing)
      let displacement = gravFactor * p.exp(-d / gravRadius);
      displacement = p.min(displacement, d * 0.95);

      p.vertex(x + nx * displacement, y + ny * displacement);

      y += vertexDistance;
    }
    p.endShape();
  }

  function drawHorizontalLine(x1, x2, y, vertexDistance, gravFactor) {
    //x1 = first vertex at starting point, x2 = last vertex at end point
    let x = x1;

    p.beginShape();

    while (x <= x2) {
      //calculate distance of x&y to mouse position
      let dx = p.mouseX - x;
      let dy = p.mouseY - y;

      let d = p.max(p.dist(x, y, p.mouseX, p.mouseY), 1);

      // Unit direction vector
      let nx = dx / d;
      let ny = dy / d;

      // Smoothly interpolate warpAmt toward warpTarget each frame (exponential easing)
      let displacement = gravFactor * p.exp(-d / gravRadius);
      displacement = p.min(displacement, d * 0.95);

      p.vertex(x + nx * displacement, y + ny * displacement);

      x += vertexDistance;
    }
    p.endShape();
  }

  function drawVertexGrid(originX, originY, size, spacing, res, gravFactor) {
    //draw horizontal lines
    let x = originX;
    let y = originY + spacing;

    for (let i = 0; i < size; i += spacing) {
      drawHorizontalLine(x, size, y, res, gravFactor);
      y += spacing;
    }
    //draw vertical lines
    x = originX + spacing;
    y = originY;

    for (let i = 0; i < size; i += spacing) {
      drawVerticalLine(x, y, size, res, gravFactor);
      x += spacing;
    }
  }

  p.draw = () => {
    p.colorMode(p.RGB);

    drawNoiseField(
      bgNoiseResX,
      bgNoiseResY,
      (p.mouseX + p.mouseY) * noiseZInc + clickWarpTarget,
    );

    bgClickWarpAmt += (clickWarpTarget - bgClickWarpAmt) * 0.01;

    clickWarpTarget = p.max(noiseZoff, (clickWarpTarget *= 0.95));

    p.stroke(gridStrokeColour);
    p.strokeWeight(gridStrokeWeight);
    p.noFill();

    drawVertexGrid(-200, -200, p.width * 1.4, gridDensity, vertexRes, warpAmt);

    //since 'easing' is a fraction, the draw loop will increment the warp amount each frame when 'warpTarget' is increased on click
    warpAmt += (warpTarget - warpAmt) * easing;

    // Exponentially decay warpTarget, clamped to never go below warpAmtInit
    warpTarget = p.max(warpAmtInit, (warpTarget *= 1 - easing));
  };

  p.mousePressed = () => {
    bgClickWarpAmt = bgClickWarpInit;
    clickWarpTarget = p.min(
      clickWarpTarget + bgClickWarpAmt,
      noiseZoff + bgClickWarpAmt,
    );

    //ensure warpTarget always starts at the init value and doesn't snowball with click spamming
    warpTarget = warpAmtInit;
    //increment warpTarget
    warpTarget += clickWarpAmt;
  };
}
