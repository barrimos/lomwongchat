const express = require('express')
const http = require('node:http')
const path = require('node:path')

const general = require('./routers/general')
const user = require('./routers/user')
const data = require('./routers/data')
const disputeResolution = require('./routers/disputeResolution')

const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const ioconnect = require('../sockets/socket')
const { default: mongoose } = require('mongoose')
const config = require('../config')
require('dotenv').config()

const app = express()

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',') // Convert the comma-separated string to an array
  : ['https://lomwongchat.vercel.app', 'https://lomwongchat.onrender.com']

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: 'OPTIONS, GET, POST, PUT, PATCH, DELETE',
  allowedHeaders: 'Content-Type, access, username, password, pairdeviceid, inputcaptcha',
  credentials: true,
}

app.options('*', cors(corsOptions))
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
  } else {
    next()
  }
})
app.use(cors(corsOptions))

const server = http.createServer(app)


if (config.isVercel) {
  app.use(async (req, res, next) => {
    await mongoose.connect(config.mongoUri, config.mongoOptions)
    next()
  })
}


ioconnect(server, corsOptions)
app.use(morgan('tiny'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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