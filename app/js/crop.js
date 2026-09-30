// Pure crop / fit maths. All rects are { x, y, w, h } in source pixels; focus is { x, y } in 0..1.

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// The largest rect with the target aspect that fits in the source, centred on the focus point,
// shrunk by `zoom` (1 = as large as possible, 2 = half the width) and shifted by `pan`
// (fractions of the rect size). The rect never leaves the source.
export function coverRect(srcW, srcH, dstW, dstH, { focus = { x: 0.5, y: 0.5 }, zoom = 1, pan = { x: 0, y: 0 } } = {}) {
  const a = dstW / dstH;
  let w = srcW, h = srcW / a;
  if (h > srcH) { h = srcH; w = srcH * a; }
  zoom = clamp(zoom, 1, 16);
  w /= zoom; h /= zoom;
  let x = focus.x * srcW - w / 2 + pan.x * w;
  let y = focus.y * srcH - h / 2 + pan.y * h;
  x = clamp(x, 0, srcW - w); y = clamp(y, 0, srcH - h);
  return { x, y, w, h };
}

// Where a source (e.g. a logo) lands when fitted inside the target with `padding` (fraction of the
// shorter target side) and anchored at `anchor` (0..1 in both axes). Returns a dest rect.
export function containRect(srcW, srcH, dstW, dstH, { padding = 0, anchor = { x: 0.5, y: 0.5 }, scale = 1 } = {}) {
  const pad = padding * Math.min(dstW, dstH);
  const boxW = dstW - 2 * pad, boxH = dstH - 2 * pad;
  const s = Math.min(boxW / srcW, boxH / srcH) * scale;
  const w = srcW * s, h = srcH * s;
  return { x: pad + (boxW - w) * anchor.x, y: pad + (boxH - h) * anchor.y, w, h };
}

// Output size for a logo fitted inside a max box without padding (Steam: "1280 wide and/or 720 tall").
export function fitSize(srcW, srcH, maxW, maxH) {
  const s = Math.min(maxW / srcW, maxH / srcH);
  return [Math.max(1, Math.round(srcW * s)), Math.max(1, Math.round(srcH * s))];
}

// Where the Steam client pins a library logo over the hero (preview only). Width is a fraction of
// the hero width, margin a fraction of the hero height.
export function heroLogoRect(logoW, logoH, heroW, heroH, position = 'BottomLeft', { width = 0.36, margin = 0.08 } = {}) {
  let w = heroW * width, h = w * (logoH / logoW);
  if (h > heroH * 0.6) { h = heroH * 0.6; w = h * (logoW / logoH); }
  const m = heroH * margin;
  const x = position === 'BottomLeft' ? heroW * 0.04 : (heroW - w) / 2;
  const y = position === 'UpperCenter' ? m : position === 'CenterCenter' ? (heroH - h) / 2 : heroH - m - h;
  return { x, y, w, h };
}

// Overlay placement on a 3×3 grid: position 'tl' | 't' | 'tr' | 'l' | 'c' | 'r' | 'bl' | 'b' | 'br',
// size as a fraction of the target width, margin as a fraction of the shorter side.
export const POSITIONS = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];
export function overlayRect(logoW, logoH, dstW, dstH, { position = 'bl', size = 0.4, margin = 0.05 } = {}) {
  const i = POSITIONS.indexOf(position);
  if (i < 0) throw new Error(`bad position ${position}`);
  const ax = (i % 3) / 2, ay = Math.floor(i / 3) / 2;
  const w = dstW * size, h = w * (logoH / logoW);
  const m = margin * Math.min(dstW, dstH);
  return { x: m + (dstW - 2 * m - w) * ax, y: m + (dstH - 2 * m - h) * ay, w, h };
}

// How many times a rect gets scaled from source to target (1 = no resampling loss, <1 = upscaled).
export const scaleFactor = (rect, dstW) => rect.w / dstW;

// Downscale steps for good quality: halve until within 2× of the target, then one final resize.
export function downscaleSteps(srcW, srcH, dstW, dstH) {
  const steps = [];
  let w = srcW, h = srcH;
  while (w / 2 >= dstW && h / 2 >= dstH) { w = Math.round(w / 2); h = Math.round(h / 2); steps.push([w, h]); }
  if (w !== dstW || h !== dstH) steps.push([dstW, dstH]);
  return steps;
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// File names: "{game}_{asset}_{w}x{h}.{ext}", safe for every OS.
export function fileName(game, preset, ext) {
  const safe = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'game';
  return `${safe(game)}_${preset.id}_${preset.w}x${preset.h}.${ext}`;
}
