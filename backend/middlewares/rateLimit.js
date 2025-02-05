const setRateLimit = require('express-rate-limit')
const { findSession, logoutSession } = require('../plugins/handlerSession')
const { logoutUserByUsername } = require('../plugins/handlerUser')
const resetTime = 1000 * 60 * 15 // 15 mins

// Rate limit middleware
const rateLimiter = setRateLimit({
  windowMs: resetTime,
  max: 3,
  headers: true,
  keyGenerator: req => req.headers["x-forwarded-for"] || req.ip,
  handler: async (req, res) => {
    const { deviceId } = req.cookies
    const { username } = req.headers
    const session = await findSession(deviceId, username, { unlockAt: 1 })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (!session.unlockAt) {
      session.unlockAt = new Date().getTime() + resetTime
      await session.save()
    }

    // log out session
    await logoutSession(deviceId, username)
    res.clearCookie('accessToken')
    res.clearCookie('ghostKey')
    await logoutUserByUsername(username, deviceId)

    // Send a custom response and stop further middleware
    res.status(429).json({
      valid: false,
      error: `Maximum request limit. Try again at ${new Date(session.unlockAt).toLocaleTimeString()}`,
    })
  },
})

module.exports = rateLimiter
