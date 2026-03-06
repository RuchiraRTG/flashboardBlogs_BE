const mongoose = require('mongoose');

// Topic Schema – stores bilingual topic names
const topicSchema = new mongoose.Schema(
  {
    // Topic name in English
    en: {
      type: String,
      required: [true, 'English topic name is required'],
      trim: true,
      unique: true
    },

    // Topic name in Sinhala
    si: {
      type: String,
      required: [true, 'Sinhala topic name is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Topic', topicSchema);
