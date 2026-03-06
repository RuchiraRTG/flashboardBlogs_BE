const mongoose = require('mongoose');

// Category Schema – stores bilingual category names
const categorySchema = new mongoose.Schema(
  {
    // Category name in English
    en: {
      type: String,
      required: [true, 'English category name is required'],
      trim: true,
      unique: true
    },

    // Category name in Sinhala
    si: {
      type: String,
      required: [true, 'Sinhala category name is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Category', categorySchema);
