// Augment p5 instances with p5play properties (world, Sprite, etc.) that exist
// at runtime but are absent from @types/p5. Uses the same import+module pattern
// as @types/p5's own sub-type files (CJS import + declare module "p5").
// Sprite.color is typed as Color in p5play.d.ts but accepts strings at runtime;
// we override it on the constructor return type to avoid casts in sketch code.
import p5 = require("p5");

type P5Sprite = Omit<Sprite, "color"> & { color: string | Color };

declare module "p5" {
  interface p5InstanceExtensions {
    world: World;
    Sprite: new (...args: ConstructorParameters<typeof Sprite>) => P5Sprite;
    Group: typeof Group;
    allSprites: Group;
  }
}
