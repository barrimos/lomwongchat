const redis = require('redis')
const REDIS_PORT = 6379
const url = process.env.NODE_ENV === 'production' ? { url: process.env.UPSTASH_REDIS_REST_URL } : { port: REDIS_PORT }
const client = redis.createClient(url)

client.connect()
client.on('connect', () => console.log('Redis Client Connected'))
client.on('error', (err) => console.log('Redis Client Connection Error', err))

module.exports = client