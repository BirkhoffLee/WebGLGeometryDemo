import { EngineObject, EngineObjectOptions } from './EngineObject';
import { Vertice } from './Vertice';

export interface VerticalLineOptions extends EngineObjectOptions {
  x: number;
}

export class VerticalLine extends EngineObject implements VerticalLineOptions {
  x: number;

  constructor(options: VerticalLineOptions) {
    super(options);

    this.x = options.x;
    
    this._vertices.push(
      new Vertice({
        x: this.x,
        y: 0,
        color: this.color,
        isCircle: false,
        isPoint: false
      }),
      new Vertice({
        x: this.x,
        y: Infinity,
        color: this.color,
        isCircle: false,
        isPoint: false
      })
    );
  }
}
