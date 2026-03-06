const express = require('express');
const router = express.Router();
const {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic
} = require('../controllers/topicController');

// POST   /api/topics       → Create a new topic
// GET    /api/topics       → Get all topics
router.route('/').post(createTopic).get(getAllTopics);

// GET    /api/topics/:id   → Get a single topic
// PUT    /api/topics/:id   → Update a topic
// DELETE /api/topics/:id   → Delete a topic
router.route('/:id').get(getTopicById).put(updateTopic).delete(deleteTopic);

module.exports = router;
