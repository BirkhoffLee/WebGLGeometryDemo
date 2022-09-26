import { Engine } from './engine';

const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;

if (!canvas)
  throw new Error('Failed to get canvas');

const engine = new Engine(canvas);

canvas.onmousedown = engine.mousedownEvent.bind(engine);
document.onkeydown = engine.keydownEvent.bind(engine);
window.addEventListener('resize', engine.redrawFrame.bind(engine));
