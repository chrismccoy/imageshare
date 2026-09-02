/**
 * Mime type to file extension mapping.
 */

const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};

const extensionFor = (mime) => EXTENSIONS[mime] ?? null;

module.exports = { extensionFor };
