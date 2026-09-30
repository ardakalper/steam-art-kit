// Steam Art Kit UI: load an artwork (and optionally a logo), preview every Steam target cropped
// around a focus point, let each card be zoomed and dragged, export files one by one or as a ZIP.
import { PRESETS, GROUPS, ICO_SIZES, HERO_LOGO_POSITIONS, byId, inGroup } from './presets.js';
import { coverRect, fitSize, overlayRect, heroLogoRect, downscaleSteps, formatBytes, fileName, POSITIONS, clamp } from './crop.js';
import { writeZip } from './zip.js';
import { writeIco } from './ico.js';
import { t, setLang, getLang, applyI18n, detectLang } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const UI_KEY = 'sak:ui';
const PREVIEW_MAX = 1600; // long side of the downscaled copy used for live previews
const BIG = 8192;

const ui = Object.assign({
  lang: null, theme: 'dark', game: '', appid: '', format: 'png', quality: 92, bg: '#000000',
  overlay: false, logoPos: 'bl', logoSize: 45, logoMargin: 5, heroPos: 'BottomLeft', actual: false, legacy: false,
}, load());
const state = {
  art: null, logo: null, focus: { x: 0.5, y: 0.5 },
  cards: Object.fromEntries(PRESETS.map((p) => [p.id, { zoom: 1, pan: { x: 0, y: 0 }, format: null, include: true }])),
  bytes: {}, els: {}, busy: false,
};

function load() { try { return JSON.parse(localStorage.getItem(UI_KEY) || '{}'); } catch { return {}; } }
function save() { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch { /* private mode */ } }
let toastTimer;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600); }

// ---------- images ----------
async function decode(file) {
  try { const bmp = await createImageBitmap(file); return { img: bmp, w: bmp.width, h: bmp.height }; } catch { /* SVG and friends */ }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    let w = img.naturalWidth || 1024, h = img.naturalHeight || 1024;
    if (file.type === 'image/svg+xml' && w < 2048) { const s = 2048 / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    const c = canvas(w, h); c.getContext('2d').drawImage(img, 0, 0, w, h);
    return { img: c, w, h };
  } finally { URL.revokeObjectURL(url); }
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function withPreview(src) {
  const s = Math.min(1, PREVIEW_MAX / Math.max(src.w, src.h));
  if (s === 1) return { ...src, prev: src.img, ps: 1 };
  const c = canvas(src.w * s, src.h * s);
  drawScaled(c.getContext('2d'), src.img, { x: 0, y: 0, w: src.w, h: src.h }, 0, 0, c.width, c.height);
  return { ...src, prev: c, ps: c.width / src.w };
}
// Draws r (source rect) into the destination with successive halving for clean downscales.
function drawScaled(ctx, img, r, dx, dy, dw, dh) {
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const steps = downscaleSteps(Math.round(r.w), Math.round(r.h), Math.max(1, Math.round(dw)), Math.max(1, Math.round(dh)));
  let cur = img, cr = r;
  for (const [w, h] of steps.slice(0, -1)) {
    const c = canvas(w, h), x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(cur, cr.x, cr.y, cr.w, cr.h, 0, 0, w, h);
    cur = c; cr = { x: 0, y: 0, w, h };
  }
  ctx.drawImage(cur, cr.x, cr.y, cr.w, cr.h, dx, dy, dw, dh);
}

// ---------- geometry ----------
const isFit = (p) => p.mode === 'fit';
const available = (p) => (isFit(p) ? Boolean(state.logo) : Boolean(state.art));
function srcRect(p) {
  const c = state.cards[p.id];
  return coverRect(state.art.w, state.art.h, p.w, p.h, { focus: state.focus, zoom: c.zoom, pan: c.pan });
}
function outSize(p, legacy = null) {
  if (legacy) return legacy;
  if (isFit(p) && state.logo) return fitSize(state.logo.w, state.logo.h, p.w, p.h);
  return [p.w, p.h];
}
function formatOf(p) {
  const c = state.cards[p.id];
  if (c.format && p.formats.includes(c.format)) return c.format;
  if (p.formats[0] === 'ico') return 'ico'; // the client icon ships as .ico whatever the default format is
  return p.formats.includes(ui.format) ? ui.format : p.formats[0];
}
const overlayOn = (p) => ui.overlay && p.text && state.logo;

// Paints one target into ctx at W×H. `preview` uses the downscaled copies (fast), else the originals.
function paint(ctx, p, W, H, { preview = false, jpgBg = null } = {}) {
  if (jpgBg) { ctx.fillStyle = jpgBg; ctx.fillRect(0, 0, W, H); }
  if (isFit(p)) {
    const L = state.logo, s = preview ? L.ps : 1;
    drawScaled(ctx, preview ? L.prev : L.img, { x: 0, y: 0, w: L.w * s, h: L.h * s }, 0, 0, W, H);
    return;
  }
  const A = state.art, s = preview ? A.ps : 1, r = srcRect(p);
  drawScaled(ctx, preview ? A.prev : A.img, { x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s }, 0, 0, W, H);
  if (overlayOn(p)) {
    const L = state.logo, ls = preview ? L.ps : 1;
    const o = overlayRect(L.w, L.h, W, H, { position: ui.logoPos, size: ui.logoSize / 100, margin: ui.logoMargin / 100 });
    drawScaled(ctx, preview ? L.prev : L.img, { x: 0, y: 0, w: L.w * ls, h: L.h * ls }, o.x, o.y, o.w, o.h);
  }
}

// ---------- encoding ----------
function blobOf(c, type, quality) { return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), type, quality)); }
async function bytesOf(blob) { return new Uint8Array(await blob.arrayBuffer()); }
async function renderPng(p, W, H) { const c = canvas(W, H); paint(c.getContext('2d'), p, W, H); return bytesOf(await blobOf(c, 'image/png')); }
async function renderFile(p, fmt = formatOf(p), legacy = null) {
  if (fmt === 'ico') return writeIco(await Promise.all(ICO_SIZES.map(async (size) => ({ size, png: await renderPng(p, size, size) }))));
  const [W, H] = outSize(p, legacy);
  const c = canvas(W, H);
  paint(c.getContext('2d'), p, W, H, { jpgBg: fmt === 'jpg' ? ui.bg : null });
  return bytesOf(await blobOf(c, fmt === 'jpg' ? 'image/jpeg' : 'image/png', fmt === 'jpg' ? ui.quality / 100 : undefined));
}
function nameFor(p, fmt, legacy = null) {
  const appid = ui.appid.trim();
  if (p.steamName && /^\d+$/.test(appid) && !legacy) return `${p.group}/grid/${p.steamName.replace('{id}', appid)}.${fmt}`;
  const [w, h] = legacy ?? outSize(p);
  return `${p.group}/${legacy ? 'legacy/' : ''}${fileName(ui.game || state.art?.name || state.logo?.name || 'game', { ...p, w, h }, fmt)}`;
}
function jobs() {
  const out = [];
  for (const p of PRESETS) {
    if (!state.cards[p.id].include || !available(p)) continue;
    const fmt = formatOf(p);
    out.push({ p, fmt, legacy: null });
    if (ui.legacy && p.legacy && fmt !== 'ico') out.push({ p, fmt, legacy: p.legacy });
  }
  return out;
}
async function buildFiles(onProgress) {
  const list = jobs(), files = [];
  for (const [i, j] of list.entries()) {
    files.push({ name: nameFor(j.p, j.fmt, j.legacy), data: await renderFile(j.p, j.fmt, j.legacy) });
    onProgress?.((i + 1) / list.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  return files;
}
function download(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const MIME = { png: 'image/png', jpg: 'image/jpeg', ico: 'image/x-icon' };

// ---------- file-size estimates, one card at a time in the background ----------
const sizeQueue = new Set(); let sizeTimer = null, sizing = false;
function queueSize(id) { sizeQueue.add(id); state.bytes[id] = null; clearTimeout(sizeTimer); sizeTimer = setTimeout(runSizes, 450); updateCount(); }
function queueAllSizes() { for (const p of PRESETS) if (available(p)) queueSize(p.id); }
async function runSizes() {
  if (sizing) return; sizing = true;
  while (sizeQueue.size) {
    const id = sizeQueue.values().next().value; sizeQueue.delete(id);
    const p = byId(id);
    if (!available(p)) continue;
    try { state.bytes[id] = (await renderFile(p)).length; } catch { state.bytes[id] = null; }
    const el = state.els[id]; if (el) el.bytes.textContent = state.bytes[id] != null ? formatBytes(state.bytes[id]) : '';
    updateCount();
    await new Promise((r) => setTimeout(r, 0));
  }
  sizing = false;
}
function updateCount() {
  const list = jobs(), btn = $('#btn-zip');
  btn.disabled = !list.length || state.busy;
  if (!list.length) { $('#export-count').textContent = t('export.none'); return; }
  const main = list.filter((j) => !j.legacy);
  const known = main.every((j) => state.bytes[j.p.id] != null);
  const total = main.reduce((n, j) => n + (state.bytes[j.p.id] ?? 0), 0);
  $('#export-count').textContent = t('export.count', { n: list.length, size: known ? `~${formatBytes(total)}` : '…' });
}

// ---------- cards ----------
function buildCards() {
  const root = $('#groups'); root.replaceChildren();
  for (const g of GROUPS) {
    const sec = document.createElement('section'); sec.className = 'group-sec'; sec.dataset.group = g;
    const h = document.createElement('h2'); h.append(Object.assign(document.createElement('span'), { textContent: t(`group.${g}`) }), Object.assign(document.createElement('span'), { className: 'count', textContent: String(inGroup(g).length) }));
    sec.append(h);
    if (t(`group.${g}.note`) !== `group.${g}.note`) sec.append(Object.assign(document.createElement('p'), { className: 'note', textContent: t(`group.${g}.note`) }));
    const cards = document.createElement('div'); cards.className = 'cards';
    for (const p of inGroup(g)) cards.append(buildCard(p));
    sec.append(cards); root.append(sec);
  }
}
function buildCard(p) {
  const node = $('#tpl-card').content.firstElementChild.cloneNode(true);
  node.dataset.id = p.id;
  if (p.w / p.h > 2.8) node.classList.add('wide');
  const el = {
    node, canvas: $('.card-canvas', node), preview: $('.card-preview', node), safe: $('.card-safe', node), warn: $('.card-warn', node),
    zoom: $('.card-zoom', node), format: $('.card-format', node), bytes: $('.card-bytes', node), include: $('.card-include', node),
    title: $('.card-title', node), hint: $('.card-hint', node), dims: $('.card-dims', node),
  };
  state.els[p.id] = el;
  applyI18n(node);
  el.title.textContent = t(`asset.${p.id}`);
  el.hint.textContent = t(`hint.${p.id}`);
  for (const f of p.formats) el.format.append(Object.assign(document.createElement('option'), { value: f, textContent: f.toUpperCase() }));
  if (p.formats.length === 1) el.format.disabled = true;
  if (p.safe) { el.safe.hidden = false; Object.assign(el.safe.style, { left: `${p.safe[0] * 100}%`, top: `${p.safe[1] * 100}%`, width: `${p.safe[2] * 100}%`, height: `${p.safe[3] * 100}%` }); el.safe.title = t('card.safe'); }
  if (isFit(p)) { el.preview.classList.add('checker', 'fixed'); $('.field.row', node).hidden = true; }
  if (p.w <= 256 && p.w === p.h) el.preview.style.maxWidth = '160px';

  el.include.addEventListener('change', () => { state.cards[p.id].include = el.include.checked; node.classList.toggle('off', !el.include.checked); updateCount(); });
  el.format.addEventListener('change', () => { state.cards[p.id].format = el.format.value; queueSize(p.id); renderCard(p); });
  el.zoom.addEventListener('input', () => { state.cards[p.id].zoom = Number(el.zoom.value) / 100; renderCard(p); queueSize(p.id); });
  $('.card-reset', node).addEventListener('click', () => { Object.assign(state.cards[p.id], { zoom: 1, pan: { x: 0, y: 0 } }); el.zoom.value = 100; renderCard(p); queueSize(p.id); });
  $('.card-download', node).addEventListener('click', async () => {
    if (!available(p)) return;
    const fmt = formatOf(p);
    download(await renderFile(p, fmt), nameFor(p, fmt).split('/').pop(), MIME[fmt]);
  });
  // drag to reposition the crop, wheel to zoom
  let drag = null;
  el.preview.addEventListener('pointerdown', (e) => {
    if (isFit(p) || !state.art || e.button !== 0) return;
    const c = state.cards[p.id];
    drag = { x: e.clientX, y: e.clientY, pan: { ...c.pan }, w: el.canvas.clientWidth, h: el.canvas.clientHeight };
    el.preview.setPointerCapture(e.pointerId); el.preview.classList.add('dragging');
  });
  el.preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const c = state.cards[p.id];
    c.pan = { x: drag.pan.x - (e.clientX - drag.x) / drag.w, y: drag.pan.y - (e.clientY - drag.y) / drag.h };
    normalisePan(p); renderCard(p);
  });
  const end = () => { if (!drag) return; drag = null; el.preview.classList.remove('dragging'); queueSize(p.id); };
  el.preview.addEventListener('pointerup', end); el.preview.addEventListener('pointercancel', end);
  el.preview.addEventListener('wheel', (e) => {
    if (isFit(p) || !state.art) return;
    e.preventDefault();
    const c = state.cards[p.id];
    c.zoom = clamp(c.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 1, 4);
    el.zoom.value = Math.round(c.zoom * 100); normalisePan(p); renderCard(p); queueSize(p.id);
  }, { passive: false });
  return node;
}
// Keep pan equal to what the clamped rect really shows, so dragging past an edge does not build up slack.
function normalisePan(p) {
  const c = state.cards[p.id], r = srcRect(p);
  c.pan = { x: (r.x + r.w / 2 - state.focus.x * state.art.w) / r.w, y: (r.y + r.h / 2 - state.focus.y * state.art.h) / r.h };
}
function renderCard(p) {
  const el = state.els[p.id]; if (!el) return;
  const ok = available(p);
  el.node.classList.toggle('off', !state.cards[p.id].include);
  el.format.value = formatOf(p);
  const [W, H] = outSize(p);
  const fmt = formatOf(p);
  el.dims.textContent = fmt === 'ico' ? `${p.w} × ${p.h} · ICO` : `${W} × ${H}`;
  el.preview.hidden = !ok;
  $('.card-foot', el.node).hidden = !ok;
  if (!ok) { el.warn.hidden = false; el.warn.textContent = isFit(p) ? t('card.needlogo') : t('export.none'); return; }
  // preview canvas: actual display size, or the card width
  const dpr = window.devicePixelRatio || 1;
  let cssW;
  if (ui.actual) { cssW = isFit(p) ? Math.round(p.display[0] * (W / p.w)) : p.display[0]; el.preview.classList.add('actual'); el.canvas.style.width = `${cssW}px`; }
  else { el.preview.classList.remove('actual'); el.canvas.style.width = ''; cssW = el.preview.clientWidth || el.node.clientWidth - 24 || 300; }
  const pw = Math.max(1, Math.round(cssW * dpr)), ph = Math.max(1, Math.round(pw * H / W));
  if (el.canvas.width !== pw || el.canvas.height !== ph) { el.canvas.width = pw; el.canvas.height = ph; }
  const ctx = el.canvas.getContext('2d');
  ctx.clearRect(0, 0, pw, ph);
  paint(ctx, p, pw, ph, { preview: true, jpgBg: fmt === 'jpg' && isFit(p) ? ui.bg : null });
  // the logo where the client pins it over the hero (preview only)
  const notes = [];
  if (p.hero) {
    notes.push(t('card.notext'));
    if (state.logo) {
      const L = state.logo, r = heroLogoRect(L.w, L.h, pw, ph, ui.heroPos);
      drawScaled(ctx, L.prev, { x: 0, y: 0, w: L.w * L.ps, h: L.h * L.ps }, r.x, r.y, r.w, r.h);
      notes.push(t('card.heropreview'));
    }
  }
  if (isFit(p)) notes.push(t('card.fitlogo', { w: p.w, h: p.h }));
  if (fmt === 'ico') notes.push(t('card.ico', { sizes: ICO_SIZES.join(', ') }));
  if (ui.legacy && p.legacy) notes.push(t('card.legacy', { w: p.legacy[0], h: p.legacy[1] }));
  // upscale warning
  let warn = '';
  if (!isFit(p)) { const f = p.w / srcRect(p).w; if (f > 1.05) warn = t('card.upscaled', { f: f.toFixed(1) }); }
  else if (state.logo && (state.logo.w < W * 0.95 && state.logo.h < H * 0.95)) warn = t('card.upscaled', { f: (W / state.logo.w).toFixed(1) });
  el.warn.hidden = !warn; el.warn.textContent = warn;
  let info = $('.card-info', el.node);
  if (!info) { info = Object.assign(document.createElement('p'), { className: 'card-info' }); el.warn.after(info); }
  info.textContent = notes.join(' '); info.hidden = !notes.length;
  if (state.bytes[p.id] != null) el.bytes.textContent = formatBytes(state.bytes[p.id]);
}
function renderAll() {
  $('#main-empty').hidden = Boolean(state.art || state.logo);
  $('#groups').hidden = !(state.art || state.logo);
  for (const p of PRESETS) renderCard(p);
  updateCount();
}

// ---------- side panel ----------
function drawThumb(canvasEl, src, maxW = 580) {
  const s = Math.min(1, maxW / src.w);
  canvasEl.width = Math.round(src.w * src.ps * Math.min(1, maxW / (src.w * src.ps)));
  canvasEl.height = Math.round(canvasEl.width * src.h / src.w);
  const ctx = canvasEl.getContext('2d'); ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  drawScaled(ctx, src.prev, { x: 0, y: 0, w: src.w * src.ps, h: src.h * src.ps }, 0, 0, canvasEl.width, canvasEl.height);
  return s;
}
function renderSide() {
  const art = state.art, logo = state.logo;
  $('#art-empty').hidden = Boolean(art); $('#art-full').hidden = !art; $('#drop-art').classList.toggle('filled', Boolean(art));
  if (art) { drawThumb($('#art-canvas'), art); $('#art-info').textContent = t('src.info', { w: art.w, h: art.h }); placeFocus(); }
  $('#logo-empty').hidden = Boolean(logo); $('#logo-full').hidden = !logo; $('#drop-logo').classList.toggle('filled', Boolean(logo));
  if (logo) { drawThumb($('#logo-canvas'), logo); $('#logo-info').textContent = t('src.info', { w: logo.w, h: logo.h }); }
  document.body.dataset.overlay = String(ui.overlay);
}
function placeFocus() { const d = $('#focus-dot'); d.style.left = `${state.focus.x * 100}%`; d.style.top = `${state.focus.y * 100}%`; }
function buildPosGrid() {
  const g = $('#pos-grid'); g.replaceChildren();
  for (const pos of POSITIONS) {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.pos = pos;
    b.setAttribute('aria-checked', String(pos === ui.logoPos)); b.title = t(`pos.${pos}`); b.setAttribute('aria-label', t(`pos.${pos}`));
    b.addEventListener('click', () => { ui.logoPos = pos; save(); buildPosGrid(); onOverlayChange(); });
    g.append(b);
  }
}
function onOverlayChange() { for (const p of PRESETS) if (p.text) { renderCard(p); queueSize(p.id); } }

async function setArt(file) {
  try {
    const d = await decode(file);
    if (Math.max(d.w, d.h) > BIG) toast(t('msg.toolarge', { max: BIG }));
    state.art = withPreview({ ...d, name: file.name.replace(/\.[^.]+$/, '') });
    state.focus = { x: 0.5, y: 0.5 };
    for (const c of Object.values(state.cards)) { c.zoom = 1; c.pan = { x: 0, y: 0 }; }
    for (const el of Object.values(state.els)) el.zoom.value = 100;
    if (!ui.game && !$('#opt-game').value) $('#opt-game').placeholder = state.art.name;
    renderSide(); renderAll(); queueAllSizes();
  } catch { toast(t('msg.badfile')); }
}
async function setLogo(file) {
  try {
    const d = await decode(file);
    state.logo = withPreview({ ...d, name: file.name.replace(/\.[^.]+$/, '') });
    renderSide(); renderAll(); queueAllSizes();
  } catch { toast(t('msg.badfile')); }
}

function wireDrop(zone, input, onFile) {
  zone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); zone.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) onFile(f); });
  input.addEventListener('change', () => { if (input.files[0]) onFile(input.files[0]); input.value = ''; });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
}

async function exportZip() {
  if (state.busy) return;
  state.busy = true; updateCount();
  const bar = $('#progress'), fill = $('i', bar); bar.hidden = false; fill.style.width = '0%';
  $('#export-count').textContent = t('export.working');
  try {
    const files = await buildFiles((f) => { fill.style.width = `${Math.round(f * 100)}%`; });
    const base = fileName(ui.game || state.art?.name || state.logo?.name || 'game', { id: 'steam-art', w: 0, h: 0 }, 'zip').replace('_steam-art_0x0', '_steam-art');
    download(writeZip(files), base, 'application/zip');
    toast(t('msg.done', { n: files.length }));
  } finally { state.busy = false; bar.hidden = true; updateCount(); }
}

function applyTheme() { document.documentElement.dataset.theme = ui.theme; $('meta[name="theme-color"]').content = ui.theme === 'light' ? '#dfe7ee' : '#171a21'; }
function applyLanguage() {
  setLang(ui.lang || detectLang());
  applyI18n(); buildPosGrid();
  if (!ui.game && state.art) $('#opt-game').placeholder = state.art.name;
  buildCards(); renderSide(); renderAll();
}

function init() {
  // controls from saved settings
  $('#set-lang').value = ui.lang || detectLang();
  $('#set-theme').value = ui.theme;
  $('#opt-game').value = ui.game; $('#opt-appid').value = ui.appid; $('#opt-format').value = ui.format; $('#opt-bg').value = ui.bg;
  $('#opt-quality').value = ui.quality; $('#quality-out').textContent = ui.quality;
  $('#opt-overlay').checked = ui.overlay; $('#opt-heropos').value = ui.heroPos;
  $('#opt-logo-size').value = ui.logoSize; $('#logo-size-out').textContent = `${ui.logoSize}%`;
  $('#opt-logo-margin').value = ui.logoMargin; $('#logo-margin-out').textContent = `${ui.logoMargin}%`;
  $('#opt-actual').checked = ui.actual; $('#opt-legacy').checked = ui.legacy;
  applyTheme(); applyLanguage();

  $('#set-lang').addEventListener('change', (e) => { ui.lang = e.target.value; save(); applyLanguage(); });
  $('#set-theme').addEventListener('change', (e) => { ui.theme = e.target.value; save(); applyTheme(); });
  $('#opt-game').addEventListener('input', (e) => { ui.game = e.target.value; save(); });
  $('#opt-appid').addEventListener('input', (e) => { ui.appid = e.target.value.replace(/\D/g, ''); e.target.value = ui.appid; save(); });
  $('#opt-format').addEventListener('change', (e) => { ui.format = e.target.value; save(); for (const p of PRESETS) state.cards[p.id].format = null; renderAll(); queueAllSizes(); });
  $('#opt-bg').addEventListener('input', (e) => { ui.bg = e.target.value; save(); renderAll(); queueAllSizes(); });
  $('#opt-quality').addEventListener('input', (e) => { ui.quality = Number(e.target.value); $('#quality-out').textContent = ui.quality; save(); queueAllSizes(); });
  $('#opt-overlay').addEventListener('change', (e) => { ui.overlay = e.target.checked; save(); renderSide(); onOverlayChange(); });
  $('#opt-heropos').addEventListener('change', (e) => { ui.heroPos = e.target.value; save(); for (const p of PRESETS) if (p.hero) renderCard(p); });
  $('#opt-logo-size').addEventListener('input', (e) => { ui.logoSize = Number(e.target.value); $('#logo-size-out').textContent = `${ui.logoSize}%`; save(); onOverlayChange(); });
  $('#opt-logo-margin').addEventListener('input', (e) => { ui.logoMargin = Number(e.target.value); $('#logo-margin-out').textContent = `${ui.logoMargin}%`; save(); onOverlayChange(); });
  $('#opt-actual').addEventListener('change', (e) => { ui.actual = e.target.checked; save(); renderAll(); });
  $('#opt-legacy').addEventListener('change', (e) => { ui.legacy = e.target.checked; save(); renderAll(); });

  wireDrop($('#drop-art'), $('#file-art'), setArt);
  wireDrop($('#drop-logo'), $('#file-logo'), setLogo);
  $('#btn-pick-art').addEventListener('click', () => $('#file-art').click());
  $('#btn-replace-art').addEventListener('click', () => $('#file-art').click());
  $('#btn-pick-logo').addEventListener('click', () => $('#file-logo').click());
  $('#btn-replace-logo').addEventListener('click', () => $('#file-logo').click());
  // dropping anywhere else on the page sets the artwork; pasting an image does too
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer?.files[0]; if (f) setArt(f); });
  window.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith('image/')); if (f) setArt(f); });

  $('#art-thumb').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    state.focus = { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) };
    for (const c of Object.values(state.cards)) c.pan = { x: 0, y: 0 };
    placeFocus(); renderAll(); queueAllSizes();
  });
  $('#btn-zip').addEventListener('click', exportZip);

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderAll, 120); });

  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('#btn-install').hidden = false; });
  $('#btn-install').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btn-install').hidden = true; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !new URLSearchParams(location.search).has('nosw')) navigator.serviceWorker.register('sw.js').catch(() => {});

  // test and debugging hook
  window.__sak = { state, ui, PRESETS, srcRect: (id) => srcRect(byId(id)), outSize: (id) => outSize(byId(id)), renderFile: async (id, fmt) => Array.from(await renderFile(byId(id), fmt)), jobs: () => jobs().map((j) => nameFor(j.p, j.fmt, j.legacy)), HERO_LOGO_POSITIONS };
}
init();
