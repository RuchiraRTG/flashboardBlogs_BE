const mongoose = require('mongoose');

// Reusable bilingual content block (no separate _id needed)
const bilingualContentSchema = new mongoose.Schema(
  {
    // Display title for this language
    title: {
      type: String,
      required: true,
      trim: true
    },

    // Category label shown on the article page (matches topic name in that language)
    category: {
      type: String,
      required: true,
      trim: true
    },

    // Sub-topic tag shown as a pill badge
    topic: {
      type: String,
      trim: true
    },

    // Hero image URL (S3) – falls back to default in BlogReader if null
    image: {
      type: String,
      trim: true,
      default: null
    },

    // Full HTML body with embedded images – rendered with dangerouslySetInnerHTML in BlogReader
    // Images can be stored inline as S3 URLs via rich text editor
    body: {
      type: String,
      required: true
    },

    // Array of S3 keys for images embedded in this article
    // Used for cleanup when article is deleted
    embeddedImages: [
      {
        s3Key: {
          type: String,
          trim: true
        },
        url: {
          type: String,
          trim: true
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { _id: false }
);

// Article Schema – one document per slug, bilingual content stored inline
const articleSchema = new mongoose.Schema(
  {
    // URL-friendly identifier matching /blogs/:slug in the frontend
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true
    },

    // Reference to the parent Topic document
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic reference is required']
    },

    // English content block
    en: {
      type: bilingualContentSchema,
      required: [true, 'English content is required']
    },

    // Sinhala content block
    si: {
      type: bilingualContentSchema,
      required: [true, 'Sinhala content is required']
    },

    // Only published articles are returned to the frontend
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Article', articleSchema);
