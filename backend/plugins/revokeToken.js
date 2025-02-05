const clientRedis = require('../redis/redisServer')

const revokeToken = async accessToken => {
  const now = Math.floor(new Date().getTime() / 1000) // Current time in seconds
  const tokenTTL = accessToken.split('.')[1].exp - now // Remaining lifespan of the token in seconds
  if (tokenTTL > 0) {
    // revoke token with Redis TTL after logout
    await clientRedis.SET(`revoke:token:${accessToken}`, tokenTTL, { NX: true, EX: tokenTTL })
  } else {
    console.error('Token is already expired')
  }
}

module.exports = revokeToken