import { test, expect } from '@playwright/test';
import { ART, LOGO, pngSize } from './fixtures.mjs';
import { readZip } from '../../app/js/zip.js';
import { readIco } from '../../app/js/ico.js';
import fs from 'node:fs';

async function fresh(page) {
  await page.goto('/?nosw=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__sak);
}
async function addArt(page) {
  await page.locator('#file-art').setInputFiles({ name: 'Hero Art.png', mimeType: 'image/png', buffer: ART });
  await expect(page.locator('#art-info')).toHaveText('2400 × 1350 px');
}
async function addLogo(page) {
  await page.locator('#file-logo').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: LOGO });
  await expect(page.locator('#logo-info')).toHaveText('800 × 200 px');
}
const card = (page, id) => page.locator(`.card[data-id="${id}"]`);
const rect = (page, id) => page.evaluate((id) => window.__sak.srcRect(id), id);
async function file(page, id, fmt) { return Buffer.from(await page.evaluate(([id, fmt]) => window.__sak.renderFile(id, fmt), [id, fmt])); }
async function pixelOf(page, buf, x, y) {
  return page.evaluate(async ([b64, x, y]) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height); const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
    return [...ctx.getImageData(x, y, 1, 1).data];
  }, [buf.toString('base64'), x, y]);
}

test.beforeEach(async ({ page }) => { await fresh(page); });

test('starts empty, then shows every target once an artwork is added', async ({ page }) => {
  await expect(page).toHaveTitle('Steam Art Kit');
  await expect(page.locator('#main-empty')).toBeVisible();
  await expect(page.locator('#btn-zip')).toBeDisabled();
  await addArt(page);
  await expect(page.locator('#art-info')).toHaveText('2400 × 1350 px');
  await expect(page.locator('.card')).toHaveCount(20);
  await expect(page.locator('.group-sec h2')).toHaveCount(4);
  await expect(card(page, 'header').locator('.card-dims')).toHaveText('920 × 430');
  await expect(card(page, 'liblogo').locator('.card-warn')).toHaveText('Add a logo to make this one.');
  await expect(page.locator('#btn-zip')).toBeEnabled();
  await expect(page.locator('#export-count')).toContainText('18 files', { timeout: 15000 });
});

test('every exported file has the exact Steam size', async ({ page }) => {
  await addArt(page);
  await addLogo(page);
  for (const [id, w, h] of [['header', 920, 430], ['small', 462, 174], ['main', 1232, 706], ['vertical', 748, 896], ['background', 1920, 1080], ['libcapsule', 600, 900], ['libhero', 3840, 1240], ['eventheader', 1920, 622], ['hero', 1920, 620], ['grid', 600, 900]]) {
    const buf = await file(page, id, 'png');
    expect(pngSize(buf), id).toEqual([w, h]);
  }
  expect(pngSize(await file(page, 'liblogo', 'png')), 'logo is fitted, not padded').toEqual([1280, 320]);
  const jpg = await file(page, 'header', 'jpg');
  expect([jpg[0], jpg[1], jpg[2]]).toEqual([0xff, 0xd8, 0xff]);
  const ico = readIco(new Uint8Array(await file(page, 'clienticon', 'ico')));
  expect(ico.map((e) => e.size)).toEqual([16, 24, 32, 48, 64, 256]);
  expect(pngSize(Buffer.from(ico[2].data))).toEqual([32, 32]);
});

test('the focus point moves every crop', async ({ page }) => {
  await addArt(page);
  const centred = await rect(page, 'libcapsule');
  expect(Math.round(centred.x + centred.w / 2)).toBe(1200);
  // click near the right edge of the artwork thumbnail
  const box = await page.locator('#art-thumb').boundingBox();
  await page.mouse.click(box.x + box.width * 0.95, box.y + box.height * 0.1);
  const moved = await rect(page, 'libcapsule');
  expect(Math.round(moved.x + moved.w)).toBe(2400);
  // the vertical capsule now shows the green corner in its top right
  const buf = await file(page, 'libcapsule', 'png');
  expect(await pixelOf(page, buf, 590, 10)).toEqual([0, 200, 0, 255]);
});

test('dragging a card pans its crop, zoom and reset work', async ({ page }) => {
  await addArt(page);
  const before = await rect(page, 'libcapsule');
  const prev = card(page, 'libcapsule').locator('.card-preview');
  await prev.scrollIntoViewIfNeeded();
  const b = await prev.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2, { steps: 5 }); await page.mouse.up();
  const after = await rect(page, 'libcapsule');
  expect(after.x).toBeLessThan(before.x);
  expect(await rect(page, 'header'), 'other cards are unaffected').toEqual(await page.evaluate(() => window.__sak.srcRect('header')));
  await card(page, 'libcapsule').locator('.card-zoom').fill('200');
  const zoomed = await rect(page, 'libcapsule');
  expect(Math.round(zoomed.w)).toBe(Math.round(before.w / 2));
  await card(page, 'libcapsule').locator('.card-reset').click();
  expect(await rect(page, 'libcapsule')).toEqual(before);
});

test('logo overlay is baked into capsules but not into the hero', async ({ page }) => {
  await addArt(page);
  await addLogo(page);
  const plain = await file(page, 'header', 'png');
  await page.locator('#opt-overlay').check();
  await page.locator('#pos-grid button[data-pos="c"]').click();
  const withLogo = await file(page, 'header', 'png');
  expect(await pixelOf(page, plain, 460, 215)).not.toEqual([255, 255, 255, 255]);
  expect(await pixelOf(page, withLogo, 460, 215)).toEqual([255, 255, 255, 255]);
  const hero = await file(page, 'libhero', 'png');
  expect(await pixelOf(page, hero, 1920, 620)).not.toEqual([255, 255, 255, 255]);
  await expect(card(page, 'libhero').locator('.card-info')).toContainText('not baked into the file');
  // logo asset keeps its transparency
  const logo = await file(page, 'liblogo', 'png');
  expect((await pixelOf(page, logo, 2, 2))[3]).toBe(0);
});

test('ZIP holds every file in group folders, with grid-folder names when an app ID is set', async ({ page }) => {
  await addArt(page);
  await addLogo(page);
  await page.locator('#opt-game').fill('Star Drifter');
  await page.locator('#opt-appid').fill('620');
  await card(page, 'screenshot').locator('.card-include').uncheck();
  await page.locator('#opt-legacy').check();
  await expect(page.locator('#export-count')).toContainText('25 files');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-zip').click()]);
  expect(dl.suggestedFilename()).toBe('star-drifter_steam-art.zip');
  const entries = readZip(new Uint8Array(fs.readFileSync(await dl.path())));
  const names = entries.map((e) => e.name);
  expect(names).toHaveLength(25);
  expect(names).toContain('store/star-drifter_header_920x430.png');
  expect(names).toContain('store/legacy/star-drifter_header_460x215.png');
  expect(names).toContain('library/star-drifter_liblogo_1280x320.png');
  expect(names).toContain('custom/grid/620p.png');
  expect(names).toContain('custom/grid/620_hero.png');
  expect(names).toContain('custom/grid/620_logo.png');
  expect(names).toContain('community/star-drifter_clienticon_32x32.ico');
  expect(names.some((n) => n.includes('screenshot'))).toBe(false);
  const legacy = entries.find((e) => e.name === 'store/legacy/star-drifter_header_460x215.png');
  expect(pngSize(Buffer.from(legacy.data))).toEqual([460, 215]);
  await expect(page.locator('#toast')).toHaveText('Done: 25 files.');
});

test('single download, format switch and file size estimate', async ({ page }) => {
  await addArt(page);
  await card(page, 'header').locator('.card-format').selectOption('jpg');
  await expect(card(page, 'header').locator('.card-dims')).toHaveText('920 × 430');
  await expect(card(page, 'header').locator('.card-bytes')).toHaveText(/KB|B$/);
  const [dl] = await Promise.all([page.waitForEvent('download'), card(page, 'header').locator('.card-download').click()]);
  expect(dl.suggestedFilename()).toBe('hero-art_header_920x430.jpg');
  const head = fs.readFileSync(await dl.path()).subarray(0, 3);
  expect([...head]).toEqual([0xff, 0xd8, 0xff]);
});

test('actual-size preview, Turkish, light theme, settings persist, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await addArt(page);
  await page.locator('#opt-actual').check();
  await expect(card(page, 'small').locator('.card-canvas')).toHaveCSS('width', '231px');
  await page.locator('#set-lang').selectOption('tr');
  await expect(page.locator('.group-sec h2 span').first()).toHaveText('Mağaza sayfası');
  await expect(card(page, 'header').locator('.card-title')).toHaveText('Header kapsülü');
  await page.locator('#set-theme').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await page.waitForFunction(() => window.__sak);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#set-lang')).toHaveValue('tr');
  await expect(page.locator('#opt-actual')).toBeChecked();
  expect(errors).toEqual([]);
});
