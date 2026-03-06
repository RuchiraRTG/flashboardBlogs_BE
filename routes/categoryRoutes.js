const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// POST   /api/categories       → Create a new category
// GET    /api/categories       → Get all categories
router.route('/').post(createCategory).get(getAllCategories);

// GET    /api/categories/:id   → Get a single category
// PUT    /api/categories/:id   → Update a category
// DELETE /api/categories/:id   → Delete a category
router.route('/:id').get(getCategoryById).put(updateCategory).delete(deleteCategory);

module.exports = router;
