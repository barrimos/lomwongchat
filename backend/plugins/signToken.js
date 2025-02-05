const nodeCrypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const clientRedis = require('../redis/redisServer')

const signToken = async (username, role, isRefExpired = false, currKid = null) => {
  const kid = isRefExpired ? await nodeCrypto.randomBytes(4).toString('hex') : currKid
  if (!kid) {
    return Error('Key Id not found')
  }

  try {
    const newToken = {}

    const accessToken = await jwt.sign(
      { username: username, role: role, kid: kid },
      process.env.ACCESS_KEY,
      {
        header: { kid: kid, tokenType: 'access' },
        expiresIn: 900
      }
    )

    newToken.accessToken = accessToken

    if (isRefExpired) {
      const refreshToken = await jwt.sign(
        { username: username, role: role, kid: kid },
        process.env.REFRESH_KEY,
        {
          header: { kid: kid, tokenType: 'refresh' },
          expiresIn: 86400 * 7
        }
      )
      newToken.refreshToken = refreshToken
    }

    // nonce
    try {
      await clientRedis.SET(`users:${username}:nonce`, kid, { EX: 900 }) // เก็บ Nonce 15 นาที
    } catch (err) {
      console.error('Error caching signature:', err)
    }

    return newToken
  } catch (err) {
    console.error('Signation error', err)
    return
  }
}

module.exports = signToken