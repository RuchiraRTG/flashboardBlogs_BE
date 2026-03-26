const User = require('../models/UserModel');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const toBool = (value) => String(value || '').trim().toLowerCase() === 'true';

const seedAdminUserFromEnv = async () => {
  const bootstrapEnabled = toBool(process.env.BOOTSTRAP_ADMIN_ON_STARTUP);
  if (!bootstrapEnabled) {
    return;
  }

  const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';

  if (!adminEmail || !adminPassword) {
    console.warn('Bootstrap is enabled but ADMIN_BOOTSTRAP_EMAIL or ADMIN_BOOTSTRAP_PASSWORD is missing; skipping admin user seed.');
    return;
  }

  if (!isValidEmail(adminEmail)) {
    console.warn('ADMIN_BOOTSTRAP_EMAIL is invalid; skipping admin user seed.');
    return;
  }

  if (adminPassword.length < 12) {
    console.warn('ADMIN_BOOTSTRAP_PASSWORD should be at least 12 characters for production-grade security.');
  }

  const existingUser = await User.findOne({ email: adminEmail });
  if (existingUser) {
    return;
  }

  const user = new User({
    email: adminEmail,
    role: 'admin',
    isActive: true
  });

  await user.setPassword(adminPassword);
  await user.save();

  console.log(`Seeded admin user for ${adminEmail}.`);
};

module.exports = {
  seedAdminUserFromEnv
};
