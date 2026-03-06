const Category = require('../models/CategoryModel');

// ── POST /api/categories ─────────────────────────────────────────────────────
// Create a new category
const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    // Handle duplicate category (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists.' });
    }
    res.status(400).json({ message: error.message });
  }
};

// ── GET /api/categories ──────────────────────────────────────────────────────
// Fetch all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ en: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/categories/:id ──────────────────────────────────────────────────
// Fetch a single category
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/categories/:id ──────────────────────────────────────────────────
// Update a category
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE /api/categories/:id ───────────────────────────────────────────────
// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
