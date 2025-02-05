const mongoose = require('mongoose')
const server = require('./api/index')
const config = require('./config')

const boot = async () => {
  const mongoUri = process.env.NODE_ENV === 'production' ? config.mongoUri : 'mongodb://localhost:27017/lomwongchat'
  const mongoOption = process.env.NODE_ENV === 'production' ? config.mongoOptions : {}

  await mongoose.connect(mongoUri, mongoOption)
  server.listen(config.port, () => {
    console.log(`server lomwongchat listening on ${config.port}`)
  })
}

boot()