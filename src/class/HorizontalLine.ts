import { EngineObject, EngineObjectOptions } from './EngineObject';
import { Vertice } from './Vertice';

export interface HorizontalLineOptions extends EngineObjectOptions {
  y: number;
}

export class HorizontalLine extends EngineObject implements HorizontalLineOptions {
  y: number;

  constructor(options: HorizontalLineOptions) {
    super(options);

    this.y = options.y;
    
    this._vertices.push(
      new Vertice({
        x: 0,
        y: this.y,
        color: this.color,
        isCircle: false,
        isPoint: false
      }),
      new Vertice({
        x: Infinity,
        y: this.y,
        color: this.color,
        isCircle: false,
        isPoint: false
      })
    );
  }
}
