const mongoose = require('mongoose');

// Blog Schema – mirrors the data structure used in the frontend
const blogSchema = new mongoose.Schema(
  {
    // English title (required)
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true
    },

    // Sinhala title (required)
    titleSi: {
      type: String,
      required: [true, 'Sinhala blog title is required'],
      trim: true
    },

    // Blog content – stored as HTML (from ReactQuill rich-text editor)
    content: {
      type: String,
      required: [true, 'Blog content is required']
    },

    // Sinhala content
    contentSi: {
      type: String,
      required: [true, 'Sinhala blog content is required']
    },

    // Category name in English
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },

    // Category name in Sinhala
    categorySi: {
      type: String,
      required: [true, 'Sinhala category is required'],
      trim: true
    },

    // Topic name in English
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true
    },

    // Topic name in Sinhala
    topicSi: {
      type: String,
      default: ''
    },

    // Display date (e.g. "2024-01-15")
    date: {
      type: String,
      default: () => new Date().toLocaleDateString()
    }

    // NOTE: Images are NOT stored in the database at this stage.
    // Add an 'image' field here (e.g. a Cloudinary URL) when ready.
  },
  {
    // Automatically adds 'createdAt' and 'updatedAt' timestamps
    timestamps: true
  }
);

module.exports = mongoose.model('Blog', blogSchema);
