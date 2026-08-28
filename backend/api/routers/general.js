const express = require('express')
const { randomUUID } = require('crypto')
const handleGeneralEndpointRouter = express.Router()
const { encrypt } = require('../../plugins/cipher')
const { findSessionWithProjection } = require('../../plugins/handlerSession')
const { rateLimiterPreventRefreshLoginPage } = require('../../middlewares/rateLimit')
const clientRedis = require('../../redis/redisServer')

handleGeneralEndpointRouter.get('/:action', rateLimiterPreventRefreshLoginPage, async (req, res) => {
	const { action } = req.params
	const { username } = req.headers
	const { deviceId, sessionId } = req.cookies
  const isProd = process.env.NODE_ENV === 'production'

	if (action === 'healthz') {
    const awakeRedis = await clientRedis.ping()
		res.status(200).json(awakeRedis)
	}

	if (action === 'getRemainsAttempts') {
		try {
			// get attempts
			const session = await findSessionWithProjection(sessionId, deviceId, username, { attempts: 1 })

			if (!session) throw Error('Require session id')

			return res.status(200).json({ remains: session.attempts ?? 3 })
		} catch (err) {
			console.error(`Error Get remains: ${err}`)
			return res.status(400).json({ error: 'Get remains error', remains: 3 })
		}
	}

  if (action === 'stayCheck') {
    try {
      // read cache first
      const cacheSession = await clientRedis.json.get('users', {
        path: `$.${username}.sessionAlive.expiresAt`
      })

      if (!cacheSession || !cacheSession.length) {
        return res.status(200).end()
      }

      // if found session that mean client was leaving without logged out
      // calc remaining session
      const remainingSession = cacheSession?.[0] - Date.now()
      // if session less than 1 min let client make login again
      if (remainingSession < 60000) {
        await clientRedis.json.del('users', `$.${username}.sessionAlive`)
        return res.status(200).end()
      }

      // if session remaining more than 1 min do auto login
      return res.status(200).json({ remainingSession })
    } catch (err) {
      return res.status(400).json({ error: 'Checking session error' })
    }
  }

	if (action === 'session') {
		if (!req.cookies.sessionId) {
			const sessionId = encrypt(randomUUID(), process.env.SESSION_KEY, process.env.SESSION_IV)
			res.cookie('sessionId', sessionId, {
				httpOnly: true,
				secure: isProd,
				sameSite: isProd ? 'None' : 'Lax',
				maxAge: 86400000
			})
		}
    return res.status(200).end()
	}
})

module.exports = handleGeneralEndpointRouter