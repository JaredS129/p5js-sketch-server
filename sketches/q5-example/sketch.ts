import "q5";

export default function sketch(q: Q5): void {
  q.setup = async () => {
    await q.Canvas(600, 600);
    q.noStroke();
  };

  q.draw = () => {
    q.fill("rgba(18,18,18,0.18)");
    q.rect(0, 0, 600, 600);

    const t = q.frameCount * 0.018;

    for (let i = 0; i < 5; i++) {
      const phase = (i / 5) * Math.PI * 2;
      const hue = ((t * 40 + i * 72) % 360).toFixed(0);
      q.fill(`hsl(${hue},80%,65%)`);
      q.circle(
        300 + Math.cos(t * 1.3 + phase) * 180,
        300 + Math.sin(t * 0.9 + phase) * 180,
        40 + Math.sin(t + phase) * 15,
      );
    }

    q.fill("rgba(255,255,255,0.8)");
    q.circle(q.mouseX, q.mouseY, 20);
  };
}
