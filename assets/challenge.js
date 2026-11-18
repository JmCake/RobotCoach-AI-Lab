import {ChallengeWorld,ChallengeLearner,ClonePolicy,ALL_SENSORS,ENVIRONMENTS,TRAIN_SEEDS,TEST_SEEDS_V2,observe,fuse,rulePolicy,observationState,demonstrations,trainQ,evaluateChallenge} from './challenge-engine.js';
import {drawRunner} from './runner-render.js';
import {load,storageNotice} from './state.js';
import {sensors} from './sensors.js';
const KEY='robotcoach:challenge:v2',VERSION=1,$=id=>document.getElementById(id);
const names={rule:'规则控制',clone:'行为克隆',q:'Q-learning'};
function read(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d?.version!==VERSION)return {};for(const k of ['q','clone','config','training'])if(!d[k]||typeof d[k]!=='object')d[k]={};d.results=Array.isArray(d.results)?d.results.filter(r=>r&&ENVIRONMENTS[r.environment]&&names[r.policy]&&['successRate','collisions','meanPassed','completion'].every(k=>Number.isFinite(r[k]))):[];return d;}catch{return {};}}
let saved=read(),q=new ChallengeLearner(saved.q),clone=new ClonePolicy(saved.clone),records=Array.isArray(saved.records)?saved.records.slice(0,6000):[];
let config={...load().sensors,...saved.config},world=new ChallengeWorld(),running=false,job=null,raf=0,last=0,acc=0,revision=0,lastAction=0;
let results=Array.isArray(saved.results)?saved.results:[],lastRun=saved.lastRun||null,training=saved.training||{};
// Only V2 writes this key. Legacy course progress and V1 Q tables are untouched.
function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:VERSION,q:q.snapshot(),clone:clone.snapshot(),records,config,environment:$('environment').value,policy:$('policy').value,seed:Number($('challengeSeed').value),training,results,lastRun}));}catch{storageNotice(false);}}
function feedback(t){$('challengeFeedback').textContent=t;}
function controls(){for(const id of ['challengeRun','challengeCompare','cloneTrain','qTrain','environment','policy','challengeSeed','challengeReset'])$(id).disabled=running||!!job;for(const b of $('challengeSensors').querySelectorAll('button'))b.disabled=running||!!job;$('challengeStop').disabled=!running&&!job;}
function sensorUI(){
 $('challengeSensors').replaceChildren();for(const [id,s] of Object.entries(sensors)){const b=document.createElement('button');b.dataset.challengeSensor=id;b.setAttribute('aria-pressed',!!config[id]);b.textContent=`${s.icon} ${s.name}`;b.onclick=()=>{config[id]=!config[id];results=[];sensorUI();renderResults();persist();paint();};$('challengeSensors').append(b);}controls();
}
function stats(){
 $('challengeScore').textContent=`跨过 ${world.passed} 个 · ${Math.round(world.ticks/18)}%`;
 $('challengeAction').textContent=`决策：${['等待','跳跃','下蹲'][lastAction]}`;
 $('cloneStats').textContent=`模仿样本 ${clone.samples} · 留出动作一致率 ${(clone.accuracy*100).toFixed(1)}%`;
 $('qStats').textContent=`试错 ${q.attempts} 轮 · 更新 ${q.updates}`;
 $('challengeTrainingLog').textContent=`模仿采集：${training.cloneSensors?Object.keys(training.cloneSensors).filter(k=>training.cloneSensors[k]).map(k=>sensors[k].name).join('、')||'无感官':'尚未采集'}；试错训练：${training.qSensors?Object.keys(training.qSensors).filter(k=>training.qSensors[k]).map(k=>sensors[k].name).join('、')||'无感官':'尚未训练'}。`+(q.audit.length?`最近更新：动作 ${['等待','跳跃','下蹲'][q.audit.at(-1).action]}，奖励 ${q.audit.at(-1).reward.toFixed(3)}，Q ${q.audit.at(-1).before.toFixed(3)} → ${q.audit.at(-1).after.toFixed(3)}。`:'');
}
function paint(){
 drawRunner($('challengeCanvas'),world);
 const ctx=$('challengeCanvas').getContext('2d');ctx.fillStyle='#ffdb8a';ctx.font='14px system-ui';ctx.fillText(`${world.randomized?'随机训练环境':ENVIRONMENTS[world.environment].name} · 摩擦 ${world.conditions.friction.toFixed(2)} · 光照 ${world.conditions.light.toFixed(2)}`,16,22);
 // Surface marks scroll with travelled distance, making speed and wet patches visible.
 ctx.fillStyle=world.conditions.friction<.8?'#78bfff66':'#ffffff44';for(let i=0;i<8;i++)ctx.fillRect(((i*120-world.distance)%960+960)%960,245,world.conditions.friction<.8?65:26,4);
 const o=observe(world,config),f=fuse(o);$('sensorReadout').textContent=`视觉 ${o.camera?(o.camera.type||'视距内无目标'):'关闭'} · 测距 ${o.lidar?`${o.lidar.low??'—'} / ${o.lidar.high??'—'}`:'关闭'} · IMU ${o.imu?`高度 ${o.imu.height}，速度 ${o.imu.speed}`:'关闭'} · 足底 ${o.force?(o.force.contact?`触地，载荷 ${o.force.load}`:'腾空'):'关闭'} → ${f.source}；距目标 ${f.distance??'—'}`;stats();
}
function stop(message){revision++;running=false;job=null;cancelAnimationFrame(raf);controls();persist();if(message)feedback(message);}
function policies(){return {rule:rulePolicy,clone:o=>clone.choose(o),q:o=>q.choose(observationState(o))};}
function renderResults(){
 $('challengeRows').replaceChildren();$('challengeResults').hidden=!results.length;
 for(const r of results){if(!ENVIRONMENTS[r.environment]||!names[r.policy]||!Number.isFinite(r.successRate))continue;const row=document.createElement('tr');for(const v of [names[r.policy],`${r.successRate}%`,r.collisions,r.meanPassed.toFixed(2),`${(r.completion*100).toFixed(1)}%`]){const cell=document.createElement('td');cell.textContent=v;row.append(cell);}$('challengeRows').append(row);}
 if(results.length){const r=results[0];$('challengeCaption').textContent=`${ENVIRONMENTS[r.environment]?.name||''} · 种子 9001–9020 · 各 20 轮 · ${Object.keys(r.sensors||{}).filter(k=>r.sensors[k]).map(k=>sensors[k]?.name).join('、')||'无感官'} · 比较时模仿 ${r.cloneSamples??0} 样本 / Q ${r.qUpdates??0} 次更新`;} 
}
function runJob(iterator,onComplete,label){
 stop();const token=revision;job=iterator;controls();
 function batch(){if(token!==revision)return;const end=performance.now()+8;let r;
  do{r=iterator.next();if(r.done)break;}while(performance.now()<end);
  if(r.value?.world){world=r.value.world;lastAction=r.value.action;}paint();if(r.done){job=null;onComplete(r.value);controls();persist();return;}
  feedback(`${label}，${r.value?.decisions?`已执行 ${r.value.decisions} 次决策`:'正在处理真实观测与动作'}；可暂停，已发生的更新保留。`);raf=requestAnimationFrame(batch);
 }
 raf=requestAnimationFrame(batch);
}
$('challengeRun').onclick=()=>{
 const policy=$('policy').value;if(policy==='clone'&&!clone.tree)return feedback('请先采集示范并训练模仿，当前模型尚未训练。');
 const seed=Number($('challengeSeed').value);if(!Number.isInteger(seed)||seed<1||seed>4294967295)return feedback('赛道种子请输入 1–4294967295 的整数。');
 stop();world=new ChallengeWorld(seed,$('environment').value);running=true;controls();last=performance.now();acc=0;
 const choose=policies()[policy],runConfig={...config};feedback(`正在使用${names[policy]}；冻结运行不更新模型。`);
 function tick(now){if(!running)return;acc+=Math.min(now-last,100);last=now;while(acc>=1000/15&&!world.done){lastAction=choose(observe(world,runConfig));world.step(lastAction);acc-=1000/15;}paint();
  if(world.done){lastRun={environment:world.environment,policy,sensors:runConfig,seed,success:world.success,passed:world.passed,ticks:world.ticks,reason:world.reason};stop(`${world.reason}；跨过 ${world.passed} 个，完成 ${(world.ticks/18).toFixed(1)}%。当前策略未更新，可换配置后复跑同一种子。`);return;}
  raf=requestAnimationFrame(tick);
 }raf=requestAnimationFrame(tick);
};
$('challengeStop').onclick=()=>{stop('已暂停，已完成的训练更新与示范保留。挑战可按相同种子重新运行。');stats();};
$('cloneTrain').onclick=()=>{
 records=[];clone=new ClonePolicy();results=[];renderResults();training.cloneSensors={...config};let count=0;
 const source=demonstrations({...config},TRAIN_SEEDS,(w,action)=>{world=w;lastAction=action;});function* collect(){for(const r of source){if(count++%3===0&&records.length<6000)records.push(r);yield {decisions:count};}}
 runJob(collect(),()=>{clone.fit(records);feedback(`行为克隆已训练：${records.length} 条真实观测与专家动作，${clone.samples} 条用于训练；留出动作一致率 ${(clone.accuracy*100).toFixed(1)}%。请运行挑战检验任务表现。`);stats();},'正在采集专家示范');
};
$('qTrain').onclick=()=>{results=[];renderResults();training.qSensors={...config};runJob(trainQ(q,100000,{...config},42+q.updates),()=>{feedback(`自主试错完成，累计 ${q.updates} 次真实奖励更新、${q.attempts} 个完整轮次；可冻结比较。未读取专家示范。`);stats();},'正在独立 Q-learning');};
$('challengeCompare').onclick=()=>{
 const selected={...config},environment=$('environment').value,cloneSamples=clone.samples,qUpdates=q.updates;
 runJob(evaluateChallenge(policies(),selected,[environment]),value=>{results=value.map(r=>({...r,cloneSamples,qUpdates}));renderResults();feedback('固定条件比较完成。成功率、碰撞与完成进度来自实际运行；未训练策略也如实参与。');},'正在比较三份冻结策略');
};
$('challengeReset').onclick=()=>{stop();q=new ChallengeLearner();clone=new ClonePolicy();records=[];training={};results=[];lastRun=null;persist();stats();renderResults();feedback('V2 模仿、Q 表和成绩已清空。原有课程进度与 V1 训练仍保留。');};
$('challengeExport').onclick=()=>{
 const data={version:VERSION,protocol:{trainSeeds:TRAIN_SEEDS,testSeeds:TEST_SEEDS_V2,actions:['等待','跳跃','下蹲'],clone:'supervised decision tree',q:'independent tabular Q-learning'},training,observations:records,q:q.snapshot(),clone:clone.snapshot(),results,lastRun};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='robotcoach-v2-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
for(const id of ['environment','policy','challengeSeed'])$(id).onchange=()=>{persist();if(id==='environment'){world=new ChallengeWorld(Number($('challengeSeed').value)||9001,$('environment').value);paint();}};
function pause(){if(running||job){stop('已离开实验，运行与训练暂停；返回后可继续训练或重新运行挑战。');stats();}}
document.getElementById('designActivity').addEventListener('toggle',e=>{if(e.target.open)pause();});
document.addEventListener('coursevisibility',e=>{if(e.detail)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
window.addEventListener('storage',e=>{if(e.key!==KEY)return;revision++;running=false;job=null;cancelAnimationFrame(raf);saved=read();q=new ChallengeLearner(saved.q);clone=new ClonePolicy(saved.clone);records=Array.isArray(saved.records)?saved.records.slice(0,6000):[];training=saved.training||{};results=saved.results||[];lastRun=saved.lastRun||null;config={...ALL_SENSORS,...saved.config};sensorUI();renderResults();paint();feedback('另一标签页更新了 V2 数据，已同步并暂停。');});
if(ENVIRONMENTS[saved.environment])$('environment').value=saved.environment;if(names[saved.policy])$('policy').value=saved.policy;if(Number.isInteger(saved.seed))$('challengeSeed').value=saved.seed;
world=new ChallengeWorld(Number($('challengeSeed').value),$('environment').value);sensorUI();renderResults();paint();if(lastRun)feedback(`上次：${lastRun.reason}，跨过 ${lastRun.passed} 个；可用相同种子重新验证。`);
