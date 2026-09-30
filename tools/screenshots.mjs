// README screenshots: paints a demo key art and logo in the page, loads them through the real
// file inputs, then captures the dark and light themes.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const exe = process.env.PW_CHROMIUM_PATH;
const OUT = process.env.OUT || 'docs/img';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

// a night landscape: gradient sky, stars, planet, layered mountains, a small ship
const ART = () => {
  const W = 3200, H = 1800, c = new OffscreenCanvas(W, H), x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0b1026'); sky.addColorStop(0.55, '#2a3b7a'); sky.addColorStop(0.8, '#e0766b'); sky.addColorStop(1, '#f6c26b');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; const r = rnd() * 2.6 + 0.4; x.beginPath(); x.arc(rnd() * W, rnd() * H * 0.6, r, 0, 7); x.fill(); }
  const pg = x.createRadialGradient(2350, 520, 40, 2400, 560, 330); pg.addColorStop(0, '#ffe2b8'); pg.addColorStop(0.6, '#e98d6b'); pg.addColorStop(1, '#6a3f7a');
  x.fillStyle = pg; x.beginPath(); x.arc(2400, 560, 300, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,230,200,.55)'; x.lineWidth = 10; x.beginPath(); x.ellipse(2400, 560, 520, 90, -0.25, 0, 7); x.stroke();
  const layers = [['#3a2f6b', 0.62, 0.12], ['#271f4f', 0.7, 0.1], ['#171236', 0.8, 0.08], ['#0c0a22', 0.9, 0.06]];
  for (const [col, base, amp] of layers) {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
    for (let px = 0; px <= W; px += 40) x.lineTo(px, H * base - Math.abs(Math.sin(px / 260 + base * 9) * H * amp) - Math.sin(px / 90 + base * 3) * H * 0.012);
    x.lineTo(W, H); x.fill();
  }
  x.save(); x.translate(1450, 780); x.rotate(-0.18);
  x.fillStyle = '#f2ede2'; x.beginPath(); x.moveTo(90, 0); x.lineTo(-60, -34); x.lineTo(-38, 0); x.lineTo(-60, 34); x.closePath(); x.fill();
  const fl = x.createLinearGradient(-40, 0, -260, 0); fl.addColorStop(0, 'rgba(102,192,244,.9)'); fl.addColorStop(1, 'rgba(102,192,244,0)');
  x.fillStyle = fl; x.fillRect(-260, -10, 222, 20); x.restore();
  return c.convertToBlob({ type: 'image/png' });
};
const LOGO = async () => {
  await document.fonts.load('600 200px "IBM Plex Sans"');
  const c = new OffscreenCanvas(1800, 420), x = c.getContext('2d');
  x.font = '600 190px "IBM Plex Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round'; x.lineWidth = 26; x.strokeStyle = '#0c0a22'; x.strokeText('STAR DRIFTER', 900, 200);
  const g = x.createLinearGradient(0, 110, 0, 290); g.addColorStop(0, '#fff6e6'); g.addColorStop(1, '#f6c26b');
  x.fillStyle = g; x.fillText('STAR DRIFTER', 900, 200);
  return c.convertToBlob({ type: 'image/png' });
};

async function shoot(theme) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4175/?nosw=1');
  await page.evaluate((theme) => { localStorage.clear(); localStorage.setItem('sak:ui', JSON.stringify({ theme, lang: 'en', game: 'Star Drifter', appid: '', overlay: true, logoPos: 'bl', logoSize: 48 })); }, theme);
  await page.reload();
  const toBuf = async (fn) => Buffer.from(await page.evaluate(async (src) => { const b = await (0, eval)(`(${src})`)(); return [...new Uint8Array(await b.arrayBuffer())]; }, fn.toString()));
  await page.locator('#file-art').setInputFiles({ name: 'star-drifter-key-art.png', mimeType: 'image/png', buffer: await toBuf(ART) });
  await page.waitForFunction(() => document.querySelector('#art-info').textContent.includes('3200'));
  await page.locator('#file-logo').setInputFiles({ name: 'star-drifter-logo.png', mimeType: 'image/png', buffer: await toBuf(LOGO) });
  await page.waitForFunction(() => document.querySelector('#logo-info').textContent.includes('1800'));
  // focus on the ship
  const box = await page.locator('#art-thumb').boundingBox();
  await page.mouse.click(box.x + box.width * 0.44, box.y + box.height * 0.45);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${theme}.png` });
  if (theme === 'dark') {
    await page.locator('.group-sec[data-group="library"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -20));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/library.png` });
  }
  await page.close();
  console.log('wrote', theme);
}
await shoot('dark');
await shoot('light');
await browser.close();
