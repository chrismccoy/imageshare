/**
 * Middleware that requires an active admin session.
 */
const requireAdmin = (req, res, next) => {
  if (req.session?.isAdmin) return next();
  res.redirect("/admin/login");
};

module.exports = requireAdmin;
