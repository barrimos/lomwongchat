const mongoose = require('mongoose')
const Schema = mongoose.Schema

const chatLogsSchema = new Schema({
  room: {
    type: String,
    required: true,
    unique: true
  },
  chatLogs: {
    type: Object,
    default: []
  }
})

const channelModel = mongoose.model('channels', chatLogsSchema, 'channels')
const privateRoomModel = mongoose.model('privateRooms', chatLogsSchema, 'privateRooms')

module.exports = { channelModel, privateRoomModel }