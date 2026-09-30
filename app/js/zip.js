// Minimal ZIP writer (stored, no compression) and a reader for tests. Images are already compressed,
// so "store" is the right choice and keeps this dependency-free.
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
export function crc32(bytes) { let c = -1; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }

const enc = new TextEncoder(), dec = new TextDecoder();
function dosTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

// entries: [{ name, data: Uint8Array, date?: Date }] → Uint8Array
export function writeZip(entries, date = new Date(2024, 0, 1, 12, 0, 0)) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name), crc = crc32(e.data), { time, date: dt } = dosTime(e.date ?? date);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true); local.setUint16(8, 0, true);
    local.setUint16(10, time, true); local.setUint16(12, dt, true); local.setUint32(14, crc, true);
    local.setUint32(18, e.data.length, true); local.setUint32(22, e.data.length, true); local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    locals.push(new Uint8Array(local.buffer), name, e.data);
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); central.setUint16(4, 20, true); central.setUint16(6, 20, true); central.setUint16(8, 0x0800, true); central.setUint16(10, 0, true);
    central.setUint16(12, time, true); central.setUint16(14, dt, true); central.setUint32(16, crc, true);
    central.setUint32(20, e.data.length, true); central.setUint32(24, e.data.length, true); central.setUint16(28, name.length, true);
    central.setUint16(30, 0, true); central.setUint16(32, 0, true); central.setUint16(34, 0, true); central.setUint16(36, 0, true); central.setUint32(38, 0, true); central.setUint32(42, offset, true);
    centrals.push(new Uint8Array(central.buffer), name);
    offset += 30 + name.length + e.data.length;
  }
  const cdSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true); end.setUint16(20, 0, true);
  const parts = [...locals, ...centrals, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
  let p = 0; for (const b of parts) { out.set(b, p); p += b.length; }
  return out;
}

// Reads a stored ZIP back: [{ name, data, crc }]. Used by tests.
export function readZip(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endAt = bytes.length - 22;
  if (v.getUint32(endAt, true) !== 0x06054b50) throw new Error('no end of central directory');
  const count = v.getUint16(endAt + 10, true);
  let p = v.getUint32(endAt + 16, true);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('bad central header');
    const crc = v.getUint32(p + 16, true), size = v.getUint32(p + 20, true), nameLen = v.getUint16(p + 28, true), extra = v.getUint16(p + 30, true), comment = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    const ln = v.getUint16(local + 26, true), le = v.getUint16(local + 28, true);
    const start = local + 30 + ln + le;
    out.push({ name, crc, data: bytes.subarray(start, start + size) });
    p += 46 + nameLen + extra + comment;
  }
  return out;
}
