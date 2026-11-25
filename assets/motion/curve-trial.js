import {MotionWorld, COURSE_DISTANCE, DEFAULT_SPEED} from './world.js';

// Both classroom views use the same physical bend and the same saved-run identity.
export const CURVE_TRIAL=Object.freeze({
  scene:'curve', seed:2026, distance:COURSE_DISTANCE, target:DEFAULT_SPEED,
  controller:'motion-rule-v1', layout:'stadium-semicircle-v1', physics:'turn-load-v2',
});

export const MEASURE_ONLY_TRIAL=Object.freeze({...CURVE_TRIAL,controller:'motion-rule-v1:imu-monitor-only'});

// A probe still reads the installed IMU. Disconnecting its line to the
// controller changes only the observation passed to the existing rules.
class MeasurementTrial extends MotionWorld{
  decide(observation,action){return super.decide({...observation,imu:null},action);}
}

export function createCurveTrial(sensors,measureOnly=false){
  const Trial=measureOnly?MeasurementTrial:MotionWorld;
  return new Trial({...CURVE_TRIAL,sensors,repeat:false});
}
