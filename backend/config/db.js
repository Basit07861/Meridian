const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.MONGO_URI.trim()) {
      throw new Error('MONGO_URI is missing. Please add it to backend/.env.');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw new Error('Database connection failed. Please check MongoDB connection string and ensure MongoDB is running.');
  }
};

module.exports = connectDB;
