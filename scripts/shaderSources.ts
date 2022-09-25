export const VSHADER_SOURCE = `
attribute vec2 a_Position;
uniform vec2 u_resolution;

attribute vec4 a_Color;
varying vec4 v_Color;

attribute float a_isPoint;
// attribute float a_isSquare;

attribute float a_isCircle;
varying float v_isCircle;

void main() {
  // https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_Position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  if (a_isCircle == 1.0) {
    gl_PointSize = 20.0;
  } else if (a_isPoint == 1.0) {
    gl_PointSize = 3.0;
  } else {
    gl_PointSize = 8.0;
  }

  v_Color = a_Color;
  v_isCircle = a_isCircle;
}
`;

export const FSHADER_SOURCE = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

// Use medium precision for default
precision mediump float;

varying float v_isCircle;
varying vec4 v_Color;

void main() {
  if (v_isCircle == 1.0) {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;

    float r = dot(cxy, cxy);
    float alpha = 1.0;

#ifdef GL_OES_standard_derivatives
    float delta = fwidth(r);
    alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
#else
    if (r > 1.0) {
      discard;
    }
#endif

    gl_FragColor = v_Color * alpha;

    return;
  }

  gl_FragColor = v_Color;
}
`;
