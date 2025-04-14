// Database configuration for People X
const { Pool } = require('pg');
const mongoose = require('mongoose');
const redis = require('redis');

// PostgreSQL configuration
const pgConfig = {
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'people_x',
  password: process.env.PG_PASSWORD || 'postgres',
  port: process.env.PG_PORT || 5432,
};

const pgPool = new Pool(pgConfig);

// MongoDB configuration
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/people_x';

const connectMongo = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis configuration
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection error:', error);
    // Not exiting process as Redis is optional
  }
};

module.exports = {
  pgPool,
  connectMongo,
  connectRedis,
  redisClient,
};
