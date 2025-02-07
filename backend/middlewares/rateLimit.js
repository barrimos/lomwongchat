const setRateLimit = require('express-rate-limit')
const { findSessionWithProjection, logoutSession, updateSessionOneField } = require('../plugins/handlerSession')
const { logoutUserByUsername } = require('../plugins/handlerUser')
const resetTime = 1000 * 60 * 15 // 15 mins

const customHandler = async (req, res) => {
  const { deviceId, sessionId } = req.cookies
  const { username } = req.headers

  try {
    let newExpires
    const session = await findSessionWithProjection(sessionId, deviceId, username, { expiresAt: 1, unlockAt: 1 })
    if (!session.unlockAt) {
      // set new TTL
      newExpires = new Date().getTime() + resetTime
      await updateSessionOneField(sessionId, 'unlockAt', newExpires)
      console.log(`Set limit for session id: ${sessionId} success`)

      // Schedule reset of unlockAt after rate limit window ends
      setTimeout(async () => {
        await updateSessionOneField(sessionId, 'unlockAt', null)
        console.log(`unlockAt reset for session: ${sessionId}`)
      }, resetTime)
    } else {
      // for alert user
      newExpires = session.unlockAt
    }
    // log out session
    await logoutSession(sessionId, deviceId, username)
    res.clearCookie('accessToken',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/'
      }
    )
    res.clearCookie('ghostKey',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/'
      }
    )
    await logoutUserByUsername(username, deviceId)

    // Send a custom response and stop further middleware
    res.status(429).json({
      valid: false,
      error: `Maximum request limit. Try again at ${new Date(newExpires).toLocaleTimeString()}`,
    })
  } catch (err) {
    console.error(`Error setting rate limit for session id: ${sessionId}, ${err}`)
    return res.status(429).end()
  }
}

// Rate limit middleware
const rateLimiterLogin = setRateLimit({
  windowMs: resetTime,
  max: 3,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: customHandler
})

const rateLimiterAuthen = setRateLimit({
  windowMs: resetTime,
  max: 5,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: customHandler
})

module.exports = { rateLimiterLogin, rateLimiterAuthen }
