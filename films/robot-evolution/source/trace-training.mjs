// Replay the recorded choices at the original 120 Hz. The film uses these
// poses to register the painted character, independent of the classroom UI.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {ShortCourse, observationState} from '../../../assets/motion/short-course.js';
import {makePose} from '../../../assets/motion/rig.js';

const file = name => new URL(name, import.meta.url);
const log = JSON.parse(readFileSync(file('training-takes.json'), 'utf8'));
const traces = {};
const rounded = x => Number(x.toFixed(5));
// The native comparison movie ends the seventh take in flight. The painted
// cut continues that same recorded episode through touchdown and the next step.
const extensions = {rule:446, r7:469, r246:587, test:580};

for (const name of log.order) {
  const clip = log.clips[name];
  const episode = new ShortCourse(clip.seed);
  const world = episode.world;
  const trace = [];
  const through = Math.max(clip.film.through, extensions[name] ?? 0);
  assert.ok(through <= clip.steps.at(-1).end);
  let decision = 0;
  for (let tick = 0; tick <= through; tick++) {
    if (tick >= clip.film.from) {
      const pose = makePose(world);
      const feet = pose.legs.flatMap(leg => [leg.ankle.x - world.x, leg.ankle.h, Number(leg.contact)]);
      trace.push([world.x, world.y, world.phase, world.crouch, pose.hip.h, pose.angle, ...feet].map(rounded));
      const sensors = clip.signals[tick];
      assert.equal(sensors[4], world.observation.contact.feet.filter(Boolean).length);
      assert.equal(sensors[5], Math.round(world.crouch * 100));
      const event = clip.events.find(e => e.t === tick);
      if (event) assert.equal(rounded(world.x), event.x);
    }
    if (tick === through) break;
    const result = episode.tick(o => {
      const step = clip.steps[decision];
      assert.equal(Math.round(o.time * log.rate), step.t);
      assert.equal(observationState(o), step.state);
      if (o.obstacle) assert.equal(rounded(o.obstacle.distance), step.distance);
      return step.action;
    });
    if (result) {
      const step = clip.steps[decision++];
      assert.equal(rounded(result.reward), step.reward);
      assert.equal(result.rejected, step.rejected);
      assert.equal(Math.round(world.time * log.rate), step.end);
    }
  }
  assert.equal(trace.length, through - clip.film.from + 1);
  traces[name] = trace;
}
const fields = ['worldX','jumpHeight','stridePhase','crouch','hipHeight','bodyAngle',
  'farAnkleXFromHip','farAnkleHeight','farFootPlanted','nearAnkleXFromHip','nearAnkleHeight','nearFootPlanted'];
const count = Object.values(traces).reduce((n, frames) => n + frames.length, 0);
assert.equal(count, log.frames + Object.entries(extensions).reduce(
  (sum, [name, end]) => sum + end - log.clips[name].film.through, 0));
writeFileSync(file('training-motion.json'), JSON.stringify({rate: log.rate, fields, traces}) + '\n');
console.log(`${count} registered physics frames across ${log.order.length} replays`);
