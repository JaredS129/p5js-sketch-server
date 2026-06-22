// Augment Q5 instances with properties that exist at runtime but are absent from
// the shipped q5.d.ts / q5play.d.ts (which only type the global-mode API).
// q5 and q5play types are loaded globally via tsconfig "types".
export {};

declare global {
  interface Q5 {
    setup?: (() => void) | (() => Promise<void>);
    remove(): Promise<void>;
    // Input state — typed as globals in q5.d.ts but also exist on instances
    mouseX: number;
    mouseY: number;
    pmouseX: number;
    pmouseY: number;
    frameCount: number;
    // q5play instance properties (registered by q5play's presetup hook)
    world: World;
    Sprite: typeof Sprite;
    Group: typeof Group;
    allSprites: Group;
  }
}
