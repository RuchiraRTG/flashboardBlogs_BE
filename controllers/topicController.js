const Topic = require('../models/TopicModel');

// ── POST /api/topics ─────────────────────────────────────────────────────────
// Create a new topic
const createTopic = async (req, res) => {
  try {
    const topic = await Topic.create(req.body);
    res.status(201).json(topic);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Topic already exists.' });
    }
    res.status(400).json({ message: error.message });
  }
};

// ── GET /api/topics ──────────────────────────────────────────────────────────
// Fetch all topics
const getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ en: 1 });
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/topics/:id ──────────────────────────────────────────────────────
// Fetch a single topic
const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    res.status(200).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/topics/:id ──────────────────────────────────────────────────────
// Update a topic
const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    res.status(200).json(topic);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE /api/topics/:id ───────────────────────────────────────────────────
// Delete a topic
const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    res.status(200).json({ message: 'Topic deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTopic, getAllTopics, getTopicById, updateTopic, deleteTopic };
