const process = require('process');

let client;

if (process.env.NODE_ENV === 'production') {
  // Production: Use HTTP REST SDK designed for Vercel
  const { Redis } = require('@upstash/redis');
  
  client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  console.log('Redis Client Configured (HTTP REST for Production)');
} else {
  // Local: Use standard TCP connection
  const redis = require('redis');
  client = redis.createClient({ url: 'redis://localhost:6379' });
  
  client.connect()
    .then(() => console.log('Local Redis Client Connected'))
    .catch((err) => console.error('Local Redis Connection Error', err));
}

module.exports = client;
