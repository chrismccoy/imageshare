/**
 * Image classification by magic bytes.
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

const ORIENTATION_TAG = 0x0112;

const readExifOrientation = (segment) => {
  if (segment.length < 14) return null;
  if (segment.subarray(0, 6).toString("latin1") !== "Exif\0\0") return null;

  const tiff = segment.subarray(6);
  const byteOrder = tiff.subarray(0, 2).toString("latin1");
  if (byteOrder !== "II" && byteOrder !== "MM") return null;

  const little = byteOrder === "II";
  const u16 = (o) => (little ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (little ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));

  if (tiff.length < 8 || u16(2) !== 0x002a) return null;

  const ifdStart = u32(4);
  if (ifdStart + 2 > tiff.length) return null;

  const entryCount = u16(ifdStart);
  for (let i = 0; i < entryCount; i++) {
    const entry = ifdStart + 2 + i * 12;
    if (entry + 12 > tiff.length) return null;
    if (u16(entry) !== ORIENTATION_TAG) continue;
    const value = u16(entry + 8);
    return value >= 1 && value <= 8 ? value : null;
  }
  return null;
};

const readPng = (buf) => {
  if (buf.length < 24) return null;
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (buf.subarray(12, 16).toString("latin1") !== "IHDR") return null;

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return null;

  return { mime: "image/png", width, height, orientation: 1 };
};

const readGif = (buf) => {
  if (buf.length < 10) return null;
  const signature = buf.subarray(0, 6).toString("latin1");
  if (signature !== "GIF87a" && signature !== "GIF89a") return null;

  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  if (!width || !height) return null;

  return { mime: "image/gif", width, height, orientation: 1 };
};

const readJpeg = (buf) => {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let offset = 2;
  let dimensions = null;
  let orientation = 1;

  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) return null;

    let marker = buf[offset + 1];
    while (marker === 0xff && offset + 2 < buf.length) {
      offset += 1;
      marker = buf[offset + 1];
    }

    // Standalone markers carry no payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      offset += 2;
      continue;
    }
    // Scan data and end-of-image: nothing further to parse.
    if (marker === 0xda || marker === 0xd9) break;

    const length = buf.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buf.length) return null;

    const payloadStart = offset + 4;
    const segmentEnd = offset + 2 + length;

    if (SOF_MARKERS.has(marker) && !dimensions) {
      if (segmentEnd - payloadStart < 5) return null;
      const height = buf.readUInt16BE(payloadStart + 1);
      const width = buf.readUInt16BE(payloadStart + 3);
      if (!width || !height) return null;
      dimensions = { width, height };
    }

    if (marker === 0xe1) {
      const found = readExifOrientation(buf.subarray(payloadStart, segmentEnd));
      if (found) orientation = found;
    }

    offset = segmentEnd;
  }

  if (!dimensions) return null;
  return { mime: "image/jpeg", ...dimensions, orientation };
};

const read = (buf) => {
  if (!Buffer.isBuffer(buf) || buf.length === 0) return null;
  return readPng(buf) ?? readJpeg(buf) ?? readGif(buf);
};

module.exports = { read };
