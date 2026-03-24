// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const blogRoutes = require('./routes/blogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const topicRoutes = require('./routes/topicRoutes');
const articleRoutes = require('./routes/articleRoutes');
const imageRoutes = require('./routes/imageRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Import middleware
const { requestSizeLimits, addSecurityHeaders, sanitizeArticleContent } = require('./middleware/securityMiddleware');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// ── Security Middleware ────────────────────────────────────────────────────

// Add security headers to all responses
app.use(addSecurityHeaders);

// Enable CORS so the frontend can talk to this server
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse incoming JSON request bodies with size limits
app.use(requestSizeLimits);
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/articles', sanitizeArticleContent, articleRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/public', publicRoutes);

// Health check – useful to confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'FlashBoard Blogs API is running.' });
});

// ── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Error Handler ───────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ── Start server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
