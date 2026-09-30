// ICO writer with PNG-compressed entries (Windows Vista+ and Steam read these).
// images: [{ size, png: Uint8Array }] → Uint8Array
export function writeIco(images) {
  const header = 6 + 16 * images.length;
  const total = header + images.reduce((n, i) => n + i.png.length, 0);
  const out = new Uint8Array(total), v = new DataView(out.buffer);
  v.setUint16(0, 0, true); v.setUint16(2, 1, true); v.setUint16(4, images.length, true);
  let offset = header;
  images.forEach((img, i) => {
    const e = 6 + i * 16, s = img.size >= 256 ? 0 : img.size;
    out[e] = s; out[e + 1] = s; out[e + 2] = 0; out[e + 3] = 0;
    v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true);
    v.setUint32(e + 8, img.png.length, true); v.setUint32(e + 12, offset, true);
    out.set(img.png, offset); offset += img.png.length;
  });
  return out;
}

export function readIco(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.getUint16(0, true) !== 0 || v.getUint16(2, true) !== 1) throw new Error('not an icon');
  const n = v.getUint16(4, true), out = [];
  for (let i = 0; i < n; i++) {
    const e = 6 + i * 16, size = bytes[e] || 256, len = v.getUint32(e + 8, true), off = v.getUint32(e + 12, true);
    out.push({ size, data: bytes.subarray(off, off + len) });
  }
  return out;
}
