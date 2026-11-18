import {test,expect} from '@playwright/test';
const frame=page=>page.frameLocator('#experiment');

test('navigating away before the periodic save preserves the latest actual Q updates',async({page})=>{
 await page.goto('/#training');
 await frame(page).getByRole('button',{name:'开始',exact:true}).click();
 await expect.poll(async()=>Number(await frame(page).locator('#updates').textContent())).toBeGreaterThan(3);
 const updates=Number(await frame(page).locator('#updates').textContent());
 await page.getByRole('button',{name:'三 · AI闭环'}).click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')));
 expect(saved?.updates||0).toBeGreaterThanOrEqual(updates);
 await page.goto('/#training');
 await expect.poll(async()=>Number(await frame(page).locator('#updates').textContent())).toBeGreaterThanOrEqual(updates);
});

for(const mode of ['manual','showcase'])test(`${mode} tab cannot overwrite a newer training session`,async({page,context})=>{
 await page.goto('/#'+mode);
 await expect(frame(page).locator('#feedback')).not.toBeEmpty();
 const training=await context.newPage();
 await training.goto('/#training');
 await frame(training).getByRole('button',{name:'开始',exact:true}).click();
 await frame(training).getByLabel('训练速度').selectOption('8');
 await expect.poll(async()=>Number(await frame(training).locator('#updates').textContent())).toBeGreaterThan(100);
 await frame(training).getByRole('button',{name:'暂停',exact:true}).click();
 const saved=await training.evaluate(()=>localStorage.getItem('robotcoach:q:v1'));
 await frame(page).getByRole('button',{name:'开始',exact:true}).click();
 await frame(page).getByRole('button',{name:'暂停',exact:true}).click();
 expect(await page.evaluate(()=>localStorage.getItem('robotcoach:q:v1'))).toBe(saved);
 await page.goto('/#design');
 expect(await page.evaluate(()=>localStorage.getItem('robotcoach:q:v1'))).toBe(saved);
});

test('arrow controls remain effective after focus moves to a manual action button',async({page})=>{
 await page.goto('/#manual');const f=frame(page);
 const greenTop=()=>f.locator('#game').evaluate(c=>{const {data}=c.getContext('2d').getImageData(40,0,100,235);for(let y=0;y<235;y++)for(let x=0;x<100;x++){const i=(y*100+x)*4;if(data[i]<50&&data[i+1]>180&&data[i+2]<80)return y;}return 235;});
 await expect(f.locator('#feedback')).not.toBeEmpty();const standing=await greenTop();
 await f.getByRole('button',{name:'开始',exact:true}).click();
 await f.getByRole('button',{name:'↑ 跳跃'}).press('ArrowUp');
 await expect.poll(greenTop,{timeout:1500}).toBeLessThan(standing-10);
});

test('disabled feedback cannot move the robot back to perception during the action stage',async({page})=>{
 await page.goto('/#fault');const f=frame(page);
 await f.getByRole('button',{name:'关闭反馈回路',exact:true}).click();
 await f.getByRole('button',{name:'运 行'}).click();
 await expect(f.getByRole('status')).toHaveText('信息正在通过：行动');
 await page.waitForTimeout(180);
 const distance=await f.locator('#robot').evaluate(robot=>{
  const c=document.getElementById('canvas').getBoundingClientRect(),a=document.getElementById('nodeAction').getBoundingClientRect();
  return Math.hypot(parseFloat(robot.style.left)-(a.left+a.width/2-c.left),parseFloat(robot.style.top)-(a.top+a.height/2-c.top));
 });
 expect(distance).toBeLessThan(1);
 await expect(f.getByRole('status')).toContainText('反馈回路断开');
});

test('unchanged imitation environment completes the demonstration and restores its real feedback',async({page})=>{
 await page.goto('/#imitation');const f=frame(page);
 await f.getByRole('button',{name:'观看模仿演示'}).click();
 await expect(f.getByRole('status')).toContainText('相同环境中，回放示范动作也能跨过障碍',{timeout:15000});
 await page.reload();
 await expect(frame(page).getByRole('status')).toContainText('相同环境中，回放示范动作也能跨过障碍');
});
