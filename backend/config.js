require('dotenv').config()

module.exports = {
  isVercel: process.env.ISVERCEL,
  port: process.env.PORT || 8080,
  mongoUri: process.env.MONGO_URI,
  mongoOptions: {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD,
    dbName: process.env.MONGO_DATABASE,
    retryWrites: true,
    w: 'majority',
  },
}