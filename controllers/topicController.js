const Topic = require('../models/TopicModel');
const Article = require('../models/ArticleModel');

// ── GET /api/topics ──────────────────────────────────────────────────────────
// Returns all active topics with their published article items.
// Supports ?lang=en (default) or ?lang=si
// Shape matches knowledgeSections[language] used in home.jsx and BlogReader sidebar.
const getAllTopics = async (req, res) => {
  try {
    const lang = req.query.lang === 'si' ? 'si' : 'en';

    const topics = await Topic.find({ isActive: true }).sort({ createdAt: 1 });

    const sections = await Promise.all(
      topics.map(async (topic) => {
        const articles = await Article.find(
          { topic: topic._id, isPublished: true },
          { slug: 1, [`${lang}.title`]: 1 }
        ).sort({ createdAt: 1 });

        const items = articles.map((article) => ({
          slug: article.slug,
          title: article[lang]?.title || article.en?.title || ''
        }));

        return {
          id: topic._id,
          title: topic[lang],
          items
        };
      })
    );

    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/topics/:id ──────────────────────────────────────────────────────
// Fetch a single topic by ID
const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/topics ─────────────────────────────────────────────────────────
// Create a new topic
// Body: { en: string, si: string }
const createTopic = async (req, res) => {
  try {
    const { en, si } = req.body;
    const topic = await Topic.create({ en, si });
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A topic with this English name already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/topics/:id ────────────────────────────────────────────────────
// Update a topic
// Body: { en?, si?, isActive? }
const updateTopic = async (req, res) => {
  try {
    const { en, si, isActive } = req.body;
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { en, si, isActive },
      { new: true, runValidators: true }
    );
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/topics/:id ───────────────────────────────────────────────────
// Delete a topic – blocked if any articles are still linked to it
const deleteTopic = async (req, res) => {
  try {
    const articleCount = await Article.countDocuments({ topic: req.params.id });
    if (articleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete topic: ${articleCount} article(s) are linked to it.`
      });
    }

    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    res.status(200).json({ success: true, message: 'Topic deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTopic, getAllTopics, getTopicById, updateTopic, deleteTopic };

