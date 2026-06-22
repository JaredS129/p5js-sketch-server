// q5 must be imported first: sets window.Q5 so q5play can register with it
import "q5";
// q5play registers lifecycle hooks on Q5's addon system
import "q5play";

export default function sketch(q: Q5): void {
  q.setup = async () => {
    await q.Canvas(600, 600);

    // Default gravity is (0,0) — set downward gravity explicitly
    q.world.gravity.y = 10;

    const wall = q.color("#444444");

    // Static floor — 560px wide, 20px tall, centered at (300, 590)
    const floor = new q.Sprite(300, 590, 560, 20, "static");
    floor.color = wall;
    floor.strokeWeight = 0;

    // Left wall — 30px wide, 570px tall, centered at (15, 300)
    const leftWall = new q.Sprite(15, 300, 30, 570, "static");
    leftWall.color = wall;
    leftWall.strokeWeight = 0;

    // Right wall — 30px wide, 570px tall, centered at (585, 300)
    const rightWall = new q.Sprite(585, 300, 30, 570, "static");
    rightWall.color = wall;
    rightWall.strokeWeight = 0;

    const colorHexes = [
      "#e74c3c",
      "#e67e22",
      "#f1c40f",
      "#2ecc71",
      "#3498db",
      "#9b59b6",
      "#1abc9c",
      "#e91e63",
    ];
    for (let i = 0; i < colorHexes.length; i++) {
      // Balls spread across upper portion — 40px diameter circles
      const ball = new q.Sprite(80 + i * 65, 60 + (i % 3) * 60, 40);
      ball.bounciness = 0.7;
      ball.friction = 0.3;
      ball.color = q.color(colorHexes[i] ?? "#ffffff");
      ball.strokeWeight = 0;
    }
  };

  q.draw = () => {
    q.background("#121212");
  };
}
