 /**
 * Security & File Upload Middleware
 * 
 * Includes:
 * - Request size limits
 * - CORS headers for S3 resources
 * - Rate limiting for upload endpoints
 * - Content Security Policy (CSP) headers
 */

const express = require('express');

/**
 * Middleware: Enforce strict request size limits
 * Prevents large payload attacks
 */
const requestSizeLimits = express.json({
  limit: '50mb' // Total request body limit
});

/**
 * Middleware: Add security headers for S3 resources
 * Ensures S3-hosted images can be embedded safely
 */
const addSecurityHeaders = (req, res, next) => {
  // Allow S3 URLs in image sources
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com data:; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Disable content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Require HTTPS on production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

/**
 * Middleware: Rate limiting for upload endpoints
 * Use in combination with a rate limiting package like express-rate-limit
 * This is a basic implementation; for production, use express-rate-limit
 */
const uploadRateLimitMap = new Map();

const uploadRateLimit = (req, res, next) => {
  // Use IP address as identifier
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 uploads per minute

  if (!uploadRateLimitMap.has(ip)) {
    uploadRateLimitMap.set(ip, []);
  }

  const timestamps = uploadRateLimitMap.get(ip);
  const recentRequests = timestamps.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many upload requests. Please try again later.'
    });
  }

  recentRequests.push(now);
  uploadRateLimitMap.set(ip, recentRequests);

  // Cleanup old entries to prevent memory leak
  if (uploadRateLimitMap.size > 1000) {
    const oldestIp = uploadRateLimitMap.keys().next().value;
    uploadRateLimitMap.delete(oldestIp);
  }

  next();
};

/**
 * Middleware: Validate article content before saving to database
 * Ensures HTML doesn't contain malicious scripts
 */
const sanitizeArticleContent = (req, res, next) => {
  if (req.body.en?.body) {
    // Basic XSS prevention - remove script tags
    req.body.en.body = req.body.en.body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (req.body.si?.body) {
    req.body.si.body = req.body.si.body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  next();
};

module.exports = {
  requestSizeLimits,
  addSecurityHeaders,
  uploadRateLimit,
  sanitizeArticleContent
};
