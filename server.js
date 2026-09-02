/**
 * Image Share
 */

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const adminRoutes = require("./routes/admin");
const imageRoutes = require("./routes/image");
const db = require("./lib/db");
const storage = require("./lib/storage");
const { createCleanupJob } = require("./lib/cleanup");
const { csrfMiddleware, csrfErrorHandler } = require("./middleware/csrf");
const { errorHandler, notFoundHandler } = require("./middleware/errors");

const {
  MAX_FORM_BYTES,
  PORT,
  BIND_IP,
  GRACEFUL_SHUTDOWN_MS,
  IS_PRODUCTION,
  SESSION_SECRET,
} = require("./config");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

app.use(morgan(IS_PRODUCTION ? "combined" : "dev"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false, limit: MAX_FORM_BYTES }));
app.use(cookieParser());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: IS_PRODUCTION,
    },
  })
);

app.use(csrfMiddleware);

app.use(imageRoutes);
app.use(adminRoutes);
app.use(notFoundHandler);
app.use(csrfErrorHandler);
app.use(errorHandler);

const cleanup = createCleanupJob();

let server = null;
let isShuttingDown = false;

const start = async () => {
  await storage.init();

  server = app.listen(PORT, BIND_IP, () => {
    console.log(`App running at http://${BIND_IP}:${PORT}`);
    cleanup.start();
  });
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received — shutting down`);
  cleanup.stop();

  const forceExit = setTimeout(
    () => process.exit(1),
    GRACEFUL_SHUTDOWN_MS
  );
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("HTTP server closed");
    }
    await db.destroy();
    console.log("Database connections closed");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
