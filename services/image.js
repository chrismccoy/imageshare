/**
 * Image service.
 */

const Image = require("../models/image");
const repo = require("../repositories/image");
const storage = require("../lib/storage");
const imageinfo = require("../lib/imageinfo");
const { scrub } = require("../lib/scrub");
const { generateKey } = require("../lib/keygen");
const { NotFoundError, ValidationError } = require("../lib/errors");
const { EXPIRY_MS } = require("../config");

const MAX_KEY_ATTEMPTS = 5;

const IMAGES_PER_PAGE = 20;

const findByKey = async (key) => {
  const row = await repo.findByKey(key);
  if (!row) throw new NotFoundError("Image not found");

  const image = new Image(row);

  if (image.isExpired) {
    await deleteImage(image.id);
    throw new NotFoundError("Image has expired");
  }

  return image;
};

const createImage = async (buffer) => {
  const info = imageinfo.read(buffer);
  if (!info) {
    throw new ValidationError(
      "That file is not a supported image. Upload a PNG, JPEG, or GIF."
    );
  }

  const scrubbed = scrub(buffer, info);
  if (!scrubbed) {
    throw new ValidationError("That image file is malformed and could not be processed.");
  }

  const verified = imageinfo.read(scrubbed);
  if (
    !verified ||
    verified.mime !== info.mime ||
    verified.width !== info.width ||
    verified.height !== info.height
  ) {
    throw new Error("Scrubbed image failed verification");
  }

  const storageName = await storage.write(scrubbed, info.mime);

  try {
    const expires_at = Date.now() + EXPIRY_MS;
    let lastError;

    for (let i = 0; i < MAX_KEY_ATTEMPTS; i++) {
      const key = generateKey();
      const row = {
        key,
        storage_name: storageName,
        mime: info.mime,
        size_bytes: scrubbed.length,
        width: info.width,
        height: info.height,
        expires_at,
      };

      try {
        const id = await repo.insert(row);
        return new Image({ id, ...row });
      } catch (err) {
        if (!err.isDuplicateKey) throw err;
        lastError = err;
      }
    }

    throw new Error(
      `Failed to generate unique key after ${MAX_KEY_ATTEMPTS} attempts: ${lastError?.message}`
    );
  } catch (err) {
    await storage.remove(storageName);
    throw err;
  }
};

const deleteImage = async (id) => {
  const row = await repo.findById(id);
  if (!row) return;

  await repo.deleteById(id);
  await storage.remove(row.storage_name);
};

const deleteExpired = async () => {
  const expired = await repo.findExpired();
  if (expired.length === 0) return 0;

  await repo.deleteByIds(expired.map((row) => row.id));

  for (const row of expired) {
    await storage.remove(row.storage_name);
  }

  return expired.length;
};

const sweepOrphans = async () => storage.sweepOrphans(await repo.allStorageNames());

const listImages = async (page = 1, perPage = IMAGES_PER_PAGE) => {
  const [rows, total] = await Promise.all([repo.findAll(page, perPage), repo.countAll()]);

  return {
    images: rows.map((row) => new Image(row)),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
};

module.exports = {
  findByKey,
  createImage,
  deleteImage,
  deleteExpired,
  sweepOrphans,
  listImages,
};
