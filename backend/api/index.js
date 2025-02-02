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
const ioconnect = require('./sockets/socket')
const verify = require('./middlewares/verify')

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',') // Convert the comma-separated string to an array
  : ['http://localhost:3000', 'http://127.0.0.1:3000']

const options = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}

const app = express()
const server = http.createServer(app)

require('dotenv').config()
ioconnect(server, options)
app.use(morgan('tiny'))
app.use(cors(options))
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