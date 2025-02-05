const express = require('express')
const http = require('node:http')
const path = require('node:path')
const session = require('express-session')
require('dotenv').config()
const config = require('../config')

const general = require('./routers/general')
const user = require('./routers/user')
const data = require('./routers/data')
const disputeResolution = require('./routers/disputeResolution')

const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const ioconnect = require('../sockets/socket')
const redis = require('redis')
const REDIS_PORT = 6379
const url = process.env.NODE_ENV === 'production' ? { url: process.env.UPSTASH_REDIS_REST_URL } : { port: REDIS_PORT }

const options = {
  origin: '*',
  credentials: true,
}

const app = express()
const server = http.createServer(app)

ioconnect(server, options)
const client = redis.createClient(url)
client.connect()
client.on('connect', () => console.log('Redis Client Connected'))
client.on('error', (err) => console.log('Redis Client Connection Error', err))

app.use(cors(options))
app.use(morgan('tiny'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// connect.sid
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: true,
  saveUninitialized: true,
  rolling: false,
  cookie: {
    httpOnly: true, // Prevents JavaScript access to cookies
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'Lax', // Allow cross-origin in production
    maxAge: 86400000, // 1 day
  }
}))

if (process.env.ISVERCEL) {
  const mongoUri = process.env.NODE_ENV === 'production' ? config.mongoUri : 'mongodb://localhost:27017/lomwongchat'
  const mongoOption = process.env.NODE_ENV === 'production' ? config.mongoOptions : {}

  app.use(async (req, res, next) => {
    await mongoose.connect(mongoUri, mongoOption)
    return next()
  })
}

// for load image in dipute page
app.use('/uploads', express.static(path.join(__dirname, '../', 'uploads')))

app.use('/general', general) // check 1
app.use('/user', user) // check 5
app.use('/data', data) // check 1
app.use('/disputeResolution', disputeResolution) // check 5

app.use('*', (req, res, next) => {
  res.status(404).json({ error: 'Invalid page' })
})

module.exports = server