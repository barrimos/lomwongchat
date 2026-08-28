const mongoose = require('mongoose')
const Schema = mongoose.Schema

const sessionSchema = new Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  attempts: {
    type: Number,
    required: true
  },
  ip: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true
  },
  agent: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true,
  },
  isLoggedIn: {
    type: Boolean,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Number,
    required: true
  },
  unlockAt: {
    type: Number || null,
    default: null
  },
  checked: {
    type: Boolean,
    default: false
  }
})

const sessionModel = mongoose.model('session', sessionSchema, 'session')
module.exports = sessionModel