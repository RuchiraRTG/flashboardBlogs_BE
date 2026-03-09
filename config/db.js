const mongoose = require('mongoose');

// Connect to MongoDB using the URI from the .env file
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit the process if the database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
