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

  const MAP_COLS_LENGTH = MAP[0]?.length ?? 0;

  const BLOCK_SIZE: number = 50;
  const HORIZONTAL_RESOLUTION: number = 640;
  const FOV: number = 60;
  const ROTATION_SPEED: number = 0.04;
  const MOVE_SPEED: number = 1;
  const WALL_COLOR: string = "#0B0B8C";

  interface PlayerProps {
    startingMapPositionX: number;
    startingMapPositionY: number;
    startingAngle: number;
  }

  class Player {
    readonly startingMapPositionX: number;
    readonly startingMapPositionY: number;
    readonly startingAngle: number;
    currentFieldPositionX: number;
    currentFieldPositionY: number;
    angle: number;

    constructor(props: PlayerProps) {
      this.startingMapPositionX = props.startingMapPositionX;
      this.startingMapPositionY = props.startingMapPositionY;
      this.startingAngle = props.startingAngle;
      this.currentFieldPositionX = props.startingMapPositionX * BLOCK_SIZE - BLOCK_SIZE;
      this.currentFieldPositionY = props.startingMapPositionY * BLOCK_SIZE - BLOCK_SIZE;
      this.angle = ((props.startingAngle - 90) * Math.PI) / 180;
    }
  }

  const player: Player = new Player({
    startingMapPositionX: 1,
    startingMapPositionY: 1,
    startingAngle: 180,
  });

  let backgroundBuffer: p5.Graphics;
  let wallColorR: number;
  let wallColorG: number;
  let wallColorB: number;

  p.setup = () => {
    p.createCanvas(HORIZONTAL_RESOLUTION, HORIZONTAL_RESOLUTION);
    wallStripWidth = p.width / HORIZONTAL_RESOLUTION;
    const parsedWallColor = p.color(WALL_COLOR);
    wallColorR = p.red(parsedWallColor);
    wallColorG = p.green(parsedWallColor);
    wallColorB = p.blue(parsedWallColor);

    backgroundBuffer = p.createGraphics(p.width, p.height);
    backgroundBuffer.noStroke();
    backgroundBuffer.fill(70);
    backgroundBuffer.rect(0, 0, p.width, p.height / 2);
    backgroundBuffer.fill(130);
    backgroundBuffer.rect(0, p.height / 2, p.width, p.height / 2);
  };

  const isFieldPositionWithinWall = (x: number, y: number): boolean => {
    const blockX = Math.ceil(x / BLOCK_SIZE + 0.5);
    const blockY = Math.ceil(y / BLOCK_SIZE + 0.5);
    if (blockY < 0 || blockY >= MAP.length || blockX < 0 || blockX >= MAP_COLS_LENGTH) {
      return true;
    }
    return MAP[blockY]?.[blockX] === W;
  };

  const angleIncrementPerRay: number = ((FOV / HORIZONTAL_RESOLUTION) * Math.PI) / 180;
  const halfFovRad: number = ((FOV / 2) * Math.PI) / 180;

  const tryMove = (dir: number) => {
    const newX =
      player.currentFieldPositionX + Math.cos(player.angle) * MOVE_SPEED * dir;
    const newY =
      player.currentFieldPositionY + Math.sin(player.angle) * MOVE_SPEED * dir;
    if (!isFieldPositionWithinWall(newX, newY)) {
      player.currentFieldPositionX = newX;
      player.currentFieldPositionY = newY;
    }
  };

  const getRayLength = (cosAngle: number, sinAngle: number): number => {
    let rayLength: number = 0;
    while (
      !isFieldPositionWithinWall(
        player.currentFieldPositionX + cosAngle * rayLength,
        player.currentFieldPositionY + sinAngle * rayLength,
      )
    ) {
      rayLength += 1;
    }
    return rayLength;
  };

  let wallStripWidth: number;

  p.draw = () => {
    p.image(backgroundBuffer, 0, 0);

    if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(65)) {
      player.angle -= ROTATION_SPEED;
    }
    if (p.keyIsDown(p.RIGHT_ARROW) || p.keyIsDown(68)) {
      player.angle += ROTATION_SPEED;
    }

    if (p.keyIsDown(p.UP_ARROW) || p.keyIsDown(87)) tryMove(1);
    if (p.keyIsDown(p.DOWN_ARROW) || p.keyIsDown(83)) tryMove(-1);

    p.noStroke();
    for (let i = 0; i < HORIZONTAL_RESOLUTION; i++) {
      const angle: number = player.angle - halfFovRad + i * angleIncrementPerRay;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const rayLength: number = getRayLength(cosAngle, sinAngle);

      const perpendicularRayLength = rayLength * Math.cos(angle - player.angle);
      const wallStripHeight: number = (BLOCK_SIZE * p.height) / perpendicularRayLength;
      const brightness = Math.min(1, wallStripHeight / p.height);
      p.fill(wallColorR * brightness, wallColorG * brightness, wallColorB * brightness);
      p.rect(
        i * wallStripWidth,
        (p.height - wallStripHeight) / 2,
        wallStripWidth,
        wallStripHeight,
      );
    }
  };
}
