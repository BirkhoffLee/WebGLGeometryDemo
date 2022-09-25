// import { Color } from '../interfaces.js'

class Vertice {
  x: number;
  y: number;
  color: Color;

  constructor(x: number, y: number, color: Color) {
    this.x = x;
    this.y = y;
    this.color = structuredClone(color);
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
      this.color.rgb.flat(),
      0.0,
      1.0
    ]);
  }

  get vertexCount() {
    return 1;
  }
}
