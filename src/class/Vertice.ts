import { Color } from '../color';

export interface VerticeOptions {
  x: number;
  y: number;
  color: Color;
  isCircle?: boolean;
  isPoint?: boolean;
  isSquare?: boolean;
}

export class Vertice implements VerticeOptions {
  x: number;
  y: number;
  color: Color;
  isCircle: boolean;
  isPoint: boolean;
  isSquare: boolean;

  constructor(options: VerticeOptions) {
    this.x = options.x;
    this.y = options.y;
    this.color = structuredClone(options.color);
    this.isCircle = options.isCircle || false;
    this.isPoint = options.isPoint || false;
    this.isSquare = options.isSquare || false;
  }

  get binaryDataType() {
    return WebGL2RenderingContext.FLOAT;
  }

  get binaryDataTypeSize() {
    return Float32Array.BYTES_PER_ELEMENT;
  }

  get binaryData() {
    return new Float32Array([
      this.x,
      this.y,
      ...this.color.rgb,
      this.isPoint ? 1.0 : 0.0,
      this.isCircle ? 1.0 : 0.0,
      this.isSquare ? 1.0 : 0.0,
    ]);
  }
}
