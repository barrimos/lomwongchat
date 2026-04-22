const mongoose = require('mongoose')
const server = require('./api/index')
const config = require('./config')
const { channelModel } = require('./models/chatLogs.model')

const boot = async () => {
  const mongoUri = process.env.NODE_ENV === 'production' ? config.mongoUri : 'mongodb://localhost:27017/lomwongchat'
  const mongoOption = process.env.NODE_ENV === 'production' ? config.mongoOptions : {}

  await mongoose.connect(mongoUri, mongoOption)
  server.listen(config.port, async () => {
    try {
      const lobby = await channelModel.findOne({ room: 'lobby' })
      if (!lobby) {
        const newChannel = new channelModel({ room: 'lobby' })
        await newChannel.save()
          .then(() => {
            console.log('Create initial channel lobby successful')
          })
          .catch(err => {
            console.error('Create initial channel lobby error: ', err)
          })
      }
    } catch (err) {
      console.error(err)
    }
    console.log(`server lomwongchat listening on ${config.port}`)
  })
}

boot()