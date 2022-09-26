import { EngineObject, EngineObjectOptions } from './EngineObject';
import { Vertice } from './Vertice';

export interface SquareOptions extends EngineObjectOptions {
  x: number;
  y: number;
}

export class Square extends EngineObject implements SquareOptions {
  x: number;
  y: number;

  constructor(options: SquareOptions) {
    super(options);

    this.x = options.x;
    this.y = options.y;

    this._vertices.push(
      new Vertice({
        x: this.x,
        y: this.y,
        color: this.color,
        isSquare: true
      })
    );
  }
}
