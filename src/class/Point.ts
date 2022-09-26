import { EngineObject, EngineObjectOptions } from './EngineObject';
import { Vertice } from './Vertice';

export interface PointOptions extends EngineObjectOptions {
  x: number;
  y: number;
}

export class Point extends EngineObject implements PointOptions {
  x: number;
  y: number;

  constructor(options: PointOptions) {
    super(options);

    this.x = options.x;
    this.y = options.y;
    
    this._vertices.push(
      new Vertice({
        x: this.x,
        y: this.y,
        color: this.color,
        isPoint: true
      })
    );
  }
}
