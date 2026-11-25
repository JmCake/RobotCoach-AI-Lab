// The same quiet stadium bed persists across teaching pauses. The location
// crossfade follows the story clock, including the cut from track to river.
export class LocationSound {
  unlock(){
    if(!this.ctx){
      this.ctx=new AudioContext();const c=this.ctx;
      const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate),a=buffer.getChannelData(0);
      let seed=19;
      for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/2147483648-1;}
      const noise=c.createBufferSource();noise.buffer=buffer;noise.loop=true;
      this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
      const bed=(freq,q)=>{
        const filter=c.createBiquadFilter(),gain=c.createGain();
        filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=q;gain.gain.value=0;
        noise.connect(filter);filter.connect(gain);gain.connect(this.master);return gain;
      };
      this.stands=bed(790,.9);this.stream=bed(2800,.68);noise.start();
    }
    this.ctx.resume().catch(()=>{});
  }
  mix(scene,muted,paused){
    if(!this.ctx)return;
    const now=this.ctx.currentTime,outdoor=['trail','field','field-result'].includes(scene);
    const movie=['opening','ending','black'].includes(scene),indoor=['incident','bench','grid'].includes(scene);
    this.master.gain.setTargetAtTime(muted||paused||movie?0:1,now,.18);
    this.stands.gain.setTargetAtTime(outdoor ? 0 : indoor ? .01 : .043,now,.65);
    this.stream.gain.setTargetAtTime(outdoor ? .078 : 0,now,.9);
  }
  tone(from,to,duration,volume,delay=0){
    if(!this.ctx||this.ctx.state!=='running')return;
    const c=this.ctx,t=c.currentTime+delay,osc=c.createOscillator(),amp=c.createGain();
    osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);
    amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(volume,t+.012);
    amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(amp);amp.connect(this.master);osc.start();osc.stop(t+duration+.02);
  }
}
