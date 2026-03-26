const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PASSWORD_SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'user'
  }
);

userSchema.pre('save', function normalizeEmail(next) {
  if (this.isModified('email')) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

userSchema.methods.setPassword = async function setPassword(rawPassword) {
  this.passwordHash = await bcrypt.hash(rawPassword, PASSWORD_SALT_ROUNDS);
};

userSchema.methods.comparePassword = async function comparePassword(rawPassword) {
  if (!this.passwordHash) {
    return false;
  }

  return bcrypt.compare(rawPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
