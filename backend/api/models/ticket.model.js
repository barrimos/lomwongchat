const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ticketSchema = new Schema({
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true
  },
  reporter: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  idBubble: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  replies: {
    type: [],
    required: true
  },
  timeMessage: {
    type: Date,
    required: true
  },
  details: {
    type: String || undefined || null
  }
}, {
  timestamps: true
})

const ticketModel = mongoose.model('reports', ticketSchema, 'reports')

module.exports = ticketModel