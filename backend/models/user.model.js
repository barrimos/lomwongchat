const mongoose = require('mongoose')
const Schema = mongoose.Schema

const usersSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: '301'
  },
  token: {
    type: Object,
    required: true,
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    }
  },
  devices: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    default: 'normal'
  },
  issue: {
    code: {
      type: String,
      default: '',
    },
    comment: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    status: {
      type: Boolean,
      default: false
    },
    requestClose: {
      type: Boolean,
      default: false
    }
  },
  dmLists: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  minimize: false
})

const userModel = mongoose.model('users', usersSchema, 'users')

module.exports = userModel