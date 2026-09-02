/**
 * Filesystem storage for image bytes.
 */

const fs = require("fs/promises");
const path = require("path");
const { randomBytes } = require("crypto");
const { UPLOAD_DIR, ORPHAN_GRACE_MS } = require("../config");

const TMP_DIR = path.join(UPLOAD_DIR, "tmp");

const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};

const init = async () => {
  await fs.mkdir(TMP_DIR, { recursive: true });
};

const pathFor = (storageName) => path.join(UPLOAD_DIR, path.basename(storageName));

const write = async (buffer, mime) => {
  const extension = EXTENSIONS[mime];
  if (!extension) throw new Error(`Unsupported mime type: ${mime}`);

  const storageName = `${randomBytes(16).toString("hex")}.${extension}`;
  const tmpPath = path.join(TMP_DIR, storageName);

  await fs.writeFile(tmpPath, buffer);
  await fs.rename(tmpPath, pathFor(storageName));

  return storageName;
};

const remove = async (storageName) => {
  try {
    await fs.unlink(pathFor(storageName));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
};

const sweepDirectory = async (directory, keep, cutoff) => {
  let removed = 0;
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || keep.has(entry.name)) continue;

    const full = path.join(directory, entry.name);
    const stats = await fs.stat(full);
    if (stats.mtimeMs > cutoff) continue;

    await fs.unlink(full);
    removed += 1;
  }

  return removed;
};

const sweepOrphans = async (knownNames) => {
  const cutoff = Date.now() - ORPHAN_GRACE_MS;
  const stranded = await sweepDirectory(UPLOAD_DIR, knownNames, cutoff);
  const stale = await sweepDirectory(TMP_DIR, new Set(), cutoff);
  return stranded + stale;
};

module.exports = { init, write, pathFor, remove, sweepOrphans };
