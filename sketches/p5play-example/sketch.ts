// globals.ts must be imported first: sets window.p5 and window.planck before p5play loads
import "./globals";
import "p5play";
import type p5 from "p5";

export default function sketch(p: p5): void {
  p.setup = () => {
    p.createCanvas(600, 400);

    // p5play defaults gravity to (0, 0) — must be set explicitly
    p.world.gravity.y = 10;

    const wall = "#444444";

    const floor = new p.Sprite(300, 385, 560, 20, "static");
    floor.color = wall;
    floor.strokeWeight = 0;

    const leftWall = new p.Sprite(10, 200, 20, 380, "static");
    leftWall.color = wall;
    leftWall.strokeWeight = 0;

    const rightWall = new p.Sprite(590, 200, 20, 380, "static");
    rightWall.color = wall;
    rightWall.strokeWeight = 0;

    const colors = [
      "#e74c3c",
      "#e67e22",
      "#f1c40f",
      "#2ecc71",
      "#3498db",
      "#9b59b6",
      "#1abc9c",
      "#e91e63",
    ];
    for (let i = 0; i < colors.length; i++) {
      const ball = new p.Sprite(80 + i * 65, p.random(20, 150), p.random(25, 45));
      ball.bounciness = 0.75;
      ball.friction = 0.5;
      ball.color = colors[i] ?? "#ffffff";
      ball.strokeWeight = 0;
    }
  };

  p.draw = () => {
    p.background(18);
  };
}
