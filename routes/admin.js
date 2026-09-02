/**
 * Admin dashboard routes.
 */

const express = require("express");
const imageService = require("../services/image");
const { timingSafeStringEqual } = require("../lib/crypto");
const requireAdmin = require("../middleware/requireAdmin");
const { createRateLimiter } = require("../middleware/rateLimit");
const { ADMIN_USERNAME, ADMIN_PASSWORD } = require("../config");

const router = express.Router();
const loginLimiter = createRateLimiter({ max: 10 });

router.get("/admin/login", (req, res) => {
  if (req.session?.isAdmin) return res.redirect("/admin");
  res.render("admin/login", { error: null });
});

router.post("/admin/login", loginLimiter, (req, res, next) => {
  const { username = "", password = "" } = req.body;

  const userMatch = timingSafeStringEqual(username, ADMIN_USERNAME);
  const passMatch = timingSafeStringEqual(password, ADMIN_PASSWORD);

  if (!userMatch || !passMatch) {
    return res.status(401).render("admin/login", {
      error: "Invalid username or password.",
    });
  }

  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.isAdmin = true;
    res.redirect("/admin");
  });
});

router.post("/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

router.get("/admin", requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const { images, total, totalPages } = await imageService.listImages(page);
  res.render("admin/dashboard", { images, total, page, totalPages });
});

router.delete("/admin/images/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, error: "Invalid ID" });
  }
  await imageService.deleteImage(id);
  res.json({ success: true });
});

module.exports = router;
