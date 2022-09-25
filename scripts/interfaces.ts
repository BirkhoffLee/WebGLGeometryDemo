interface HTMLCanvasElement {
  // mozCancelFullScreen: () => void;
  // webkitExitFullscreen: () => void;
  // fullscreenElement: () => void;
  // mozFullScreenElement: () => void;
  // webkitFullscreenElement: () => void;
  webkitRequestFullscreen: () => Promise<any>;
}

type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift' | number
type ArrayItems<T extends Array<any>> = T extends Array<infer TItems> ? TItems : never
type FixedLengthArray<T extends any[]> =
  Pick<T, Exclude<keyof T, ArrayLengthMutationKeys>>
  & { [Symbol.iterator]: () => IterableIterator< ArrayItems<T> > }

type Color = {
  // displayName: string,
  rgb: Array<number>,
  code: 'r' | 'g' | 'b'
}

// interface EngineRuntime {
//   // The color used for new shapes drawn.
//   color: Color,
//   // The shape chosen for new draws.
//   shape: {
//     code: 'p' | 'h' | 'v' | 't' | 'q' | 'c'
//   }
//   attribLocations?: {
//     a_Position: number;
//     a_Color: number;
//     a_isCircle: number;
//     a_isPoint: number;
//   }
//   uniformLocations?: {
//     u_resolution: WebGLUniformLocation;
//   }
// }

interface Point {
  x: number;
  y: number;
  color: Color;
}

type Circle = Point;
type Line = FixedLengthArray<[Point, Point]>;
type Triangle = FixedLengthArray<[Point, Point, Point]>;
type Square = FixedLengthArray<[Triangle, Triangle]>;

// type Circle = Array<[Point, Point]>; // TRIANGLE_STRIP
// interface Circle {
//   center: Point;
//   // radius: number;
// }
