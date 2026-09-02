/**
 * Error handling middleware.
 */

const multer = require("multer");
const { AppError } = require("../lib/errors");
const { MAX_UPLOAD_BYTES } = require("../config");

const ERROR_MAP = {
  403: {
    heading: "Forbidden",
    message: "You do not have permission to perform this action.",
  },
  404: {
    heading: "Not Found",
    message: "The image you're looking for doesn't exist or has expired.",
  },
  413: {
    heading: "File Too Large",
    message: `That file is larger than the ${MAX_UPLOAD_BYTES / 1_000_000} MB limit.`,
  },
  422: { heading: "Invalid Input" },
  429: { heading: "Too Many Requests" },
  500: {
    heading: "Internal Server Error",
    message: "Something unexpected went wrong. We're working on it.",
  },
};

const isTooLarge = (err) =>
  (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") ||
  err.type === "entity.too.large";

const wantsJson = (req) => req.accepts(["html", "json"]) === "json";

const respond = (req, res, statusCode, message) => {
  const defaults = ERROR_MAP[statusCode] || ERROR_MAP[500];
  const body = message || defaults.message;

  if (wantsJson(req)) {
    return res.status(statusCode).json({ error: body });
  }

  res.status(statusCode).render("error", {
    code: statusCode,
    heading: defaults.heading,
    message: body,
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (isTooLarge(err)) return respond(req, res, 413);

  if (err instanceof AppError) {
    return respond(req, res, err.statusCode, err.message);
  }

  console.error(err.stack);
  respond(req, res, 500);
};

const notFoundHandler = (req, res) => respond(req, res, 404);

module.exports = { errorHandler, notFoundHandler };
