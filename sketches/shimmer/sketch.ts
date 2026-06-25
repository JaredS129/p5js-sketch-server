import "q5";

const W = 600;
const H = 600;
const CELL = 60;
const GAP = 0;
const ANIM_MS = 3200;
const STAGGER = 0.1; // fraction of total duration between each gradient points anomation start

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const s =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

export default function sketch(q: Q5): void {
  // Offscreen gradient — drives rotation direction and blend factor
  const COLOR_1 = "#FF0000";
  const COLOR_2 = "#0D00FF";
  const COLOR_3 = "#333";

  // Cell display colors — what the cells actually render as
  const CELL_COLOR_1 = "#454545";
  const CELL_COLOR_2 = "#1F1F1F";

  const c1 = parseHex(COLOR_1);
  const c2 = parseHex(COLOR_2);
  const c3 = parseHex(COLOR_3);
  const cc1 = parseHex(CELL_COLOR_1);
  const cc2 = parseHex(CELL_COLOR_2);

  const STOPS: Array<{ pos: number; color: [number, number, number] }> = [
    { pos: 0, color: c1 },
    { pos: 0.15, color: c3 },
    { pos: 0.25, color: c2 },
    { pos: 0.35, color: c3 },
    { pos: 0.5, color: c1 },
    { pos: 0.6, color: c3 },
    { pos: 0.8, color: c2 },
    { pos: 0.95, color: c3 },
  ];

  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const offCtx = offscreen.getContext("2d")!;

  let animStart: number | null = null;

  q.setup = async () => {
    await q.Canvas(W, H);
    animStart = performance.now();
  };

  q.mousePressed = () => {
    animStart = performance.now();
  };

  q.draw = () => {
    const globalT =
      animStart !== null ? Math.min((performance.now() - animStart) / ANIM_MS, 1) : 0;

    const radius = 1500 * easeOutExpo(animStart !== null ? globalT : 1);

    offCtx.clearRect(0, 0, W, H);
    const grad = offCtx.createRadialGradient(
      q.mouseX,
      q.mouseY,
      0,
      q.mouseX,
      q.mouseY,
      radius,
    );

    STOPS.forEach((stop, i) => {
      // Each stop starts after `delay` fraction of total time; all stops finish at t=1
      const delay = i * STAGGER;
      const stopT = easeOutExpo(
        Math.max(0, Math.min(1, (globalT - delay) / (1 - delay))),
      );
      grad.addColorStop(stop.pos, lerpRgb(stop.color, c3, stopT));
    });

    // Fill the whole offscreen canvas with the gradient (no arc clip) so
    // color sampling is clean. Circle boundary is checked with exact math below.
    if (radius > 1) {
      offCtx.fillStyle = grad;
      offCtx.fillRect(0, 0, W, H);
    }

    const { data } = offCtx.getImageData(0, 0, W, H);

    q.background(CELL_COLOR_2);

    const halfCell = CELL / 2;
    for (let row = 0; row * (CELL + GAP) < H; row++) {
      for (let col = 0; col * (CELL + GAP) < W; col++) {
        const cellX = col * (CELL + GAP);
        const cellY = row * (CELL + GAP);
        const cx = Math.floor(cellX + halfCell);
        const cy = Math.floor(cellY + halfCell);

        const dx = cx - q.mouseX;
        const dy = cy - q.mouseY;
        const inCircle = Math.hypot(dx, dy) < radius;

        q.ctx.save();
        q.ctx.translate(cellX + halfCell, cellY + halfCell);

        if (inCircle) {
          const idx = (Math.min(cy, H - 1) * W + Math.min(cx, W - 1)) * 4;
          const r = (data[idx] ?? 0) / 255;
          const g = (data[idx + 1] ?? 0) / 255;
          const b = (data[idx + 2] ?? 0) / 255;
          // bias: negative = COLOR_1 influence, positive = COLOR_2 influence
          const bias = g - (r + b) / 2;
          const angle = bias * 0.5;
          const blend = Math.max(0, Math.min(1, bias + 0.5));
          q.ctx.rotate(angle);
          q.ctx.fillStyle = lerpRgb(cc1, cc2, blend);
        } else {
          q.ctx.fillStyle = COLOR_3;
        }

        q.ctx.fillRect(-halfCell, -halfCell, CELL, CELL);
        q.ctx.restore();
      }
    }
  };
}
