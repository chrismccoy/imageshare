/**
 * CSRF protection middleware.
 */

const { doubleCsrf } = require("csrf-csrf");
const { CSRF_SECRET, CSRF_COOKIE_NAME, IS_PRODUCTION } = require("../config");

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: () => "",
  cookieName: CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: IS_PRODUCTION,
    path: "/",
  },
  getCsrfTokenFromRequest: (req) =>
    req.body?._csrf ?? req.headers["x-csrf-token"],
});

const csrfMiddleware = (req, res, next) => {
  doubleCsrfProtection(req, res, (err) => {
    if (err) return next(err);
    res.locals.csrfToken = generateCsrfToken(req, res);
    next();
  });
};

const csrfErrorHandler = (err, _req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).render("error", {
      code: 403,
      heading: "Forbidden",
      message:
        "Invalid or missing CSRF token. Please go back, refresh the page, and try again.",
    });
  }
  next(err);
};

module.exports = { csrfMiddleware, csrfErrorHandler };
