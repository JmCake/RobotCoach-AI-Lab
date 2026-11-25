import {test, expect} from '@playwright/test';

test('the same IMU unlocks the bend story only after a successful controlled run', async ({page}) => {
  const button = name => page.getByRole('button', {name});
  await page.goto('/story.html');
  await button('直接观察定格').click();
  await expect(button('让初代机实跑一次')).toBeDisabled();
  const guess = '我想看它歪过去时能不能自己扶正。';
  await page.getByText('我有别的猜想', {exact:true}).click();
  await page.getByRole('textbox', {name:'写下自己的猜想'}).fill(guess);
  await button('让初代机实跑一次').click();
  await expect(page.locator('#controls')).toContainText(guess);
  await button('进入维修舱').click();

  await button(/姿态传感器 IMU/).click();
  await button('仅测量').click();
  await button('用这套配置重跑').click();
  await expect(page.locator('#liveControl')).toContainText('无扶正指令');
  await expect(button('调整配置再试')).toBeVisible();
  await page.reload();
  await expect(button('回到赛场看过弯')).toHaveCount(0);
  await expect(page.locator('#controls')).toContainText('控制器没有收到');

  await button('调整配置再试').click();
  await button('接入控制器').click();
  await button('用这套配置重跑').click();
  await expect(button('回到赛场看过弯')).toBeVisible();
  const {baseline, runs} = await page.evaluate(() => JSON.parse(localStorage.getItem('robotcoach:v1')).bendStory);
  const [measured, controlled] = runs;
  expect(controlled.guessText).toBe(guess);
  expect(measured.result.sensors).toEqual(controlled.result.sensors);
  expect(measured.result.distance).toBe(baseline.result.distance);
  expect(measured).toMatchObject({correction:false, result:{success:false}});
  expect(controlled).toMatchObject({correction:true, result:{success:true, distance:40}});
  expect(measured.tilt).toBeGreaterThan(controlled.tilt);

  await button('回到赛场看过弯').click();
  await expect(page.locator('#movie')).toBeVisible();
  await expect(button('查看后续课程地图')).toBeVisible();
});
