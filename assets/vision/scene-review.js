import {component, isGround, PATH, POSSIBLE_WATER, SEGMENT_SIZE, STEPS, UNSURE, WATER} from './observations.js';

// ADE20K indices are zero-based in the decoder. Scores here are rounded softmax × 255.
const water = new Set([21, 26, 60, 109, 113, 128]);
const steps = new Set([53, 59, 96, 121]);
const deck = new Set([3, 6, 11, 52, 61, 91, 140]);
const naturalGround = new Set([9, 13, 16, 29, 34, 46, 68, 91, 94]);
const upright = new Set([2, 4, 17, 32, 38, 72, 95]);
const slopes = new Set([16, 68]);
const structures = new Set([38, 39, 41, 42, 43]);
const actors = new Map([[12,14], [20,12], [80,15], [83,34], [102,12], [116,20], [127,13]]);
const motorVehicles = new Set([12, 15, 34]);
const roadUsers = new Set([12, 13, 14, 15, 20, 32, 34]);
const unpaved = new Set([3, 24, 31]);
const side = Math.round(SEGMENT_SIZE * .60);
const offset = SEGMENT_SIZE - side;

function indexIn(view, x, y) {
  const col = Math.floor((x - view.left) * view.width / view.size);
  const row = Math.floor((y - view.top) * view.width / view.size);
  return row * view.width + col;
}

// Zoom only where water conflicts with road or unpaved ground is ambiguous.
export function reviewWindows(primary, scene) {
  const needed = [0, 0];
  for (let y = offset; y < SEGMENT_SIZE; y += 4) {
    for (let x = 0; x < SEGMENT_SIZE; x += 4) {
      const id = primary[y * SEGMENT_SIZE + x];
      const i = indexIn(scene, x, y), cls = scene.classes[i];
      if (isGround(id) && water.has(cls) || unpaved.has(id) && naturalGround.has(cls) ||
          structures.has(id) && cls === 52) {
        needed[Number(x >= SEGMENT_SIZE / 2)]++;
      }
    }
  }
  return [0, offset].filter((_, i) => needed[i] >= 32)
    .map(left => ({left, top: offset, size: side}));
}

export function hasWaterDeckConflict(primary, scene, crops) {
  let cells = 0;
  for (const crop of crops) {
    for (let y = crop.top; y < SEGMENT_SIZE; y += 4) {
      for (let x = crop.left; x < crop.left + crop.size; x += 4) {
        const local = indexIn(crop, x, y);
        if (isGround(primary[y * SEGMENT_SIZE + x]) && water.has(scene.classes[indexIn(scene, x, y)]) &&
            deck.has(crop.classes[local]) && crop.confidence[local] >= 140) {
          cells++;
          if (cells >= 32) return true;
        }
      }
    }
  }
  return false;
}

// Check the whole GOOSE instance against the coarser scene grid, preserving fine
// silhouettes when only the center of a distant person or car is corroborated.
function checkRoadUsers(primary, scene) {
  const checked = primary.slice(), visited = new Uint8Array(primary.length);
  const queue = new Int32Array(primary.length);
  for (let first = 0; first < primary.length; first++) {
    const id = primary[first];
    if (visited[first] || !roadUsers.has(id)) continue;
    const count = component(first, primary, SEGMENT_SIZE, visited, queue);
    let supported = 0, contradicted = 0;
    for (let j = 0; j < count; j++) {
      const at = queue[j];
      const i = indexIn(scene, at % SEGMENT_SIZE, Math.floor(at / SEGMENT_SIZE));
      const cls = scene.classes[i], actor = actors.get(cls);
      const match = id === actor || motorVehicles.has(id) && motorVehicles.has(actor) ||
        id === 32 && (actor === 13 || actor === 14 || actor === 20);
      if (match && scene.confidence[i] >= 64) supported++;
      if (!actor && scene.confidence[i] >= 115) contradicted++;
    }
    if (supported < count * .05 && (motorVehicles.has(id) || contradicted > count * .5)) {
      for (let j = 0; j < count; j++) checked[queue[j]] = UNSURE;
    }
  }
  return checked;
}

function reviewPixel(id, cls, score, local, localScore, secondWater, mirroredPath) {
  if (id === WATER || id === 8) return id;
  if (steps.has(cls) && score >= 135) return STEPS;
  const actor = actors.get(cls);
  if (actor && !motorVehicles.has(actor) && score >= 145 && !roadUsers.has(id)) return actor;
  if (roadUsers.has(id)) return id;
  if (water.has(cls)) {
    if (local !== undefined && isGround(id)) {
      if (deck.has(local) && localScore >= 140 || mirroredPath) return PATH;
      if (!water.has(local)) return UNSURE;
      return Math.max(score, localScore) >= 115 ? WATER : POSSIBLE_WATER;
    }
    return score >= 120 ? WATER : POSSIBLE_WATER;
  }
  if (isGround(id) && naturalGround.has(cls) && water.has(local) && localScore >= 140) {
    return secondWater ? WATER : POSSIBLE_WATER;
  }
  // A bridge or pier can include vertical supports. Only a visible path can
  // introduce new walkable pixels. Existing obstacles and curbs stay excluded.
  if (cls === 52 && score >= 170) {
    if (isGround(id) || id === 0 || id === 18 || id === 50) return PATH;
    if (structures.has(id) && local === 52 && localScore >= 180) return PATH;
  }
  if (isGround(id) && cls === 9 && local === 9 && Math.min(score, localScore) >= 145) return 50;
  if (isGround(id) && upright.has(cls) && upright.has(local) && Math.min(score, localScore) >= 170) return UNSURE;
  if (unpaved.has(id) && slopes.has(cls) && slopes.has(local) && Math.min(score, localScore) >= 190) return UNSURE;
  return id;
}

export function reconcileScene(primary, scene, crops, mirrored) {
  const labels = checkRoadUsers(primary, scene);
  for (let y = 0; y < SEGMENT_SIZE; y++) {
    for (let x = 0; x < SEGMENT_SIZE; x++) {
      const at = y * SEGMENT_SIZE + x, i = indexIn(scene, x, y);
      let local, localScore = -1, votes = 0;
      for (const crop of crops) {
        if (y < crop.top || x < crop.left || x >= crop.left + crop.size) continue;
        const j = indexIn(crop, x, y), score = crop.confidence[j], cls = crop.classes[j];
        if (water.has(cls) && score >= 140) votes++;
        if (score > localScore) { local = cls; localScore = score; }
      }
      const flip = mirrored && indexIn(mirrored, SEGMENT_SIZE - 1 - x, y);
      const mirroredPath = mirrored && mirrored.classes[flip] === 52 && mirrored.confidence[flip] >= 102;
      labels[at] = reviewPixel(labels[at], scene.classes[i], scene.confidence[i], local, localScore, votes === 2, mirroredPath);
    }
  }
  return labels;
}
