import { EngineObject } from "./EngineObject";

export interface EngineObjectQueueOptions {
  WebGLRenderingContext: WebGLRenderingContext;
  WebGLRenderingDrawMode: number;
}

export class EngineObjectQueue implements EngineObjectQueueOptions {
  queue: EngineObject[];

  WebGLRenderingContext: WebGLRenderingContext;
  WebGLRenderingDrawMode: number;

  constructor(options: EngineObjectQueueOptions) {
    this.queue = [];
    this.WebGLRenderingContext = options.WebGLRenderingContext;
    this.WebGLRenderingDrawMode = options.WebGLRenderingDrawMode;
  }
  
  get length(): number {
    return this.queue.length;
  }
  
  get vertexCount(): number {
    return this.queue.reduce((accu, cur) => accu + cur.vertexCount, 0);
  }
  
  add(o: EngineObject) {
    if (this.queue.length == 5) {
      this.queue.shift();
    }

    this.queue.push(o);
  }
  
  get binaryData(): Float32Array {
    return new Float32Array(this.queue.map(p => [...p.binaryData]).flat());
  }
  
  draw() {
    if (this.length == 0)
      return;

    this.WebGLRenderingContext.bufferData(this.WebGLRenderingContext.ARRAY_BUFFER, this.binaryData, this.WebGLRenderingContext.STATIC_DRAW);
    this.WebGLRenderingContext.drawArrays(this.WebGLRenderingDrawMode, 0, this.vertexCount);
  }
}
