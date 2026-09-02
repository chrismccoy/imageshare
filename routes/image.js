/**
 * Image route definitions.
 */

const express = require("express");
const imageService = require("../services/image");
const storage = require("../lib/storage");
const { uploadImage } = require("../middleware/upload");
const { NotFoundError, ValidationError } = require("../lib/errors");
const { MAX_UPLOAD_BYTES, EXPIRY_YEARS } = require("../config");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();

const createLimiter = createRateLimiter();

const RAW_CSP = "default-src 'none'; sandbox";

router.param("key", async (req, _res, next, key) => {
  req.image = await imageService.findByKey(key);
  next();
});

router.get("/", (_req, res) => {
  res.render("new", {
    maxBytes: MAX_UPLOAD_BYTES,
    expiryYears: EXPIRY_YEARS,
  });
});

router.get("/i/:key.:extension", (req, res) => {
  if (req.params.extension !== req.image.extension) {
    throw new NotFoundError("Image not found");
  }

  res.set({
    "Content-Type": req.image.mime,
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Security-Policy": RAW_CSP,
    "Cross-Origin-Resource-Policy": "cross-origin",
  });
  res.sendFile(storage.pathFor(req.image.storage_name));
});

router.get("/i/:key", (req, res) => {
  res.render("show", { image: req.image });
});

router.post("/i/create", createLimiter, uploadImage, async (req, res) => {
  if (!req.file) {
    throw new ValidationError("Choose a PNG, JPEG, or GIF to upload.");
  }

  const image = await imageService.createImage(req.file.buffer);

  res.status(201).json({ key: image.key, url: `/i/${image.key}` });
});

module.exports = router;
