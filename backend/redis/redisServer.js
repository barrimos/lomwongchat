const redis = require('redis')
const REDIS_PORT = 6379
const option = process.env.NODE_ENV === 'production' ?
  {
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  }
  : { port: REDIS_PORT }

const client = redis.createClient(option)
client.on('connect', () => console.log('Redis Client Connected'))
client.on('error', (err) => console.log('Redis Client Connection Error', err))

module.exports = client