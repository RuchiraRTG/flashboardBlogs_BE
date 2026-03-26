const express = require('express');
const router = express.Router();
const {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  checkArticleDeleteSafety
} = require('../controllers/articleController');
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware');

// GET  /api/articles          → All published articles (?lang=en|si  ?topic=<id>)
// POST /api/articles          → Create a new article
router.route('/').get(getAllArticles).post(requireAdminAuth, createArticle);

// GET    /api/articles/:slug/delete-check → Dry-run check before deleting an article
router.get('/:slug/delete-check', requireAdminAuth, checkArticleDeleteSafety);

// GET    /api/articles/:slug  → Full article by slug (?lang=en|si) – used by BlogReader
// PATCH  /api/articles/:slug  → Update article
// DELETE /api/articles/:slug  → Delete article
router.route('/:slug').get(getArticleBySlug).patch(requireAdminAuth, updateArticle).delete(requireAdminAuth, deleteArticle);

module.exports = router;
