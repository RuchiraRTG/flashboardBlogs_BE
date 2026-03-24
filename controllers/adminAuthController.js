const jwt = require('jsonwebtoken');

const getAdminConfig = () => ({
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  jwtSecret: process.env.ADMIN_JWT_SECRET || 'change-this-in-production',
  jwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h'
});

// POST /api/admin/sign-in
// Body: { username, password }
const signInAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const config = getAdminConfig();
    const isValid = username === config.username && password === config.password;

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const token = jwt.sign(
      {
        role: 'admin',
        username: config.username
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: config.jwtExpiresIn,
        user: {
          username: config.username,
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
        username: req.admin.username,
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
