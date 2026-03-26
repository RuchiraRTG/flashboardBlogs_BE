const express = require('express');
const router = express.Router();
const {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic
} = require('../controllers/topicController');
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware');

// POST   /api/topics       → Create a new topic
// GET    /api/topics       → Get all active topics with article items (?lang=en|si)
router.route('/').post(requireAdminAuth, createTopic).get(getAllTopics);

// GET    /api/topics/:id   → Get a single topic
// PATCH  /api/topics/:id   → Update a topic
// DELETE /api/topics/:id   → Delete a topic (blocked if articles are linked)
router.route('/:id').get(getTopicById).patch(requireAdminAuth, updateTopic).delete(requireAdminAuth, deleteTopic);

module.exports = router;
