// Deterministic test images, encoded as PNG without dependencies.
import { deflateSync } from 'node:zlib';
const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
export function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w; x++) { const [r, g, b, a = 255] = pixel(x, y); const i = y * (w * 4 + 1) + 1 + x * 4; raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// 2400×1350 artwork: left half red, right half blue, a green square in the top-right corner
export const ART = png(2400, 1350, (x, y) => (x > 2100 && y < 300 ? [0, 200, 0] : x < 1200 ? [220, 30, 30] : [30, 60, 220]));
// 800×200 transparent logo with a white bar
export const LOGO = png(800, 200, (x, y) => (y > 50 && y < 150 && x > 40 && x < 760 ? [255, 255, 255, 255] : [0, 0, 0, 0]));
// PNG dimensions from the IHDR chunk
export const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];
