/**
 * Multipart upload handling.
 */

const multer = require("multer");
const { MAX_UPLOAD_BYTES, ALLOWED_MIME } = require("../config");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 0,
  },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME.includes(file.mimetype));
  },
});

module.exports = { uploadImage: upload.single("image") };
