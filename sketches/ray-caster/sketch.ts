import type p5 from "p5";

/**
 * p5.js sketch — instance mode (contracts/sketch-module.md).
 *
 * The default export receives a p5 instance `p`. Attach lifecycle hooks
 * (setup, draw, and optionally preload, windowResized, …) to `p`.
 * Do NOT use p5 global mode — multiple sketches share one app.
 */
export default function sketch(p: p5): void {
  const W: boolean = false; // WALL
  const O: boolean = true; // OPEN

  const MAP: boolean[][] = [
    [W, W, W, W, W, W],
    [W, O, W, O, O, W],
    [W, O, W, W, O, W],
    [W, O, O, O, O, W],
    [W, O, O, W, O, W],
    [W, W, W, W, W, W],
  ];

  const BLOCK_SIZE: number = 100;
  const HORIZONTAL_RESOLUTION: number = 320;

  interface PlayerProps {
    startingX: number;
    startingY: number;
  }

  class Player {
    readonly startingX: number;
    readonly startingY: number;
    posX: number;
    posY: number;

    constructor(props: PlayerProps) {
      this.startingX = props.startingX;
      this.startingY = props.startingY;
      this.posX = props.startingX;
      this.posY = props.startingY;
    }
  }

  let hasMoved: boolean = false;

  const player: Player = new Player({
    startingX: 1,
    startingY: 1,
  });

  p.setup = () => {
    p.createCanvas(1200, 1200);
  };

  p.draw = () => {
    p.background(18);

    for (let i = 0; i < MAP.length; i++) {
      for (let j = 0; j < MAP[i].length; j++) {
        if (MAP[i][j] === W) {
          p.rect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }

    p.ellipse(
      player.posX * BLOCK_SIZE + BLOCK_SIZE / 2,
      player.posY * BLOCK_SIZE + BLOCK_SIZE / 2,
      40,
      40,
    );

    const DIRECTIONS = [
      { key: p.UP_ARROW, dx: 0, dy: -1 },
      { key: p.DOWN_ARROW, dx: 0, dy: 1 },
      { key: p.LEFT_ARROW, dx: -1, dy: 0 },
      { key: p.RIGHT_ARROW, dx: 1, dy: 0 },
    ];

    for (const { key, dx, dy } of DIRECTIONS) {
      if (p.keyIsDown(key)) {
        const newX = player.posX + dx;
        const newY = player.posY + dy;
        if (!hasMoved && MAP[newY][newX] !== W) {
          player.posX = newX;
          player.posY = newY;
          hasMoved = true;
        }
        break;
      }
    }

    if (
      !p.keyIsDown(p.UP_ARROW) &&
      !p.keyIsDown(p.DOWN_ARROW) &&
      !p.keyIsDown(p.LEFT_ARROW) &&
      !p.keyIsDown(p.RIGHT_ARROW)
    ) {
      hasMoved = false;
    }
  };
}
