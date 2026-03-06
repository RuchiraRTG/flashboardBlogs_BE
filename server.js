// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const blogRoutes = require('./routes/blogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const topicRoutes = require('./routes/topicRoutes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────

// Enable CORS so the frontend can talk to this server
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Parse incoming JSON request bodies
app.use(express.json({ limit: '10mb' })); // 10mb limit to handle rich-text content
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/topics', topicRoutes);

// Health check – useful to confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'FlashBoard Blogs API is running.' });
});

// ── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Start server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
