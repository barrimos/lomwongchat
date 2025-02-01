const redis = require('redis')
const REDIS_PORT = 6379
const client = redis.createClient({
  port: REDIS_PORT,
})

client.connect()
client.on('connect', () => console.log('Redis Client Connected'))
client.on('error', (err) => console.log('Redis Client Connection Error', err))

module.exports = client