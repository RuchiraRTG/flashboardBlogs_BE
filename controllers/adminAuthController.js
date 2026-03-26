const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// POST /api/admin/sign-in
// Body: { email, password }
const signInAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const jwtSecret = process.env.ADMIN_JWT_SECRET || 'change-this-in-production';
    const jwtExpiresIn = process.env.ADMIN_JWT_EXPIRES_IN || '12h';

    const token = jwt.sign(
      {
        role: 'admin',
        userId: user._id,
        email: user.email
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: jwtExpiresIn,
        user: {
          email: user.email,
          role: 'admin'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/admin/me
// Header: Authorization: Bearer <token>
const getAdminSession = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        userId: req.admin.userId,
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  signInAdmin,
  getAdminSession
};
