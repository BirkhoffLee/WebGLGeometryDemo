import { EngineObject, EngineObjectOptions } from './EngineObject';
import { Vertice } from './Vertice';

export interface CircleOptions extends EngineObjectOptions {
  x: number;
  y: number;
}

export class Circle extends EngineObject implements CircleOptions {
  x: number;
  y: number;

  constructor(options: CircleOptions) {
    super(options);

    this.x = options.x;
    this.y = options.y;
    
    this._vertices.push(new Vertice({
      x: this.x,
      y: this.y,
      color: this.color,
      isCircle: true
    }));
  }
}
