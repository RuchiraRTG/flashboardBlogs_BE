const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware');

// POST   /api/categories       → Create a new category
// GET    /api/categories       → Get all categories
router.route('/').post(requireAdminAuth, createCategory).get(getAllCategories);

// GET    /api/categories/:id   → Get a single category
// PUT    /api/categories/:id   → Update a category
// DELETE /api/categories/:id   → Delete a category
router.route('/:id').get(getCategoryById).put(requireAdminAuth, updateCategory).delete(requireAdminAuth, deleteCategory);

module.exports = router;
