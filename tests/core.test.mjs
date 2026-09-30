import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, GROUPS, byId, inGroup, HERO_LOGO_POSITIONS, ICO_SIZES } from '../app/js/presets.js';
import { writeIco, readIco } from '../app/js/ico.js';
import { coverRect, containRect, overlayRect, fitSize, heroLogoRect, downscaleSteps, formatBytes, fileName, POSITIONS } from '../app/js/crop.js';
import { writeZip, readZip, crc32 } from '../app/js/zip.js';
import { STRINGS } from '../app/js/i18n.js';

test('presets are well formed', () => {
  const ids = new Set();
  for (const p of PRESETS) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`); ids.add(p.id);
    assert.ok(GROUPS.includes(p.group), p.id);
    assert.ok(p.w > 0 && p.h > 0 && Number.isInteger(p.w) && Number.isInteger(p.h), p.id);
    assert.ok(p.display[0] <= p.w && p.display[1] <= p.h, `${p.id} display larger than upload size`);
    assert.ok(p.formats.length && p.formats.every((f) => ['jpg', 'png', 'ico'].includes(f)), p.id);
    if (p.mode === 'fit') assert.deepEqual(p.formats, ['png'], `${p.id}: logos need transparency`);
    if (p.steamName) assert.ok(p.steamName.includes('{id}'), p.id);
    if (p.legacy) assert.ok(Math.abs(p.legacy[0] / p.legacy[1] - p.w / p.h) < 0.01, `${p.id} legacy aspect differs`);
    if (p.safe) assert.ok(p.safe.every((v) => v >= 0 && v <= 1), p.id);
    assert.ok(STRINGS.en[`asset.${p.id}`], `missing EN name for ${p.id}`);
    assert.ok(STRINGS.en[`hint.${p.id}`], `missing EN hint for ${p.id}`);
  }
  assert.equal(byId('header').w, 920);
  assert.equal(inGroup('store').length, 9);
  assert.deepEqual(inGroup('custom').map((p) => p.steamName), ['{id}p', '{id}', '{id}_hero', '{id}_logo', '{id}_icon']);
  assert.equal(HERO_LOGO_POSITIONS.length, 4);
  const safe = byId('libhero').safe; assert.ok(Math.abs(safe[2] * 1920 - 860) < 1e-9 && Math.abs(safe[3] * 620 - 380) < 1e-9);
});

test('coverRect keeps the target aspect and stays inside the source', () => {
  const r = coverRect(4000, 3000, 920, 430);
  assert.equal(r.w, 4000); assert.ok(Math.abs(r.w / r.h - 920 / 430) < 1e-9); assert.equal(r.x, 0);
  assert.ok(Math.abs(r.y - (3000 - r.h) / 2) < 1e-9, 'centred by default');
  const tall = coverRect(1000, 3000, 600, 900);
  assert.equal(tall.w, 1000); assert.equal(tall.h, 1500);
  // focus at the top-left pins the rect to the corner, focus at the bottom-right to the other corner
  const tl = coverRect(4000, 3000, 920, 430, { focus: { x: 0, y: 0 } });
  assert.equal(tl.y, 0);
  const br = coverRect(4000, 3000, 920, 430, { focus: { x: 1, y: 1 } });
  assert.ok(Math.abs(br.y + br.h - 3000) < 1e-9);
  // zoom halves the rect around the focus, pan shifts it, and both stay inside the image
  const z = coverRect(4000, 3000, 1000, 1000, { focus: { x: 0.5, y: 0.5 }, zoom: 2 });
  assert.equal(z.w, 1500); assert.equal(z.h, 1500); assert.equal(z.x, 1250); assert.equal(z.y, 750);
  const pan = coverRect(4000, 3000, 1000, 1000, { zoom: 2, pan: { x: 5, y: -5 } });
  assert.equal(pan.x, 2500); assert.equal(pan.y, 0);
  const upscale = coverRect(100, 100, 920, 430);
  assert.equal(upscale.w, 100); assert.ok(Math.abs(upscale.h - 100 * 430 / 920) < 1e-9);
});

test('containRect and overlayRect place logos', () => {
  const c = containRect(1000, 500, 1280, 720, { padding: 0.1 });
  assert.equal(c.w, 1280 - 144); assert.equal(c.h, (1280 - 144) / 2);
  assert.ok(Math.abs(c.x - 72) < 1e-9); assert.ok(Math.abs(c.y - (72 + (720 - 144 - c.h) / 2)) < 1e-9);
  const bl = overlayRect(800, 200, 920, 430, { position: 'bl', size: 0.5, margin: 0.05 });
  assert.equal(bl.w, 460); assert.equal(bl.h, 115); assert.equal(bl.x, 21.5); assert.equal(bl.y, 430 - 21.5 - 115);
  const c2 = overlayRect(800, 200, 920, 430, { position: 'c', size: 0.5, margin: 0 });
  assert.equal(c2.x, 230); assert.equal(c2.y, (430 - 115) / 2);
  assert.equal(POSITIONS.length, 9);
  assert.throws(() => overlayRect(1, 1, 1, 1, { position: 'zz' }));
});

test('fitSize and heroLogoRect', () => {
  assert.deepEqual(fitSize(2000, 500, 1280, 720), [1280, 320]);
  assert.deepEqual(fitSize(500, 1000, 1280, 720), [360, 720]);
  const bl = heroLogoRect(1000, 250, 1920, 620, 'BottomLeft');
  assert.ok(Math.abs(bl.x - 76.8) < 1e-9); assert.ok(Math.abs(bl.y + bl.h - (620 - 49.6)) < 1e-9);
  const cc = heroLogoRect(1000, 250, 1920, 620, 'CenterCenter');
  assert.ok(Math.abs(cc.x + cc.w / 2 - 960) < 1e-9); assert.ok(Math.abs(cc.y + cc.h / 2 - 310) < 1e-9);
  const tall = heroLogoRect(100, 1000, 1920, 620, 'UpperCenter');
  assert.ok(Math.abs(tall.h - 372) < 1e-9, 'tall logos are capped at 60% of the hero height');
});

test('ico round trip', () => {
  const png = (n) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, n]);
  const ico = writeIco(ICO_SIZES.map((size) => ({ size, png: png(size & 0xff) })));
  assert.deepEqual([...ico.subarray(0, 6)], [0, 0, 1, 0, ICO_SIZES.length, 0]);
  const back = readIco(ico);
  assert.deepEqual(back.map((e) => e.size), ICO_SIZES);
  assert.deepEqual([...back[back.length - 1].data], [...png(0)]);
  assert.throws(() => readIco(new Uint8Array(8)));
});

test('downscaleSteps halves until close, then resizes once', () => {
  assert.deepEqual(downscaleSteps(4000, 2000, 920, 430), [[2000, 1000], [1000, 500], [920, 430]]);
  assert.deepEqual(downscaleSteps(920, 430, 920, 430), []);
  assert.deepEqual(downscaleSteps(500, 500, 920, 430), [[920, 430]]);
});

test('formatBytes and fileName', () => {
  assert.equal(formatBytes(512), '512 B'); assert.equal(formatBytes(2048), '2.0 KB'); assert.equal(formatBytes(3 * 1024 * 1024), '3.00 MB');
  assert.equal(fileName('My Game: Deluxe!', byId('header'), 'jpg'), 'my-game-deluxe_header_920x430.jpg');
  assert.equal(fileName('   ', byId('icon'), 'png'), 'game_icon_256x256.png');
});

test('zip round trip with correct CRCs', () => {
  const a = new TextEncoder().encode('hello zip'), b = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  const zip = writeZip([{ name: 'a.txt', data: a }, { name: 'dir/b.png', data: b }]);
  assert.equal(zip[0], 0x50); assert.equal(zip[1], 0x4b);
  const back = readZip(zip);
  assert.deepEqual(back.map((e) => e.name), ['a.txt', 'dir/b.png']);
  assert.deepEqual([...back[0].data], [...a]); assert.deepEqual([...back[1].data], [...b]);
  assert.equal(back[0].crc, crc32(a)); assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('i18n: English and Turkish have the same keys', () => {
  const en = Object.keys(STRINGS.en).sort(), tr = Object.keys(STRINGS.tr).sort();
  assert.deepEqual(tr, en);
});
