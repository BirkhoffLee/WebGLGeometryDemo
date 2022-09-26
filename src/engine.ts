import { FSHADER_SOURCE, VSHADER_SOURCE } from './shaderSources';

import { Color } from './color';

import { Circle } from './class/Circle';
import { HorizontalLine } from './class/HorizontalLine';
import { Point } from './class/Point';
import { Square } from './class/Square';
import { Triangle } from './class/Triangle';
import { VerticalLine } from './class/VerticalLine';

import { EngineObjectQueue } from './class/EngineObjectQueue';

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: WebGL2RenderingContext;
  renderProgram: WebGLProgram;

  // The color used for new shapes drawn.
  color: Color;

  // The shape chosen for new draws.
  shape: {
    code: 'p' | 'h' | 'v' | 't' | 'q' | 'c'
  };

  // This stores internal locations of GLSL attribute variables.
  attribLocations?: {
    a_Position: number;
    a_Color: number;
    a_isCircle: number;
    a_isPoint: number;
    a_isSquare: number;
  }

  // This stores internal locations of GLSL uniform variables.
  uniformLocations?: {
    u_resolution: WebGLUniformLocation;
  };

  binaryFormat: { attribLocation: number; dataType: number; count: number; dataTypeSize: number; }[];

  EnginePointsQueue: EngineObjectQueue;
  EngineHorizontalLinesQueue: EngineObjectQueue;
  EngineVerticalLinesQueue: EngineObjectQueue;
  EngineTrianglesQueue: EngineObjectQueue;
  EngineSquaresQueue: EngineObjectQueue;
  EngineCirclesQueue: EngineObjectQueue;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('webgl2');
    this.ctx.getExtension('OES_standard_derivatives');

    if (!this.ctx) {
      throw new Error('Failed to get the rendering context for WebGL');
    }
    
    this.EnginePointsQueue = new EngineObjectQueue({
      WebGLRenderingContext: this.ctx,
      WebGLRenderingDrawMode: this.ctx.POINTS
    });
    
    this.EngineHorizontalLinesQueue = new EngineObjectQueue({
      WebGLRenderingContext: this.ctx,
      WebGLRenderingDrawMode: this.ctx.LINES
    });
    
    this.EngineVerticalLinesQueue = new EngineObjectQueue({
      WebGLRenderingContext: this.ctx,
      WebGLRenderingDrawMode: this.ctx.LINES
    });
    
    this.EngineTrianglesQueue = new EngineObjectQueue({
      WebGLRenderingContext: this.ctx,
      WebGLRenderingDrawMode: this.ctx.TRIANGLES
    });
    
    this.EngineSquaresQueue = new EngineObjectQueue({
      WebGLRenderingContext: this.ctx,
      WebGLRenderingDrawMode: this.ctx.POINTS
    });
    
    this.EngineCirclesQueue = new EngineObjectQueue({
      WebGLRenderingContext: this.ctx,
      WebGLRenderingDrawMode: this.ctx.POINTS
    });

    this.renderProgram = this.createAndLinkProgramWithShaders(
      this.compileShaderFromSource(this.ctx.VERTEX_SHADER, VSHADER_SOURCE.trim()),
      this.compileShaderFromSource(this.ctx.FRAGMENT_SHADER, FSHADER_SOURCE.trim()),
    );

    this.ctx.useProgram(this.renderProgram);

    // Remove canvas background colour
    this.ctx.blendFunc(this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA);
    this.ctx.enable(this.ctx.BLEND);

    this.color = {
      rgb: [1.0, 0.0, 0.0],
      code: 'r'
    };

    this.shape = {
      code: 'p'
    };

    this.attribLocations = {
      a_Position: this.ctx.getAttribLocation(this.renderProgram, 'a_Position'),
      a_Color: this.ctx.getAttribLocation(this.renderProgram, 'a_Color'),
      a_isCircle: this.ctx.getAttribLocation(this.renderProgram, 'a_isCircle'),
      a_isPoint: this.ctx.getAttribLocation(this.renderProgram, 'a_isPoint'),
      a_isSquare: this.ctx.getAttribLocation(this.renderProgram, 'a_isSquare'),
    };

    this.uniformLocations = {
      u_resolution: this.ctx.getUniformLocation(this.renderProgram, 'u_resolution'),
    };

    // Initialise VBO
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer());

    // Enable Attributes
    this.binaryFormat = [
      {
        attribLocation: this.attribLocations.a_Position,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 2 // x, y
      },
      {
        attribLocation: this.attribLocations.a_Color,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 3 // r, g, b
      },
      {
        attribLocation: this.attribLocations.a_isPoint,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 1
      },
      {
        attribLocation: this.attribLocations.a_isCircle,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 1
      },
      {
        attribLocation: this.attribLocations.a_isSquare,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 1
      },
    ];

    this.enableAttributes();

    this.redrawFrame();
  }

  enableAttributes() {
    let offset = 0;
    let stride: number = this.binaryFormat.reduce((a, cur) => a + cur.count, 0);

    for (const attrib of this.binaryFormat) {
      this.ctx.enableVertexAttribArray(attrib.attribLocation);
      this.ctx.vertexAttribPointer(attrib.attribLocation, attrib.count, attrib.dataType, false, attrib.dataTypeSize * stride, attrib.dataTypeSize * offset);

      offset += attrib.count;
    }
  }

  redrawFrame() {
    this.resizeCanvasToDisplaySize();
    this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.uniform2f(this.uniformLocations.u_resolution, this.canvas.width, this.canvas.height);
    this.clearCanvas();

    this.EnginePointsQueue.draw();
    this.EngineCirclesQueue.draw();
    this.EngineHorizontalLinesQueue.draw();
    this.EngineVerticalLinesQueue.draw();
    this.EngineTrianglesQueue.draw();
    this.EngineSquaresQueue.draw();
  }

  addPoint(x: number, y: number) {
    this.EnginePointsQueue.add(new Point({
      x,
      y,
      color: structuredClone(this.color)
    }));
  }

  addSquare(x: number, y: number) {
    this.EngineSquaresQueue.add(new Square({
      x,
      y,
      color: structuredClone(this.color)
    }));
  }

  addHorizontalLine(y: number) {
    this.EngineHorizontalLinesQueue.add(new HorizontalLine({
      y,
      color: structuredClone(this.color)
    }));
  }

  addCircle(x: number, y: number) {
    this.EngineCirclesQueue.add(new Circle({
      x,
      y,
      color: structuredClone(this.color)
    }));
  }

  addTriangle(x: number, y: number) {
    this.EngineTrianglesQueue.add(new Triangle({
      centre: {
        x,
        y,
      },
      color: structuredClone(this.color)
    }));
  }

  addVerticalLine(x: number) {
    this.EngineVerticalLinesQueue.add(new VerticalLine({
      x,
      color: structuredClone(this.color)
    }));
  }

  // Mouse events initiate shape drawings and fires redraw
  mousedownEvent(event: MouseEvent) {
    event.preventDefault();

    const { clientX, clientY } = event;

    if (!event.target)
      throw new Error("MouseEvent event.target is null");

    // console.log("Mouseclick", clientX, clientY)

    switch (this.shape.code) {
      case 'p':
        this.addPoint(clientX, clientY);
        break;

      case 'h':
        this.addHorizontalLine(clientY);
        break;

      case 'v':
        this.addVerticalLine(clientX);
        break;

      case 'c':
        this.addCircle(clientX, clientY);
        break;

      case 't':
        this.addTriangle(clientX, clientY);
        break;

      case 'q':
        this.addSquare(clientX, clientY);
        break;

      default:
        break;
    }

    // This clears & render the frame again
    this.redrawFrame();
  }

  // Key presses mutates engine runtime configuration
  keydownEvent(event: KeyboardEvent) {
    // console.log("Keydown", event.key);

    switch (event.key) {
      // Change color to red
      case 'r':
        this.color.code = 'r';
        this.color.rgb = [1.0, 0.0, 0.0];
        break;

      // Change color to green
      case 'g':
        this.color.code = 'g';
        this.color.rgb = [0.0, 1.0, 0.0];
        break;

      // Change color to blue
      case 'b':
        this.color.code = 'b';
        this.color.rgb = [0.0, 0.0, 1.0];
        break;

      // change draw shape to point
      case 'p':
        this.shape.code = 'p';
        document.getElementById("mode").innerText = "point";
        break;

      // change draw shape to horizontal line
      case 'h':
        this.shape.code = 'h';
        document.getElementById("mode").innerText = "horizontal line";
        break;

      // change draw shape to vertical line
      case 'v':
        this.shape.code = 'v';
        document.getElementById("mode").innerText = "vertical line";
        break;

      // change draw shape to triangle
      case 't':
        this.shape.code = 't';
        document.getElementById("mode").innerText = "triangle";
        break;

      // change draw shape to square
      case 'q':
        this.shape.code = 'q';
        document.getElementById("mode").innerText = "square";
        break;

      // change draw shape to circle
      case 'c':
        this.shape.code = 'c';
        document.getElementById("mode").innerText = "circle";
        break;

      default:
        break;
    }
  }

  clearCanvas() {
    this.ctx.clearColor(0.0, 0.0, 0.0, 0.0);
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
  }

  createAndLinkProgramWithShaders(...shaders: Array<WebGLShader>): WebGLProgram {
    const program = this.ctx.createProgram();

    for (const shader of shaders) {
      this.ctx.attachShader(program, shader);
    }

    this.ctx.linkProgram(program);

    if (!this.ctx.getProgramParameter(program, this.ctx.LINK_STATUS)) {
      this.ctx.deleteProgram(program);
      throw new Error(this.ctx.getProgramInfoLog(program))
    }

    return program;
  }

  compileShaderFromSource(type: number, code: string): WebGLShader {
    const shader = this.ctx.createShader(type);

    this.ctx.shaderSource(shader, code);
    this.ctx.compileShader(shader);

    if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
      this.ctx.deleteShader(shader);
      throw new Error(this.ctx.getShaderInfoLog(shader));
    }

    return shader;
  }

  // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  resizeCanvasToDisplaySize() {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = this.canvas.width  !== displayWidth ||
                       this.canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      this.canvas.width  = displayWidth;
      this.canvas.height = displayHeight;
    }

    return needResize;
  }
}
