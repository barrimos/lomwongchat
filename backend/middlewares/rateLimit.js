const setRateLimit = require('express-rate-limit')
const { findSessionWithProjection, logoutSession, updateSessionOneField } = require('../plugins/handlerSession')
const { logoutUserByUsername } = require('../plugins/handlerUser')
const fifteenTime = 1000 * 60 * 15 // 15 mins
const hourLimitTime = 1000 * 60


const overRefreshPage = limitTime => {
  const newExpires = new Date().getTime() + limitTime
  return async (req, res) => {
    res.clearCookie('captcha',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/'
      }
    )
    res.clearCookie('deviceId',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/'
      }
    )
    res.clearCookie('sessionId',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
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
        newExpires = new Date().getTime() + limitTime
        await updateSessionOneField(sessionId, 'unlockAt', newExpires)
        console.log(`Set limit for session id: ${sessionId} success`)

        // Schedule reset of unlockAt after rate limit window ends
        setTimeout(async () => {
          await updateSessionOneField(sessionId, 'unlockAt', null)
          console.log(`unlockAt reset for session: ${sessionId}`)
        }, limitTime)
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
  max: 5,
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