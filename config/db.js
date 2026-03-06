const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google DNS (8.8.8.8) for all lookups.
// This fixes querySrv ECONNREFUSED errors caused by mobile hotspot DNS servers
// that don't properly handle SRV record queries required by mongodb+srv:// URIs.
dns.setServers(['8.8.8.8', '8.8.4.4']);

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
