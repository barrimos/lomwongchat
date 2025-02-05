const mongoose = require('mongoose')
const Schema = mongoose.Schema

const sessionSchema = new Schema({
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
  unlockAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  checked: {
    type: Boolean,
    default: false
  }
})

const sessionModel = mongoose.model('session', sessionSchema, 'session')
module.exports = sessionModel