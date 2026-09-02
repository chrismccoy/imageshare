/**
 * Lossless metadata removal.
 */

const JPEG_DROP_MARKERS = new Set([0xe1, 0xed, 0xfe]);

const PNG_DROP_CHUNKS = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);

const ORIENTATION_TAG = 0x0112;
const TIFF_TYPE_SHORT = 3;

const buildOrientationApp1 = (orientation) => {
  const tiff = Buffer.alloc(26);
  tiff.write("MM", 0, "latin1");
  tiff.writeUInt16BE(0x002a, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(1, 8);
  tiff.writeUInt16BE(ORIENTATION_TAG, 10);
  tiff.writeUInt16BE(TIFF_TYPE_SHORT, 12);
  tiff.writeUInt32BE(1, 14);
  tiff.writeUInt16BE(orientation, 18);
  tiff.writeUInt16BE(0, 20);
  tiff.writeUInt32BE(0, 22);

  const payload = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
  const segment = Buffer.alloc(4 + payload.length);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);
  return segment;
};

const scrubJpeg = (buf, orientation) => {
  const out = [Buffer.from([0xff, 0xd8])];
  if (orientation > 1) out.push(buildOrientationApp1(orientation));

  let offset = 2;

  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) return null;

    let marker = buf[offset + 1];
    while (marker === 0xff && offset + 2 < buf.length) {
      offset += 1;
      marker = buf[offset + 1];
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      out.push(buf.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (marker === 0xda || marker === 0xd9) {
      out.push(buf.subarray(offset));
      return Buffer.concat(out);
    }

    const length = buf.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buf.length) return null;

    const segmentEnd = offset + 2 + length;
    if (!JPEG_DROP_MARKERS.has(marker)) out.push(buf.subarray(offset, segmentEnd));
    offset = segmentEnd;
  }

  return null;
};

const scrubPng = (buf) => {
  const out = [buf.subarray(0, 8)];
  let offset = 8;

  while (offset + 12 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > buf.length) return null;

    const type = buf.subarray(offset + 4, offset + 8).toString("latin1");
    if (!PNG_DROP_CHUNKS.has(type)) out.push(buf.subarray(offset, chunkEnd));

    offset = chunkEnd;
    if (type === "IEND") return Buffer.concat(out);
  }

  return null;
};

const scrub = (buf, info) => {
  if (!info) return null;
  if (info.mime === "image/jpeg") return scrubJpeg(buf, info.orientation);
  if (info.mime === "image/png") return scrubPng(buf);
  return buf;
};

module.exports = { scrub };
