require('dotenv').config()

let client

if (process.env.NODE_ENV === 'production') {
  // Production: Use HTTP REST SDK designed for Vercel
  const { Redis } = require('@upstash/redis')
  
  client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  
  console.log('Redis Client Configured (HTTP REST for Production)')
} else {
  // Local: Use standard TCP connection
  const redis = require('redis')
  client = redis.createClient({ url: 'redis://localhost:6379' })

  // กลุ่ม List
  client.lrange = (...args) => client.lRange(...args)
  client.rpush = (...args) => client.rPush(...args)
  client.llen = (...args) => client.lLen(...args)
  client.lpop = (...args) => client.lPop(...args)

  // กลุ่ม Hash
  client.hgetall = (...args) => client.hGetAll(...args)
  client.hset    = (...args) => client.hSet(...args) // (v4 ใช้ hSet)
  client.hget    = (...args) => client.hGet(...args) // (v4 ใช้ hGet)

  // กลุ่ม Set / อื่นๆ
  client.sadd    = (...args) => client.sAdd(...args)
  client.smembers = (...args) => client.sMembers(...args)
  
  client.connect()
    .then(() => console.log('Local Redis Client Connected'))
    .catch((err) => console.error('Local Redis Connection Error', err))
}

module.exports = client
