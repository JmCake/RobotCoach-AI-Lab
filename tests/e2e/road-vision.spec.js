import {test, expect} from '@playwright/test';

test('the boardwalk stays connected, river readings abstain on roughness, and a point correction can be reopened', async ({page}) => {
  const analyze = page.locator('#analyze');
  const photo = page.locator('#photo');
  const correction = page.locator('#corrections summary');
  await page.goto('/experiments/road-vision.html?sample=jiuzhaigou');
  await analyze.click();
  await expect(analyze).toHaveText('已完成识别', {timeout: 45000});
  await expect(page.locator('#pointReading')).toHaveText('步道 · 可通行候选');
  await expect(page.locator('#objects')).not.toContainText('汽车');
  const box = await photo.boundingBox();
  await photo.click({position: {x: box.width * .36, y: box.height * .84}});
  await expect(page.locator('#pointReading')).toHaveText('草地 · 未确认可通行');
  await photo.click({position: {x: box.width * .2, y: box.height * .58}});
  await expect(page.locator('#pointReading')).toHaveText('水面');
  await expect(page.locator('#rough')).toHaveText('水下看不清');
  await correction.click();
  await page.locator('#correctClass').selectOption('水面或积水');
  await page.locator('#saveNote').click();
  await expect(page.locator('#noteStatus')).toContainText('已保存在此浏览器');

  await page.reload();
  await analyze.click();
  await expect(analyze).toHaveText('已完成识别', {timeout: 45000});
  await correction.click();
  await page.locator('#savedPoints').selectOption({index: 1});
  await expect(page.locator('#pointReading')).toHaveText('水面');
  await expect(page.locator('#correctClass')).toHaveValue('水面或积水');
  await page.locator('#deleteNote').click();
  await expect(page.locator('#savedNotes')).toBeHidden();
});
