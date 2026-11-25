import * as ort from './runtime/ort.wasm.min.mjs';
import {connectedRoad, hasTexture, obstacleMask, PATCH_HEIGHT, PATCH_WIDTH, SEGMENT_SIZE} from './observations.js';
import {hasWaterDeckConflict, reconcileScene, reviewWindows} from './scene-review.js';

ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = new URL('./runtime/', import.meta.url).href;
const models = new Map();

async function session(name) {
  if (!models.has(name)) {
    const url = new URL('./' + name + '.onnx', import.meta.url);
    models.set(name, ort.InferenceSession.create(url.href, {executionProviders: ['wasm']}));
  }
  try {
    return await models.get(name);
  } catch (error) {
    models.delete(name);
    throw error;
  }
}

function tensorFromPixels(rgba, width, height) {
  const count = width * height;
  const rgb = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    rgb[i] = rgba[4 * i] / 255;
    rgb[count + i] = rgba[4 * i + 1] / 255;
    rgb[2 * count + i] = rgba[4 * i + 2] / 255;
  }
  return new ort.Tensor('float32', rgb, [1, 3, height, width]);
}

function zoomInput(input, view) {
  const n = SEGMENT_SIZE, plane = n * n, rgb = new Float32Array(plane * 3);
  const source = input.data;
  const last = view.size - 1;
  for (let y = 0; y < n; y++) {
    const sy = Math.max(0, Math.min(last, (y + .5) * view.size / n - .5));
    const y0 = view.top + Math.floor(sy), y1 = Math.min(view.top + last, y0 + 1);
    const fy = sy - Math.floor(sy);
    for (let x = 0; x < n; x++) {
      const sx = Math.max(0, Math.min(last, (x + .5) * view.size / n - .5));
      const x0 = view.left + Math.floor(sx), x1 = Math.min(view.left + last, x0 + 1);
      const fx = sx - Math.floor(sx);
      for (let c = 0; c < 3; c++) {
        const start = c * plane;
        const top = source[start + y0*n + x0] * (1-fx) + source[start + y0*n + x1] * fx;
        const bottom = source[start + y1*n + x0] * (1-fx) + source[start + y1*n + x1] * fx;
        rgb[start + y*n + x] = top * (1-fy) + bottom * fy;
      }
    }
  }
  return new ort.Tensor('float32', rgb, input.dims);
}

async function sceneView(model, input, window) {
  const outputs = await model.run({[model.inputNames[0]]: input});
  try {
    return {...window, width: outputs.classes.dims[2],
      classes: outputs.classes.data.slice(), confidence: outputs.confidence.data.slice()};
  } finally {
    for (const tensor of Object.values(outputs)) tensor.dispose();
  }
}

async function sceneLabels(input) {
  const primary = await session('obstacles');
  const outputs = await primary.run({[primary.inputNames[0]]: input});
  const labels = outputs.labels.data.slice();
  outputs.labels.dispose();
  const model = await session('scene-review');
  const full = await sceneView(model, input, {left: 0, top: 0, size: SEGMENT_SIZE});
  const crops = [];
  for (const window of reviewWindows(labels, full)) {
    const zoom = zoomInput(input, window);
    try { crops.push(await sceneView(model, zoom, window)); } finally { zoom.dispose(); }
  }
  let mirrored;
  if (hasWaterDeckConflict(labels, full, crops)) {
    const flipped = input.data.slice();
    for (let i = 0; i < flipped.length; i += SEGMENT_SIZE) flipped.subarray(i, i + SEGMENT_SIZE).reverse();
    const tensor = new ort.Tensor('float32', flipped, input.dims);
    try { mirrored = await sceneView(model, tensor, {left: 0, top: 0, size: SEGMENT_SIZE}); }
    finally { tensor.dispose(); }
  }
  return reconcileScene(labels, full, crops, mirrored);
}

self.onmessage = async ({data: {kind, rgba}}) => {
  let input, outputs;
  try {
    if (kind === 'segment') {
      const lowDetail = !hasTexture(rgba);
      let labels;
      if (lowDetail) labels = new Uint8Array(SEGMENT_SIZE * SEGMENT_SIZE);
      else {
        input = tensorFromPixels(rgba, SEGMENT_SIZE, SEGMENT_SIZE);
        labels = await sceneLabels(input);
      }
      const {pixels, names} = obstacleMask(labels, SEGMENT_SIZE, SEGMENT_SIZE);
      const {mask: roadMask, count: roadCount} = connectedRoad(labels, SEGMENT_SIZE, SEGMENT_SIZE);
      self.postMessage({labels, pixels, names, roadMask, roadCount, lowDetail},
        [labels.buffer, pixels.buffer, roadMask.buffer]);
    } else {
      const model = await session('surface');
      input = tensorFromPixels(rgba, PATCH_WIDTH, PATCH_HEIGHT);
      outputs = await model.run({[model.inputNames[0]]: input});
      self.postMessage({wet: Array.from(outputs.wet.data), rough: Array.from(outputs.rough.data)});
    }
  } catch (error) {
    self.postMessage({error: String(error.message || error)});
  } finally {
    input?.dispose();
    for (const output of Object.values(outputs || {})) output.dispose();
  }
};
