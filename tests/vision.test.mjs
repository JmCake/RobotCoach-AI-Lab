import test from 'node:test';
import assert from 'node:assert/strict';
import {
  annotatedObstacles, connectedRoad, describePoint, hasTexture, isOffRoad, obstacleMask, patchRect,
  PATH, SEGMENT_SIZE, STEPS, UNSURE, WATER,
} from '../assets/vision/observations.js';
import {hasWaterDeckConflict, reconcileScene, reviewWindows} from '../assets/vision/scene-review.js';

test('a border click selects real pixels inside landscape, portrait, or single-pixel photos', () => {
  for (const [width, height] of [[1100,350],[170,1300],[1,1]]) {
    for (const point of [{x:0,y:0},{x:.5,y:.5},{x:1,y:1}]) {
      const rect = patchRect(width,height,point);
      assert.ok(rect.w >= 1 && rect.h >= 1 && rect.left >= 0 && rect.top >= 0);
      assert.ok(rect.left + rect.w <= width && rect.top + rect.h <= height);
    }
  }
});

test('mask removes isolated pixels without joining objects across left and right edges', () => {
  const labels = new Uint8Array(20);
  for (const index of [3,4,5,6]) labels[index] = 1;
  for (const index of [12,13,17,18]) labels[index] = 40;
  const {names,pixels} = obstacleMask(labels,5,4);
  assert.deepEqual(names,['石块']);
  assert.equal(pixels[4*4+3],0);
  assert.ok(pixels[12*4+3]>0);
});

test('plain colors and regions covering sky are distinguishable from textured road', () => {
  assert.equal(hasTexture(new Uint8ClampedArray([0,100,200,255,0,100,200,255])),false);
  assert.equal(hasTexture(new Uint8ClampedArray([0,100,200,255,25,100,200,255])),true);
  const labels = new Uint8Array(SEGMENT_SIZE * SEGMENT_SIZE).fill(23);
  labels.fill(53,0,SEGMENT_SIZE * SEGMENT_SIZE / 2);
  assert.equal(isOffRoad(labels,{left:0,top:0,w:100,h:30},100,100),true);
  assert.equal(isOffRoad(labels,{left:0,top:70,w:100,h:30},100,100),false);
});

test('road materials and markings join while vehicles and standing water leave holes', () => {
  const labels = new Uint8Array([
    3, 7,  9, 11, 21,
    3, 12, 24, 54, 31,
    23, 23, 23, 23, 23,
  ]);
  const {mask, count} = connectedRoad(labels, 5, 3);
  assert.equal(count, 13);
  assert.deepEqual([...mask], [
    1, 1, 1, 1, 1,
    1, 0, 1, 0, 1,
    1, 1, 1, 1, 1,
  ]);
  assert.equal(annotatedObstacles(labels)[6 * 4 + 3] > 0, true);
  assert.equal(annotatedObstacles(labels)[8 * 4 + 3], 0);
});

test('a continuous strip of water, vehicles, curb, snow or unknown pixels cuts off the far side', () => {
  for (const barrier of [54, 12, 22, 2, 0]) {
    const labels = new Uint8Array(30).fill(23);
    labels.fill(barrier, 12, 18);
    const {mask, count} = connectedRoad(labels, 6, 5);
    assert.equal(count, 12);
    assert.ok(mask.slice(0, 18).every(value => value === 0));
    assert.ok(mask.slice(18).every(value => value === 1));
  }
});

test('neither diagonal contact nor a row boundary connects an isolated road pixel', () => {
  const labels = new Uint8Array(25);
  for (const i of [3, 4, 9, 10, 12, 15, 16, 20, 21]) labels[i] = 24;
  const {mask, count} = connectedRoad(labels, 5, 5);
  assert.equal(count, 5);
  assert.deepEqual([...mask.entries()].filter(([,v]) => v).map(([i]) => i), [10,15,16,20,21]);
});

test('only a short camera hood may be skipped to reach the near road', () => {
  const labels = new Uint8Array(100).fill(23);
  labels.fill(8, 80);
  assert.equal(connectedRoad(labels, 10, 10).count, 80);
  labels.fill(8, 70);
  assert.equal(connectedRoad(labels, 10, 10).count, 0);
  labels.fill(23);
  labels.fill(12, 90);
  assert.equal(connectedRoad(labels, 10, 10).count, 0);
  labels.fill(0);
  labels[90] = 23;
  assert.equal(connectedRoad(labels, 10, 10).count, 0);
});

test('thin contact, tiny flecks and a scene without candidate ground yield no green', () => {
  const labels = new Uint8Array(100 * 100).fill(23);
  labels.fill(0, 9900);
  labels[9950] = 23;
  assert.equal(connectedRoad(labels, 100, 100).count, 0);
  labels.fill(0);
  labels.fill(23, 9950, 9953);
  assert.equal(connectedRoad(labels, 100, 100).count, 0);
  labels.fill(53);
  assert.equal(connectedRoad(labels, 100, 100).count, 0);
  labels.fill(23);
  assert.equal(connectedRoad(labels, 100, 100).count, labels.length);
});

test('the selected point distinguishes connected and isolated road, obstacles and water', () => {
  assert.equal(describePoint(23, 1), '沥青路面 · 可通行候选');
  assert.equal(describePoint(23, 0), '沥青路面 · 未与近处连通');
  assert.equal(describePoint(12, 0), '汽车 · 障碍');
  assert.equal(describePoint(54, 0), '水面');
  assert.equal(describePoint(0, 0), '未确认可通行');
});

test('a contradicted car is withheld, while one supported inside its outline keeps its edges', () => {
  const n = SEGMENT_SIZE;
  const primary = new Uint8Array(n * n).fill(23);
  const classes = new Uint8Array(128 * 128).fill(6);
  for (let y = 64; y < 96; y++) {
    primary.fill(12, y*n+48, y*n+80);
    primary.fill(12, y*n+144, y*n+176);
  }
  for (let y = 17; y < 23; y++) classes.fill(20, y*128+37, y*128+43);
  const scene = {classes, confidence: new Uint8Array(classes.length).fill(210), width: 128, left: 0, top: 0, size: n};
  const labels = reconcileScene(primary, scene, []);
  assert.equal(labels[64*n+48], UNSURE);
  assert.equal(labels[64*n+144], 12);
  assert.equal(connectedRoad(labels, n, n).mask[64*n+48], 0);
});

test('water, decks and steps are distinguished before connectivity is computed', () => {
  const n = SEGMENT_SIZE;
  const primary = new Uint8Array(n * n).fill(24);
  const grid = (id, window) => ({...window, width: 16, classes: new Uint8Array(256).fill(id),
    confidence: new Uint8Array(256).fill(210)});
  const full = grid(21, {left: 0, top: 0, size: n});
  const windows = reviewWindows(primary, full);
  assert.equal(windows.length, 2);
  const crops = [grid(140, windows[0]), grid(21, windows[1])];
  assert.ok(hasWaterDeckConflict(primary, full, crops));
  const labels = reconcileScene(primary, full, crops);
  assert.equal(labels[450*n+100], PATH);
  assert.equal(labels[450*n+400], WATER);
  const {mask} = connectedRoad(labels, n, n);
  assert.equal(mask[450*n+100], 1);
  assert.equal(mask[450*n+400], 0);
  const stairway = reconcileScene(primary, grid(53, full), []);
  assert.equal(stairway[450*n+100], STEPS);
  assert.equal(connectedRoad(stairway, n, n).count, 0);
});
