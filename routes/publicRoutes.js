const express = require('express');
const router = express.Router();

const { getAllTopics } = require('../controllers/topicController');
const { getArticleBySlug } = require('../controllers/articleController');

// GET /api/public/topics?lang=en|si
// Returns topic sections with article links for home/sidebar navigation
router.get('/topics', getAllTopics);

// GET /api/public/articles/:slug?lang=en|si
// Returns a published article payload for BlogReader
router.get('/articles/:slug', getArticleBySlug);

module.exports = router;
