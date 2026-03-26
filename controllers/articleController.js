const Article = require('../models/ArticleModel');
const Topic = require('../models/TopicModel');
const { deleteFromS3 } = require('../services/s3Service');

// ── GET /api/articles ────────────────────────────────────────────────────────
// Returns all published articles (list/summary view).
// Supports ?lang=en|si  and  ?topic=<topicId>
const getAllArticles = async (req, res) => {
  try {
    const lang = req.query.lang === 'si' ? 'si' : 'en';
    const filter = { isPublished: true };

    if (req.query.topic) {
      filter.topic = req.query.topic;
    }

    const articles = await Article.find(filter)
      .populate('topic', 'en si')
      .sort({ createdAt: -1 });

    const data = articles.map((article) => ({
      id: article._id,
      slug: article.slug,
      title: article[lang]?.title,
      category: article[lang]?.category,
      topic: article[lang]?.topic,
      image: article[lang]?.image,
      topicRef: {
        id: article.topic?._id,
        label: article.topic?.[lang]
      }
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/articles/:slug ──────────────────────────────────────────────────
// Returns a full article by slug, used by BlogReader.jsx.
// Supports ?lang=en|si
const getArticleBySlug = async (req, res) => {
  try {
    const lang = req.query.lang === 'si' ? 'si' : 'en';

    const article = await Article.findOne({
      slug: req.params.slug,
      isPublished: true
    }).populate('topic', 'en si');

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    const content = article[lang];

    res.status(200).json({
      success: true,
      data: {
        id: article._id,
        slug: article.slug,
        title: content.title,
        category: content.category,
        topic: content.topic,
        image: content.image,
        body: content.body,
        topicRef: {
          id: article.topic?._id,
          label: article.topic?.[lang]
        },
        updatedAt: article.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/articles ───────────────────────────────────────────────────────
// Creates a new article.
// Body: { slug, topic (ObjectId), en: { title, category, topic, image, body },
//         si: { title, category, topic, image, body }, isPublished? }
const createArticle = async (req, res) => {
  try {
    const { slug, topic, en, si, isPublished } = req.body;

    // Ensure the referenced topic exists
    const topicExists = await Topic.findById(topic);
    if (!topicExists) {
      return res.status(404).json({ success: false, message: 'Referenced topic not found.' });
    }

    const article = await Article.create({ slug, topic, en, si, isPublished });
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An article with this slug already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/articles/:slug ────────────────────────────────────────────────
// Updates an existing article by slug.
// Body: { topic?, en?, si?, isPublished? }
const updateArticle = async (req, res) => {
  try {
    const { topic, en, si, isPublished } = req.body;

    if (topic) {
      const topicExists = await Topic.findById(topic);
      if (!topicExists) {
        return res.status(404).json({ success: false, message: 'Referenced topic not found.' });
      }
    }

    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { topic, en, si, isPublished },
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── GET /api/articles/:slug/delete-check ────────────────────────────────────
// Dry-run delete check for article impact.
// Returns image counts and the exact S3 keys that would be deleted.
const checkArticleDeleteSafety = async (req, res) => {
  try {
    const article = await Article.findOne(
      { slug: req.params.slug },
      {
        slug: 1,
        'en.title': 1,
        'si.title': 1,
        'en.embeddedImages': 1,
        'si.embeddedImages': 1,
        'en.image': 1,
        'si.image': 1,
        isPublished: 1
      }
    );

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    const embeddedImages = [
      ...(article.en?.embeddedImages || []),
      ...(article.si?.embeddedImages || [])
    ];

    const uniqueKeys = [...new Set(embeddedImages.map((img) => img.s3Key).filter(Boolean))];

    res.status(200).json({
      success: true,
      data: {
        slug: article.slug,
        enTitle: article.en?.title || null,
        siTitle: article.si?.title || null,
        isPublished: article.isPublished,
        canDelete: true,
        impact: {
          embeddedImageReferenceCount: embeddedImages.length,
          uniqueS3ImageCount: uniqueKeys.length,
          uniqueS3Keys: uniqueKeys,
          heroImages: {
            en: article.en?.image || null,
            si: article.si?.image || null
          }
        },
        recommendation: 'Safe to delete if this article is no longer needed'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/articles/:slug ───────────────────────────────────────────────
// Deletes an article by slug.
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({ slug: req.params.slug });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    // Clean up embedded images from S3
    const allImages = [
      ...(article.en?.embeddedImages || []),
      ...(article.si?.embeddedImages || [])
    ];

    // Remove duplicate S3 keys
    const uniqueKeys = [...new Set(allImages.map((img) => img.s3Key).filter(Boolean))];

    // Delete all images from S3 in parallel
    await Promise.all(uniqueKeys.map((key) => deleteFromS3(key)));

    res.status(200).json({ success: true, message: 'Article and associated images deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  checkArticleDeleteSafety
};
