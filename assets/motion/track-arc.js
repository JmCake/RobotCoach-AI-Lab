// Distances follow the centre lane; positive offsets point toward the bend centre.
export const trialBend=Object.freeze({start:4,length:32});

export function arcCurvature(bend,distance){
  return distance>=bend.start&&distance<bend.start+bend.length?Math.PI/bend.length:0;
}

export function trackPoint(bend,distance,offset=0){
  const radius=bend.length/Math.PI;
  const along=distance-bend.start;
  const angle=Math.PI*Math.max(0,Math.min(1,along/bend.length));
  const sin=Math.sin(angle),cos=Math.cos(angle);
  const straight=along<0?along:Math.max(0,along-bend.length);
  return {x:bend.start+(radius-offset)*sin+straight*cos,
    z:radius*(1-cos)+offset*cos+straight*sin,cos,sin};
}
