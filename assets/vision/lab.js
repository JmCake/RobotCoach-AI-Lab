import {
  annotatedObstacles, connectedRoad, describePoint, hasTexture, isOffRoad, patchRect, readPixels,
  tintMask, PATCH_HEIGHT, PATCH_WIDTH, POSSIBLE_WATER, ROAD_COLOR, SEGMENT_SIZE, STEPS, UNSURE, WATER,
} from './observations.js';
import {samples} from './samples.js';
import {correctionControls, loadCorrections} from './corrections.js';

const el = id => document.getElementById(id);
const photo = el('photo');
const display = photo.getContext('2d');
const source = document.createElement('canvas');
const crop = document.createElement('canvas');
const cropContext = crop.getContext('2d', {willReadFrequently: true});
const photos = [];
let active, ready = false, imageLoad = 0, working = false, worker, timer;
const showCorrections = correctionControls(() => active, movePoint, () => { draw(); update(); });
const params = new URLSearchParams(location.search);
const back = params.get('from');
if (back === 'course' || back === 'index') el('return').href = '../' + back + '.html#workshop';

function addPhoto(entry) {
  const item = {...entry, point: {...(entry.point || {x: .5, y: .72})}, revision: 0, view: 'overlay'};
  const button = document.createElement('button');
  button.type = 'button';
  const thumb = document.createElement('img');
  thumb.src = item.thumbnail || item.url;
  thumb.alt = '';
  thumb.loading = 'lazy';
  const name = document.createElement('span');
  name.textContent = item.name;
  button.append(thumb, name);
  button.addEventListener('click', event => {
    openPhoto(item, true);
    const viewer = photo.closest('.viewer');
    if (event.detail > 0 && viewer.getBoundingClientRect().bottom <= 0) viewer.scrollIntoView({block: 'start'});
  });
  item.button = button;
  photos.push(item);
  const group = item.local ? 'importedPhotos' : (item.group || (item.credit ? 'scenic' : 'lesson')) + 'Photos';
  el(group).append(button);
  if (item.local) el('importedGroup').hidden = false;
  el('photoCount').textContent = photos.length + ' 张';
  return item;
}

async function openPhoto(item, updateLink = false) {
  if (updateLink) {
    const url = new URL(location.href);
    if (item.file) url.searchParams.set('sample', item.file.replace(/\.webp$/, ''));
    else url.searchParams.delete('sample');
    history.replaceState(history.state, '', url);
  }
  const ticket = ++imageLoad;
  ready = false;
  active = item;
  item.lastUsed = performance.now();
  for (const entry of photos) entry.button.setAttribute('aria-pressed', String(entry === item));
  el('photoName').textContent = item.name;
  el('photoCaption').textContent = item.caption || '';
  el('photoCredit').hidden = !item.credit;
  if (item.credit) {
    const {place, author, title, license, source} = item.credit;
    el('photoPlace').textContent = place;
    el('creditRole').textContent = source ? '来源' : '摄影';
    const original = el('photoSource');
    original.textContent = author;
    original.href = source || 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(title.replaceAll(' ', '_'));
    original.title = '查看原作 · ' + title;
    el('photoLicenseWrap').hidden = !license;
    if (license) {
      el('photoLicense').textContent = license.name;
      el('photoLicense').href = license.url;
    }
  }
  el('reference').open = false;
  el('referenceText').textContent = item.reference || '';
  display.clearRect(0, 0, photo.width, photo.height);
  update();
  loadCorrections(item).then(() => { if (item === active && ready) { draw(); update(); } });
  try {
    const img = new Image();
    img.src = item.url;
    await img.decode();
    if (ticket !== imageLoad) return;
    const scale = Math.min(1, 1350 / Math.max(img.naturalWidth, img.naturalHeight));
    source.width = photo.width = Math.max(1, Math.round(img.naturalWidth * scale));
    source.height = photo.height = Math.max(1, Math.round(img.naturalHeight * scale));
    source.getContext('2d').drawImage(img, 0, 0, source.width, source.height);
    item.decodeError = false;
    ready = true;
    draw();
    update();
    schedule();
  } catch {
    if (ticket !== imageLoad) return;
    item.decodeError = true;
    update();
  }
}

function selectedRect() {
  if (active.whole) return {left: 0, top: 0, w: source.width, h: source.height};
  return patchRect(source.width, source.height, active.point);
}

function layerCanvas(pixels) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SEGMENT_SIZE;
  canvas.getContext('2d').putImageData(new ImageData(pixels, SEGMENT_SIZE, SEGMENT_SIZE), 0, 0);
  return canvas;
}

function sceneLayers(roadMask, obstaclePixels) {
  return {road: layerCanvas(tintMask(roadMask, ROAD_COLOR)), obstacles: layerCanvas(obstaclePixels)};
}

async function referenceLayers(filename) {
  const image = new Image();
  image.src = new URL('./samples/' + filename, import.meta.url).href;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SEGMENT_SIZE;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, SEGMENT_SIZE, SEGMENT_SIZE);
  const {data} = ctx.getImageData(0, 0, SEGMENT_SIZE, SEGMENT_SIZE);
  const labels = new Uint8Array(SEGMENT_SIZE * SEGMENT_SIZE);
  for (let i = 0; i < labels.length; i++) labels[i] = data[i * 4];
  return sceneLayers(connectedRoad(labels, SEGMENT_SIZE, SEGMENT_SIZE).mask, annotatedObstacles(labels));
}

function draw() {
  if (!ready) return;
  display.clearRect(0, 0, photo.width, photo.height);
  display.drawImage(source, 0, 0);
  const layers = active.view === 'truth' ? active.truth : active.view === 'overlay' ? active.layer : null;
  if (layers) {
    display.save();
    display.imageSmoothingEnabled = false;
    if (el('showRoad').checked) display.drawImage(layers.road, 0, 0, photo.width, photo.height);
    if (el('showObstacles').checked) display.drawImage(layers.obstacles, 0, 0, photo.width, photo.height);
    display.restore();
  }
  if (active.view === 'overlay' && layers && active.notes?.length) {
    display.save();
    display.strokeStyle = '#ffffff';
    display.fillStyle = '#713282';
    display.lineWidth = Math.max(1, photo.width / 550);
    for (const {pixel} of active.notes) {
      const x = (pixel % SEGMENT_SIZE + .5) / SEGMENT_SIZE * photo.width;
      const y = (Math.floor(pixel / SEGMENT_SIZE) + .5) / SEGMENT_SIZE * photo.height;
      display.beginPath();
      display.arc(x, y, Math.max(4, photo.width / 105), 0, 2 * Math.PI);
      display.fill();
      display.stroke();
    }
    display.restore();
  }
  const {left, top, w, h} = selectedRect();
  const line = Math.max(2, photo.width / 310);
  display.save();
  display.lineWidth = line * 1.8;
  display.strokeStyle = '#20332a';
  display.strokeRect(left, top, w, h);
  display.lineWidth = line;
  display.setLineDash([line * 3, line * 1.8]);
  display.strokeStyle = '#fff';
  display.strokeRect(left, top, w, h);
  if (!active.whole) {
    const x = active.point.x * photo.width, y = active.point.y * photo.height;
    display.setLineDash([]);
    display.beginPath();
    display.arc(x, y, line * 1.6, 0, 2 * Math.PI);
    display.strokeStyle = '#20332a';
    display.stroke();
    display.fillStyle = '#fff';
    display.fill();
  }
  display.restore();
}

function rating(values, names, threshold) {
  if (!values) return '—';
  const best = Math.max(...values);
  return best < threshold ? '看不清' : names[values.indexOf(best)];
}

function pointIndex(point) {
  const x = Math.min(SEGMENT_SIZE - 1, Math.floor(point.x * SEGMENT_SIZE));
  const y = Math.min(SEGMENT_SIZE - 1, Math.floor(point.y * SEGMENT_SIZE));
  return y * SEGMENT_SIZE + x;
}

const sceneReadings = new Map([
  [WATER, ['可见水面', '水下看不清']],
  [POSSIBLE_WATER, ['疑似有水', '看不清']],
  [STEPS, ['看不清', '台阶有高度差']],
  [UNSURE, ['待确认', '待确认']],
]);

function update() {
  const item = active;
  const result = item.surface?.revision === item.revision ? item.surface : null;
  const offRoad = ready && !item.whole && isOffRoad(item.labels, selectedRect(), source.width, source.height);
  const partialError = item.segmentError || item.surfaceError;
  const done = item.labels && result;
  el('original').setAttribute('aria-pressed', String(!item.layer || item.view === 'original'));
  el('overlay').setAttribute('aria-pressed', String(Boolean(item.layer && item.view === 'overlay')));
  el('overlay').disabled = !ready || !item.layer;
  el('layerFilters').disabled = !ready || !item.layer || item.view === 'original';
  el('truth').hidden = !item.mask || !item.layer;
  el('truth').setAttribute('aria-pressed', String(item.view === 'truth' && !!item.layer));
  el('whole').checked = Boolean(item.whole);
  el('whole').disabled = !ready;
  el('analyze').disabled = !ready || (item.requested && !partialError);
  el('analyze').textContent = partialError ? '重试识别' : done ? '已完成识别' : item.requested ? '正在识别…' : '开始识别 →';
  const sceneStatus = item.segmentError ? '场景分割暂不可用' : item.requested ? '正在识别整张照片…' : '等你开始识别';
  el('objects').textContent = item.lowDetail && item.labels ? '纹理不足，无法辨认障碍' :
    item.names ? (item.names.join('、') || '未检出明显障碍') : sceneStatus;
  let roadReading = sceneStatus;
  if (item.labels) {
    if (item.lowDetail) roadReading = '纹理不足，无法辨认路面';
    else if (item.roadCount) roadReading = '约占画面的 ' + (100 * item.roadCount / item.labels.length).toFixed(1) + '%';
    else roadReading = '近处未找到连续路面';
  }
  el('roadReading').textContent = roadReading;
  el('pointRow').hidden = !ready || !item.labels || item.whole;
  let pointReadings;
  if (!el('pointRow').hidden) {
    const at = pointIndex(item.point);
    el('pointReading').textContent = describePoint(item.labels[at], item.roadMask[at]);
    pointReadings = sceneReadings.get(item.labels[at]);
  }
  el('wet').textContent = pointReadings?.[0] ?? (offRoad ? '请选地面' : rating(result?.wet, ['外观干燥', '疑似潮湿', '疑似积水'], .58));
  el('rough').textContent = pointReadings?.[1] ?? (offRoad ? '请选地面' : rating(result?.rough, ['较平整', '轻微凹凸', '明显凹凸'], .52));
  el('reference').hidden = !item.reference || !done;
  let status = '先观察照片，再点击开始识别。';
  if (item.decodeError) status = '这张图片无法读取，请换一张 JPEG、PNG 或 WebP 照片。';
  else if (!ready) status = '正在打开照片…';
  else if (partialError) status = '部分识别失败，可以重试。';
  else if (done) status = item.view === 'truth' ? '正在查看人工标注，可切回模型叠加对照。' :
    result.blank ? '选区几乎是纯色，换一块有纹理的路面试试。' :
    offRoad && !pointReadings ? '白框大部分位于地面以外，请移动选区。' : '识别完成，点其他位置可查看判断。';
  else if (item.requested) status = result ? '正在标出可通行路面和障碍…' : '正在本机读取模型并分析照片…';
  el('status').textContent = status;
  showCorrections(item, ready && done && !item.whole && !item.surfaceError ? pointIndex(item.point) : null);
}

function infer(kind, rgba) {
  if (!worker) worker = new Worker(new URL('./model.worker.js', import.meta.url), {type: 'module'});
  return new Promise((resolve, reject) => {
    worker.onmessage = ({data}) => data.error ? reject(new Error(data.error)) : resolve(data);
    worker.onerror = event => {
      worker.terminate();
      worker = undefined;
      reject(new Error(event.message || 'Worker failed'));
    };
    worker.postMessage({kind, rgba}, [rgba.buffer]);
  });
}

async function schedule() {
  if (working) return;
  working = true;
  try {
    while (ready && active.requested) {
      const item = active;
      if (!item.surfaceError && item.surface?.revision !== item.revision) {
        const revision = item.revision;
        try {
          const rgba = readPixels(cropContext, source, PATCH_WIDTH, PATCH_HEIGHT, selectedRect());
          const result = hasTexture(rgba) ? await infer('surface', rgba) : {wet: [0,0,0], rough: [0,0,0], blank: true};
          item.surface = {...result, revision};
        } catch (error) {
          item.surfaceError = true;
          console.warn('路面识别', error.message);
        }
      } else if (!item.labels && !item.segmentError) {
        try {
          const rgba = readPixels(cropContext, source, SEGMENT_SIZE, SEGMENT_SIZE, {left: 0, top: 0, w: source.width, h: source.height});
          const {labels, pixels, names, roadMask, roadCount, lowDetail} = await infer('segment', rgba);
          Object.assign(item, {layer: sceneLayers(roadMask, pixels), labels, names, roadMask, roadCount, lowDetail});
          // Keep full-resolution masks only for a few recently analyzed photos.
          const cached = photos.filter(entry => entry !== item && entry.layer).sort((a,b) => b.lastUsed - a.lastUsed);
          for (const entry of cached.slice(3)) {
            Object.assign(entry, {layer: null, truth: null, labels: null, names: null, roadMask: null, roadCount: 0, requested: false, view: 'overlay'});
          }
        } catch (error) {
          item.segmentError = true;
          console.warn('场景分割', error.message);
        }
      } else break;
      if (item === active && ready) { draw(); update(); }
    }
  } finally { working = false; }
}

function movePoint(x, y, whole = false) {
  if (!ready) return;
  active.whole = whole;
  active.point = {x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y))};
  active.revision++;
  active.surfaceError = false;
  draw();
  update();
  clearTimeout(timer);
  timer = setTimeout(schedule, 130);
}
el('whole').addEventListener('change', () => movePoint(active.point.x, active.point.y, el('whole').checked));
photo.addEventListener('click', event => {
  const rect = photo.getBoundingClientRect();
  movePoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
});
photo.addEventListener('keydown', event => {
  const delta = {ArrowLeft: [-.05, 0], ArrowRight: [.05, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05]}[event.key];
  if (!delta || !ready) return;
  event.preventDefault();
  movePoint(active.point.x + delta[0], active.point.y + delta[1]);
});
el('analyze').addEventListener('click', () => {
  active.requested = true;
  active.lastUsed = performance.now();
  active.surfaceError = active.segmentError = false;
  update();
  schedule();
});
el('layerFilters').addEventListener('change', draw);
for (const id of ['original', 'overlay', 'truth']) el(id).addEventListener('click', async () => {
  const item = active;
  item.view = id;
  if (id === 'truth' && !item.truth) {
    try { item.truth = await referenceLayers(item.mask); } catch {
      if (active === item && item.view === 'truth') {
        item.view = 'overlay';
        draw();
        update();
        el('status').textContent = '人工标注图暂时无法打开。';
      }
      return;
    }
  }
  if (active !== item) return;
  draw();
  update();
});
el('upload').addEventListener('click', () => el('files').click());
el('files').addEventListener('change', event => {
  const chosen = [...event.target.files];
  event.target.value = '';
  if (!chosen.length) return;
  const accepted = chosen.filter(file => /^(image\/(?:jpeg|png|webp|bmp|avif))$/i.test(file.type) ||
    (!file.type && /\.(jpe?g|png|webp|bmp|avif)$/i.test(file.name)));
  const added = accepted.map(file => addPhoto({name: file.name, url: URL.createObjectURL(file), local: true, localFile: file}));
  const dropped = chosen.length - added.length;
  el('importStatus').textContent = '已导入 ' + added.length + ' 张照片。' + (dropped ? '已跳过 ' + dropped + ' 个不支持的文件。' : '');
  if (added.length) openPhoto(added[0], true);
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearTimeout(timer);
  worker?.terminate();
  for (const item of photos) if (item.local) URL.revokeObjectURL(item.url);
});
function addSample(item, directory) {
  return addPhoto({...item, url: new URL(item.file, directory).href,
    thumbnail: item.credit ? new URL('thumbs/' + item.file, directory).href : undefined});
}
const sampleDir = new URL('./samples/', import.meta.url);
for (const sample of samples) addSample(sample, sampleDir);
const initialSample = params.get('sample');
const requestedFile = initialSample && initialSample + '.webp';
const builtIn = photos.find(item => item.file === requestedFile);
if (builtIn) openPhoto(builtIn);

async function loadCampus() {
  const catalog = new URL('../../study-photos/bohai/catalog.json', import.meta.url);
  let campus = [];
  try {
    const response = await fetch(catalog);
    if (response.ok) campus = await response.json();
  } catch { /* The classroom pack is optional on static hosts. */ }
  if (!Array.isArray(campus)) campus = [];
  const entries = campus.map(item => addSample({...item, group: 'campus'}, catalog));
  el('campusSources').hidden = entries.length > 0;
  if (!active) openPhoto(entries.find(item => item.file === requestedFile) || entries[0] || photos[0]);
}
loadCampus();
