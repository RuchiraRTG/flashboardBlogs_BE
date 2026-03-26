const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const requireAdminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required.'
    });
  }

  try {
    const jwtSecret = process.env.ADMIN_JWT_SECRET || 'change-this-in-production';
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== 'admin' || !decoded.userId) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required.'
      });
    }

    const user = await User.findById(decoded.userId).select('email role isActive');
    if (!user || !user.isActive || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    req.admin = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = {
  requireAdminAuth
};
