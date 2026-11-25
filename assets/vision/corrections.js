import {SEGMENT_SIZE} from './observations.js';

const categories = ['可通行路面', '木栈道', '石铺路', '台阶', '障碍物', '水面或积水', '疑似潮湿路面', '颠簸路面', '其他不可通行区域', '无法确认'];
const prefix = 'robotcoach.road-vision.notes.v1.';
const el = id => document.getElementById(id);

async function storageKey(photo) {
  if (!photo.local) return prefix + photo.file;
  const digest = await crypto.subtle.digest('SHA-256', await photo.localFile.arrayBuffer());
  const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  return prefix + hex;
}

function readNotes(key) {
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  return records.filter(row => Number.isInteger(row.pixel) && row.pixel >= 0 &&
    row.pixel < SEGMENT_SIZE ** 2 && categories.includes(row.observed));
}

export async function loadCorrections(photo) {
  if (!photo.notesReady) {
    photo.notesReady = (async () => {
      try {
        photo.noteKey = await storageKey(photo);
        photo.notes = readNotes(photo.noteKey);
      } catch {
        photo.noteKey = null;
        photo.notes = [];
      }
    })();
  }
  await photo.notesReady;
}

export function correctionControls(getPhoto, movePoint, refresh) {
  const choice = el('correctClass'), list = el('savedPoints'), message = el('noteStatus');
  for (const category of categories) choice.add(new Option(category, category));
  let shownPhoto, shownIndex, shownNotes;
  function save(remove) {
    const photo = getPhoto();
    if (photo !== shownPhoto || shownIndex == null || !remove && !choice.value) return;
    let current = photo.notes;
    if (photo.noteKey) {
      try { current = readNotes(photo.noteKey); } catch { photo.noteKey = null; }
    }
    const next = current.filter(row => row.pixel !== shownIndex);
    if (!remove) {
      next.push({pixel: shownIndex, observed: choice.value, model: {
        position: el('pointReading').textContent, wetness: el('wet').textContent, roughness: el('rough').textContent,
      }});
    }
    photo.notes = next;
    if (photo.noteKey) {
      try { localStorage.setItem(photo.noteKey, JSON.stringify(next)); } catch { photo.noteKey = null; }
    }
    refresh();
    message.textContent = remove ? '已移除这处记录。' : photo.noteKey ? '已保存在此浏览器。' : '已暂存，可导出本图记录。';
  }
  choice.addEventListener('change', () => { el('saveNote').disabled = !choice.value; });
  el('saveNote').addEventListener('click', () => save(false));
  el('deleteNote').addEventListener('click', () => save(true));
  list.addEventListener('change', () => {
    if (list.value === '') return;
    const at = Number(list.value);
    movePoint(((at % SEGMENT_SIZE) + .5) / SEGMENT_SIZE, (Math.floor(at / SEGMENT_SIZE) + .5) / SEGMENT_SIZE);
  });
  el('exportNotes').addEventListener('click', () => {
    const photo = getPhoto();
    const points = photo.notes.map(({pixel, observed, model}) => ({
      x: ((pixel % SEGMENT_SIZE) + .5) / SEGMENT_SIZE, y: (Math.floor(pixel / SEGMENT_SIZE) + .5) / SEGMENT_SIZE,
      observed, model,
    }));
    const record = {version: 1, photo: photo.local ? photo.name : photo.file,
      coordinate_system: 'normalized from top left', points};
    if (photo.local && photo.noteKey) record.image_sha256 = photo.noteKey.slice(prefix.length);
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = (photo.local ? photo.name : photo.file).replace(/\.[^.]+$/, '') + '-纠错.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return function show(photo, index) {
    el('corrections').hidden = index == null || !photo.notes;
    if (photo !== shownPhoto) el('corrections').open = false;
    if (photo === shownPhoto && index === shownIndex && photo.notes === shownNotes) return;
    shownPhoto = photo; shownIndex = index; shownNotes = photo.notes;
    message.textContent = '';
    if (el('corrections').hidden) return;
    const selected = photo.notes.find(row => row.pixel === index);
    choice.value = selected?.observed || '';
    el('saveNote').disabled = !choice.value;
    el('deleteNote').hidden = !selected;
    el('savedNotes').hidden = !photo.notes.length;
    list.replaceChildren(new Option('已记录 ' + photo.notes.length + ' 处 · 选择查看', ''));
    photo.notes.forEach((row, i) => list.add(new Option((i + 1) + ' · ' + row.observed, String(row.pixel))));
    if (selected) list.value = String(index);
    if (selected) message.textContent = '此处已记为「' + selected.observed + '」。';
  };
}
