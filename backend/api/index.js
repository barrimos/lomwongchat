const express = require('express')
const http = require('node:http')
const path = require('node:path')
const session = require('express-session')

const general = require('./routers/general')
const user = require('./routers/user')
const data = require('./routers/data')
const disputeResolution = require('./routers/disputeResolution')

const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const ioconnect = require('../sockets/socket')
const verify = require('../middlewares/verify')
const { default: mongoose } = require('mongoose')

const options = {
  origin: 'https://lomwongchat.vercel.app',
  methods: 'GET, POST, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, username, password, inputcaptcha, access, pairdeviceid, ticket',
  credentials: true,
  optionsSuccessStatus: 204
}


const app = express()
const server = http.createServer(app)

require('dotenv').config()
ioconnect(server, options)
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
app.use('/data', verify, data) // check 1
app.use('/disputeResolution', disputeResolution) // check 5

app.use('*', (req, res, next) => {
  res.status(404).json({ error: 'Invalid page' })
})

module.exports = server