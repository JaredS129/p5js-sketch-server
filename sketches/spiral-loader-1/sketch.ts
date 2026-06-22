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
  let waveWeight = 5;

  p.setup = () => {
    p.pixelDensity(2);
    p.createCanvas(400, 400);
    p.noFill();
    p.stroke(235);
    p.strokeWeight(waveWeight);
    p.angleMode(p.DEGREES);
  };

  let sp1Amp = 20;
  let sp1Freq = 2.5;
  let sp1Phase = 0;
  let sp2Amp = 30;
  let sp2Freq = 2;
  let sp2Phase = 120;
  let sp3Amp = 40;
  let sp3Freq = 1.5;
  let sp3Phase = 240;

  let speedFactor = 1.5;

  let vertexInterval = 5;

  let glowSize = 12;
  let glowAmt = 5;

  function drawWave(amp, freq, phase) {
    let vertexAmt = p.width / vertexInterval;
    let angleRange = 360 * freq;

    p.beginShape();

    p.strokeWeight(waveWeight);

    for (let i = 0; i < vertexAmt; i++) {
      let ampMod = p.sin(p.map(i, 0, vertexAmt, 0, 180)) * amp;

      p.vertex(
        vertexInterval * i,
        p.height * 0.5 + p.sin(p.map(i, 0, vertexAmt, 0, angleRange) + phase) * ampMod,
      );
    }
    p.endShape();
  }

  function drawOpaqueWave(amp, freq, phase) {
    let vertexAmt = p.width / vertexInterval;
    let angleRange = 360 * freq;

    p.beginShape();

    p.strokeWeight(glowSize);

    for (let i = 0; i < vertexAmt; i++) {
      let ampMod = p.sin(p.map(i, 0, vertexAmt, 0, 180)) * amp;

      p.vertex(
        vertexInterval * i,
        p.height * 0.5 + p.sin(p.map(i, 0, vertexAmt, 0, angleRange) + phase) * ampMod,
      );
    }
    p.endShape();
  }

  p.draw = () => {
    p.blendMode(p.BLEND);
    p.background(20);

    p.blendMode(p.ADD);

    p.stroke(255, 0, 0, 80);
    drawOpaqueWave(sp1Amp, sp1Freq, p.frameCount * speedFactor + sp1Phase);
    p.stroke(255, 0, 0);
    drawWave(sp1Amp, sp1Freq, p.frameCount * speedFactor + sp1Phase);

    p.stroke(0, 255, 0, 80);
    drawOpaqueWave(sp2Amp, sp2Freq, p.frameCount * speedFactor + sp2Phase);
    p.stroke(0, 255, 0);
    drawWave(sp2Amp, sp2Freq, p.frameCount * speedFactor + sp2Phase);

    p.stroke(0, 0, 255, 80);
    drawOpaqueWave(sp3Amp, sp3Freq, p.frameCount * speedFactor + sp3Phase);
    p.stroke(0, 0, 255);
    drawWave(sp3Amp, sp3Freq, p.frameCount * speedFactor + sp3Phase);
  };
}
