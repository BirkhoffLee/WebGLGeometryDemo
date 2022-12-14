import { Vertice } from './Vertice';
import { Color } from '../color';

export interface EngineObjectOptions {
  color: Color;
}

export class EngineObject implements EngineObjectOptions {
  color: Color;
  _vertices: Vertice[];

  constructor(options: EngineObjectOptions) {
    this.color = options.color;
    this._vertices = [];
  }

  get vertices() {
    return this._vertices;
  }

  get vertexCount() {
    return this._vertices.length;
  }
  
  get binaryData(): Float32Array {
    return new Float32Array(this.vertices.map(v => [...v.binaryData]).flat());
  }
}
