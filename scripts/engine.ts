import { FSHADER_SOURCE, VSHADER_SOURCE } from './shaderSources.js';

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
  
  binaryFormat: { attribLocation: number; dataType: number; count: number; dataTypeSize: number; }[];

  // This stores internal locations of GLSL attribute variables.
  attribLocations?: {
    a_Position: number;
    a_Color: number;
    a_isCircle: number;
    a_isPoint: number;
  }

  // This stores internal locations of GLSL uniform variables.
  uniformLocations?: {
    u_resolution: WebGLUniformLocation;
  };

  EnginePoints: Array<Point>;
  EngineHorizontalLines: Array<Line>;
  EngineVerticalLines: Array<Line>;
  EngineTriangles: Array<Triangle>;
  EngineSquares: Array<Square>;
  EngineCircles: Array<Circle>;

  EngineTemporaryTriangleVertices: Array<Point>;
  EngineTemporarySquareVertices: Array<Point>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('webgl2');
    this.ctx.getExtension('OES_standard_derivatives');

    if (!this.ctx) {
      throw new Error('Failed to get the rendering context for WebGL');
    }

    this.EnginePoints = [];
    this.EngineHorizontalLines = [];
    this.EngineVerticalLines = [];
    this.EngineTriangles = [];
    this.EngineSquares = [];
    this.EngineCircles = [];

    this.EngineTemporaryTriangleVertices = [];
    this.EngineTemporarySquareVertices = [];

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
        attribLocation: this.attribLocations.a_isCircle,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 1
      },
      {
        attribLocation: this.attribLocations.a_isPoint,
        dataType: this.ctx.FLOAT,
        dataTypeSize: Float32Array.BYTES_PER_ELEMENT,
        count: 1
      }
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

  // toggleFullscreen() {
  //   if (!document.fullscreenElement) {
  //     if (this.canvas.requestFullscreen)
  //       this.canvas.requestFullscreen().catch((err) => {
  //         alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
  //       });

  //     if (this.canvas.webkitRequestFullscreen)
  //       this.canvas.webkitRequestFullscreen().catch((err) => {
  //         alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
  //       });
  //   } else {
  //     document.exitFullscreen();
  //   }
  // }

  getPointsBinaryData() {
    return new Float32Array(
      this.EnginePoints
        .map(p => [p.x, p.y, p.color.rgb, 0.0, 1.0])
        .flat(3)
    );
  }

  getCirclesBinaryData() {
    return new Float32Array(
      this.EngineCircles
        .map(p => [p.x, p.y, p.color.rgb, 1.0, 0.0])
        .flat(3)
    );
  }

  getHorizontalLinesBinaryData() {
    return new Float32Array(
      this.EngineHorizontalLines
        .map(l => l.map(p => [p.x, p.y, p.color.rgb, 0.0, 0.0]))
        .flat(4)
    );
  }

  getVerticalLinesBinaryData() {
    return new Float32Array(
      this.EngineVerticalLines
        .map(l => l.map(p => [p.x, p.y, p.color.rgb, 0.0, 0.0]))
        .flat(4)
    );
  }

  getTrianglesBinaryData() {
    return new Float32Array(
      this.EngineTriangles
        .map(t => t.map(v => [v.x, v.y, v.color.rgb, 0.0, 0.0]))
        .flat(4)
    );
  }

  getSquaresBinaryData() {
    return new Float32Array(
      this.EngineSquares
        .map(s => s.map(t => t.map(p => [p.x, p.y, p.color.rgb, 0.0, 0.0])))
        .flat(5)
    );
  }

  redrawFrame() {
    this.resizeCanvasToDisplaySize();
    this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.uniform2f(this.uniformLocations.u_resolution, this.canvas.width, this.canvas.height);
    this.clearCanvas();

    if (this.EnginePoints.length > 0) {
      const binaryData = this.getPointsBinaryData();

      this.ctx.bufferData(this.ctx.ARRAY_BUFFER, binaryData, this.ctx.STATIC_DRAW);
      this.ctx.drawArrays(this.ctx.POINTS, 0, this.EnginePoints.length);
    }

    if (this.EngineCircles.length > 0) {
      const binaryData = this.getCirclesBinaryData();

      this.ctx.bufferData(this.ctx.ARRAY_BUFFER, binaryData, this.ctx.STATIC_DRAW);
      this.ctx.drawArrays(this.ctx.POINTS, 0, binaryData.length / 6);
    }

    if (this.EngineHorizontalLines.length > 0) {
      const binaryData = this.getHorizontalLinesBinaryData();

      this.ctx.bufferData(this.ctx.ARRAY_BUFFER, binaryData, this.ctx.STATIC_DRAW);
      this.ctx.drawArrays(this.ctx.LINES, 0, this.EngineHorizontalLines.length * 2);
    }

    if (this.EngineVerticalLines.length > 0) {
      const binaryData = this.getVerticalLinesBinaryData();

      this.ctx.bufferData(this.ctx.ARRAY_BUFFER, binaryData, this.ctx.STATIC_DRAW);
      this.ctx.drawArrays(this.ctx.LINES, 0, this.EngineVerticalLines.length * 2);
    }

    if (this.EngineTriangles.length > 0) {
      const binaryData = this.getTrianglesBinaryData();

      this.ctx.bufferData(this.ctx.ARRAY_BUFFER, binaryData, this.ctx.STATIC_DRAW);
      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.EngineTriangles.length * 3);
    }

    if (this.EngineSquares.length > 0) {
      const binaryData = this.getSquaresBinaryData();

      this.ctx.bufferData(this.ctx.ARRAY_BUFFER, binaryData, this.ctx.STATIC_DRAW);
      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.EngineSquares.length * 6);
    }
  }

  addPoint(x: number, y: number) {
    // This is a queue of length 5
    if (this.EnginePoints.length == 5) {
      this.EnginePoints.shift();
    }

    this.EnginePoints.push({
      x,
      y,
      color: structuredClone(this.color)
    });
  }

  addTriangle(t: Triangle) {
    // At most 5 trangles at the same time
    if (this.EngineTriangles.length == 5) {
      this.EngineTriangles.shift();
    }

    this.EngineTriangles.push(t);
  }

  addHorizontalLine(y: number) {
    // At most 5 lines at the same time
    if (this.EngineHorizontalLines.length == 5) {
      this.EngineHorizontalLines.shift();
    }

    this.EngineHorizontalLines.push([
      {
        x: 0,
        y,
        color: structuredClone(this.color)
      },
      {
        x: Infinity,
        y,
        color: structuredClone(this.color)
      }
    ]);
  }

  addCircle(p: Point) {
    // At most 5 circles at the same time
    if (this.EngineCircles.length == 5) {
      this.EngineCircles.shift();
    }

    this.EngineCircles.push(p);
  }

  addSquare(vertice1: Point, vertice2: Point) {
    // At most 5 squares at the same time
    if (this.EngineSquares.length == 5) {
      this.EngineSquares.shift();
    }

    const square: Square = [
      [
        vertice1,
        vertice2,
        { x: vertice1.x, y: vertice2.y, color: structuredClone(this.color) },
      ],
      [
        vertice1,
        vertice2,
        { x: vertice2.x, y: vertice1.y, color: structuredClone(this.color) },
      ]
    ];

    this.EngineSquares.push(square);
  }

  addVerticalLine(x: number) {
    // At most 5 lines at the same time
    if (this.EngineVerticalLines.length == 5) {
      this.EngineVerticalLines.shift();
    }

    this.EngineVerticalLines.push([
      {
        x,
        y: 0,
        color: structuredClone(this.color)
      },
      {
        x,
        y: Infinity,
        color: structuredClone(this.color)
      }
    ]);
  }

  // Mouse events initiate shape drawings and fires redraw
  mousedownEvent(event: MouseEvent) {
    event.preventDefault();

    const { clientX, clientY } = event;

    if (!event.target)
      throw new Error("MouseEvent event.target is null");

    // console.log("Mouseclick", clientX, clientY)

    // Add a shape to corresponding shapes array depending on the current shape state.
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

      case 't':
        this.EngineTemporaryTriangleVertices.push({
          x: clientX,
          y: clientY,
          color: structuredClone(this.color)
        });

        if (this.EngineTemporaryTriangleVertices.length == 3) {
          this.addTriangle(structuredClone(this.EngineTemporaryTriangleVertices));
          this.EngineTemporaryTriangleVertices = [];
        }

        break;

      case 'q':
        this.EngineTemporarySquareVertices.push({
          x: clientX,
          y: clientY,
          color: structuredClone(this.color)
        });

        if (this.EngineTemporarySquareVertices.length == 2) {
          this.addSquare(
            structuredClone(this.EngineTemporarySquareVertices[0]),
            structuredClone(this.EngineTemporarySquareVertices[1]),
          );

          this.EngineTemporarySquareVertices = [];
        }

        break;

      case 'c':
        this.addCircle({
          x: clientX,
          y: clientY,
          color: structuredClone(this.color)
        });
        break;

      default:
        break;
    }

    // This clears & render the frame again
    this.redrawFrame();
  }

  // Key presses mutates engine runtime configuration
  keydownEvent(event: KeyboardEvent) {
    // event.preventDefault();
    // console.log("Keydown", event.key);

    switch (event.key) {
      // case 'f':
      //   this.toggleFullscreen()
      //   break;

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
