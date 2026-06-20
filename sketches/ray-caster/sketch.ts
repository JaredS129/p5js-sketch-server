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
  const ROTATION_SPEED: number = 0.04;
  const MOVE_SPEED: number = 1;

  interface PlayerProps {
    startingX: number;
    startingY: number;
  }

  class Player {
    readonly startingX: number;
    readonly startingY: number;
    posX: number;
    posY: number;
    angle: number;

    constructor(props: PlayerProps) {
      this.startingX = props.startingX;
      this.startingY = props.startingY;
      this.posX = props.startingX;
      this.posY = props.startingY;
      this.angle = -Math.PI * 1.5;
    }
  }

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

    const PLAYER_ABS_POS_X = player.posX + BLOCK_SIZE * 2 - BLOCK_SIZE / 2;
    const PLAYER_ABS_POS_Y = player.posY + BLOCK_SIZE * 2 - BLOCK_SIZE / 2;

    p.push();
    p.translate(PLAYER_ABS_POS_X, PLAYER_ABS_POS_Y);
    p.rotate(player.angle);
    p.triangle(8, 0, -4, -5, -4, 5);
    p.pop();

    const checkIfWithinWallBlock = (x: number, y: number): boolean => {
      const blockX = Math.ceil(x / BLOCK_SIZE + 0.5);
      const blockY = Math.ceil(y / BLOCK_SIZE + 0.5);
      return MAP[blockY][blockX] === W;
    };

    if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(65)) {
      player.angle -= ROTATION_SPEED;
    }
    if (p.keyIsDown(p.RIGHT_ARROW) || p.keyIsDown(68)) {
      player.angle += ROTATION_SPEED;
    }

    const tryMove = (dir: number) => {
      const newX = player.posX + Math.cos(player.angle) * MOVE_SPEED * dir;
      const newY = player.posY + Math.sin(player.angle) * MOVE_SPEED * dir;
      if (!checkIfWithinWallBlock(newX, newY)) {
        player.posX = newX;
        player.posY = newY;
      }
    };

    if (p.keyIsDown(p.UP_ARROW) || p.keyIsDown(87)) tryMove(1);
    if (p.keyIsDown(p.DOWN_ARROW) || p.keyIsDown(83)) tryMove(-1);
  };
}
