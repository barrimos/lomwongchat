const setRateLimit = require('express-rate-limit')
const { findSessionWithProjection, updateSessionOneField } = require('../plugins/handlerSession')
const fifteenTime = 1000 * 60 * 15 // 15 mins
const hourLimitTime = 1000 * 60
const isProd = process.env.NODE_ENV === 'production'

const overRefreshPage = limitTime => {
  const newExpires = Date.now() + limitTime

  return async (req, res) => {
    res.clearCookie('deviceId',
      {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        path: '/'
      }
    )
    res.clearCookie('sessionId',
      {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        path: '/'
      }
    )

    // Send a custom response and stop further middleware
    res.status(429).json({
      valid: false,
      error: `Maximum request limit. Try again at ${new Date(newExpires).toLocaleTimeString()}`,
    })
  }
}


const customHandler = limitTime => {
  return async (req, res) => {
    const { deviceId, sessionId } = req.cookies
    const { username } = req.headers

    try {
      let newExpires
      const session = await findSessionWithProjection(sessionId, deviceId, username, { expiresAt: 1, unlockAt: 1 })
      if (!session.unlockAt) {
        // set new TTL
        newExpires = Date.now() + limitTime
        await updateSessionOneField(sessionId, 'unlockAt', newExpires)
        console.log(`Set limit for session id: ${sessionId} success`)
      } else {
        // for alert user
        newExpires = Date.now() + limitTime
      }

      // Send a custom response and stop further middleware
      res.status(429).json({
        valid: false,
        isLocked: true,
        unlockAt: newExpires,
        error: `Maximum request limit. Try again at ${new Date(newExpires).toLocaleTimeString()}`,
      })
    } catch (err) {
      console.error(`Error setting rate limit for session id: ${sessionId}, ${err}`)
      return res.status(429).end()
    }
  }
}

// Rate limit middleware
const rateLimiterLogin = setRateLimit({
  windowMs: fifteenTime,
  max: 3,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: customHandler(fifteenTime)
})

const rateLimiterAuthen = setRateLimit({
  windowMs: fifteenTime,
  max: 10,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: customHandler(fifteenTime)
})

const rateLimiterPreventRefreshLoginPage = setRateLimit({
  windowMs: hourLimitTime,
  max: 10,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: overRefreshPage(hourLimitTime)
})

const rateLimiterRegistration = setRateLimit({
  windowMs: hourLimitTime,
  max: 3,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: overRefreshPage(hourLimitTime)
})

const rateLimiterCreateChannel = setRateLimit({
  windowMs: fifteenTime,
  max: 3,
  headers: true,
  keyGenerator: req => req.headers['x-forwarded-for'] || req.ip,
  handler: customHandler(fifteenTime)
})

module.exports = { rateLimiterLogin, rateLimiterAuthen, rateLimiterPreventRefreshLoginPage, rateLimiterRegistration, rateLimiterCreateChannel }