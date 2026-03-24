const express = require('express');
const router = express.Router();

const { signInAdmin, getAdminSession } = require('../controllers/adminAuthController');
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware');

// POST /api/admin/sign-in
router.post('/sign-in', signInAdmin);

// GET /api/admin/me
router.get('/me', requireAdminAuth, getAdminSession);

module.exports = router;
