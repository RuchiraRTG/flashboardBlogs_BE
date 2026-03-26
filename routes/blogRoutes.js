const express = require('express');
const router = express.Router();
const {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware');

// POST   /api/blogs       → Create a new blog
// GET    /api/blogs       → Get all blogs
router.route('/').post(requireAdminAuth, createBlog).get(getAllBlogs);

// GET    /api/blogs/:id   → Get a single blog
// PUT    /api/blogs/:id   → Update a blog
// DELETE /api/blogs/:id   → Delete a blog
router.route('/:id').get(getBlogById).put(requireAdminAuth, updateBlog).delete(requireAdminAuth, deleteBlog);

module.exports = router;
