/**
 * Application configuration.
 */

require("dotenv").config();

const path = require("path");

const {
  requirePositiveInt,
  requireString,
  requireEnvString,
} = require("./env");

const ROOT_DIR = path.join(__dirname, "..");

const DAY_IN_SECONDS = 86_400;

const YEAR_IN_SECONDS = 365 * DAY_IN_SECONDS;

const EXPIRY_YEARS = 1;
const EXPIRY_MS = YEAR_IN_SECONDS * EXPIRY_YEARS * 1000;

const PORT = requirePositiveInt("PORT", 3000);
const BIND_IP = requireString("IP_ADDRESS", "127.0.0.1");

const SECRET_HINT =
  `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`;

module.exports = Object.freeze({
  PORT,
  BIND_IP,

  IS_PRODUCTION: process.env.NODE_ENV === "production",

  MAX_UPLOAD_BYTES: 5_000_000,
  MAX_FORM_BYTES: 100_000,

  ALLOWED_MIME: Object.freeze(["image/png", "image/jpeg", "image/gif"]),

  UPLOAD_DIR: path.resolve(
    requireString("UPLOAD_DIR", path.join(ROOT_DIR, "uploads"))
  ),
  ORPHAN_GRACE_MS: 15 * 60 * 1000,

  CLEANUP_INTERVAL_MS: 60 * 60 * 1000,
  GRACEFUL_SHUTDOWN_MS: 5_000,

  KEY_LENGTH: 8,
  KEY_ALPHABET:
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",

  EXPIRY_YEARS,
  EXPIRY_MS,

  DAY_IN_SECONDS,
  YEAR_IN_SECONDS,

  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 20,

  CSRF_SECRET: requireEnvString("CSRF_SECRET", SECRET_HINT),
  CSRF_COOKIE_NAME: "__csrf",

  ADMIN_USERNAME: requireEnvString("ADMIN_USERNAME"),
  ADMIN_PASSWORD: requireEnvString("ADMIN_PASSWORD"),

  SESSION_SECRET: requireEnvString("SESSION_SECRET", SECRET_HINT),
});
