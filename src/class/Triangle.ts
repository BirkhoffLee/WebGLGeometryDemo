import { EngineObject, EngineObjectOptions } from './EngineObject';
import { Vertice } from './Vertice';

export interface TriangleOptions extends EngineObjectOptions {
  centre: {
    x: number;
    y: number;
  };
}

export class Triangle extends EngineObject implements TriangleOptions {
  centre: {
    x: number;
    y: number;
  };
  internalLength: number;

  constructor(options: TriangleOptions) {
    super(options);

    this.centre = {
      x: options.centre.x,
      y: options.centre.y,
    };
    
    this.internalLength = 10;
    
    this._vertices.push(
      // top
      new Vertice({
        x: this.centre.x,
        y: this.centre.y - this.internalLength,
        color: this.color
      }),
      // bottom-left
      new Vertice({
        x: this.centre.x - this.internalLength / Math.cos(this.internalLength),
        y: this.centre.y + this.internalLength,
        color: this.color
      }),
      // bottom-right
      new Vertice({
        x: this.centre.x + this.internalLength / Math.cos(this.internalLength),
        y: this.centre.y + this.internalLength,
        color: this.color
      }),
    );
  }
}
