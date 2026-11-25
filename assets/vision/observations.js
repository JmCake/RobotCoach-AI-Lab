export const SEGMENT_SIZE = 512;
export const PATCH_WIDTH = 96;
export const PATCH_HEIGHT = 64;

// GOOSE occupies 0–63. The following labels describe additional scene evidence.
export const WATER = 54, PATH = 64, STEPS = 65, UNSURE = 66, POSSIBLE_WATER = 67;
const obstacles = new Map([
  [1, '路锥'], [4, '障碍物'], [10, '路障'], [12, '汽车'], [13, '自行车'],
  [14, '行人'], [15, '公交车'], [20, '摩托车'], [25, '道闸'], [29, '碎屑'],
  [32, '骑行者'], [33, '动物'], [34, '卡车'], [40, '石块'], [60, '桶'],
]);
const ground = new Map([
  [3, '铺石路面'], [7, '自行车道'], [9, '人行横道'], [11, '路面标线'],
  [21, '人行道'], [23, '沥青路面'], [24, '碎石路面'], [31, '土路'], [PATH, '步道'],
]);
export const isGround = id => ground.has(id);
export const ROAD_COLOR = [46, 203, 119, 125];
export const OBSTACLE_COLOR = [255, 118, 53, 162];
const otherObjects = new Set([8, 12, 13, 14, 15, 16, 17, 20, 27, 28, 34, 38, 39, 50, 51, 52, 53]);

export function readPixels(context, source, width, height, rect) {
  context.canvas.width = width;
  context.canvas.height = height;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, rect.left, rect.top, rect.w, rect.h, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

export function hasTexture(rgba) {
  const min = [255,255,255], max = [0,0,0];
  for (let i = 0; i < rgba.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      min[c] = Math.min(min[c], rgba[i+c]);
      max[c] = Math.max(max[c], rgba[i+c]);
      if (max[c] - min[c] > 8) return true;
    }
  }
  return false;
}

export function patchRect(width, height, point) {
  const w = Math.max(1, Math.min(Math.round(width * .24), Math.round(height * .38 * 1.5)));
  const h = Math.max(1, Math.min(height, Math.round(w / 1.5)));
  const left = Math.max(0, Math.min(width - w, Math.round(point.x * width - w / 2)));
  const top = Math.max(0, Math.min(height - h, Math.round(point.y * height - h / 2)));
  return {left, top, w, h};
}

export function isOffRoad(labels, rect, width, height) {
  if (!labels) return false;
  let other = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const col = Math.floor((rect.left + rect.w * (x + .5) / 8) / width * SEGMENT_SIZE);
      const row = Math.floor((rect.top + rect.h * (y + .5) / 8) / height * SEGMENT_SIZE);
      if (otherObjects.has(labels[row * SEGMENT_SIZE + col])) other++;
    }
  }
  return other >= 48;
}

export function component(first, classes, width, visited, queue) {
  const id = classes[first];
  let head = 0, tail = 1;
  queue[0] = first;
  visited[first] = 1;
  function visit(index) {
    if (!visited[index] && classes[index] === id) {
      visited[index] = 1;
      queue[tail++] = index;
    }
  }
  while (head < tail) {
    const at = queue[head++], col = at % width;
    if (col > 0) visit(at - 1);
    if (col + 1 < width) visit(at + 1);
    if (at >= width) visit(at - width);
    if (at + width < classes.length) visit(at + width);
  }
  return tail;
}

export function obstacleMask(labels, width, height) {
  const visited = new Uint8Array(labels.length);
  const pixels = new Uint8ClampedArray(width * height * 4);
  const queue = new Int32Array(labels.length);
  const totals = new Map();
  const minimum = Math.max(4, Math.round(labels.length * .00035));
  for (let first = 0; first < labels.length; first++) {
    const label = labels[first];
    if (visited[first] || !obstacles.has(label)) continue;
    const tail = component(first, labels, width, visited, queue);
    if (tail < minimum) continue;
    totals.set(label, (totals.get(label) || 0) + tail);
    for (let i = 0; i < tail; i++) {
      pixels.set(OBSTACLE_COLOR, queue[i] * 4);
    }
  }
  const names = [...totals].sort((a,b) => b[1] - a[1]).map(([id]) => obstacles.get(id));
  return {pixels, names};
}

export function connectedRoad(labels, width, height) {
  const candidates = labels.map(id => Number(ground.has(id)));
  const mask = new Uint8Array(labels.length);
  const contact = new Uint8Array(labels.length);
  const seeds = [];
  // A forward-facing camera may see its own hood at the bottom. Only that
  // class can be skipped. Water, vehicles and unknown pixels stop the search.
  const nearLimit = Math.floor(height * .7);
  for (let x = Math.floor(width * .2); x < Math.ceil(width * .8); x++) {
    let y = height - 1;
    while (y > nearLimit && labels[y * width + x] === 8) y--;
    const at = y * width + x;
    if (candidates[at]) {
      contact[at] = 1;
      seeds.push(at);
    }
  }
  const visited = new Uint8Array(labels.length);
  const queue = new Int32Array(labels.length);
  const minContacts = Math.max(1, Math.ceil(width * .02));
  let count = 0;
  for (const seed of seeds) {
    if (visited[seed]) continue;
    const size = component(seed, candidates, width, visited, queue);
    let support = 0;
    for (let i = 0; i < size; i++) support += contact[queue[i]];
    if (support < minContacts || size < Math.ceil(labels.length * .002)) continue;
    for (let i = 0; i < size; i++) mask[queue[i]] = 1;
    count += size;
  }
  return {mask, count};
}

export function tintMask(mask, color) {
  const rgba = new Uint8ClampedArray(mask.length * 4);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) rgba.set(color, i * 4);
  }
  return rgba;
}

export function annotatedObstacles(labels) {
  return tintMask(labels.map(id => Number(obstacles.has(id))), OBSTACLE_COLOR);
}

export function describePoint(id, connected) {
  if (connected) return ground.get(id) + ' · 可通行候选';
  if (ground.has(id)) return ground.get(id) + ' · 未与近处连通';
  if (obstacles.has(id)) return obstacles.get(id) + ' · 障碍';
  if (id === WATER) return '水面';
  if (id === POSSIBLE_WATER) return '疑似水面 · 待确认';
  if (id === STEPS) return '台阶 · 需判断高度差';
  if (id === 50) return '草地 · 未确认可通行';
  if (id === UNSURE) return '模型判断有分歧 · 待确认';
  if (id === 2) return '积雪';
  if (id === 22) return '路缘';
  return '未确认可通行';
}
