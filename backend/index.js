const mongoose = require('mongoose')
const server = require('./api/index')
const config = require('./config')


const boot = async () => {
  await mongoose.connect(process.env.NODE_ENV === 'production' ? config.mongoUri : 'mongodb://localhost:27017/lomwongchat', config.mongoOptions)
  server.listen(config.port, () => {
    console.log(`server listening on ${config.port}`)
  })
}

boot()