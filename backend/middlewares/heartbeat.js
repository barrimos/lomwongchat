const SessionModel = require('../models/session.model')
const { checkIsLoggedIn } = require('../plugins/handlerSession')
const handleValidate = require('../plugins/handleValidate')
const clientRedis = require('../redis/redisServer')
const handlerError = require('./handlerError')

const heartbeat = async (req, res, next) => {
  const { username } = req.headers
  const sid = req.sessionID

  try {
    // if session in database doesn't exist (expires or accident delete) catch Error
    const { isLoggedIn } = await checkIsLoggedIn(sid, username)
    if (!isLoggedIn) {
      return next()
    }
  } catch (err) {
    console.error(`Error check state login: ${err}`)
    await logoutSession(sid)
    res.clearCookie('accessToken')
    res.clearCookie('ghostKey')
    handleValidate.error.notFound.message = 'Session timeout, Login again'
    return handlerError(handleValidate.error.notFound, req, res, next)
  }

  if (req.verified.extend) {
    try {
      const isExists = await clientRedis.EXISTS(`session:${username}:${sid}`)
      if (!isExists) {
        console.error('Error session doesn\'t exists')
        handleValidate.error.notFound.message = 'Session id not found'
        await logoutSession(sid)
        res.clearCookie('accessToken')
        res.clearCookie('ghostKey')
        return handlerError(handleValidate.error.notFound, req, res, next)
      }

      // reset session TTL
      console.log(`Session ${username}:${sid} TTL in cache reset`)
      await clientRedis.EXPIRE(`session:${username}:${sid}`, 1800) // 30 minutes

      // reset new session cookies expire
      req.session.cookie.maxAge = 30 * 60 * 1000 // 30 minutes
      req.session.lastRenewal = Date.now()
      req.session.save((err) => {
        if (err) {
          console.error('Session reset TTL in cookies error:', err);
        } else {
          console.log(`Session ${username}:${sid} TTL in cookies reset`)
        }
      })

      // update in database
      const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      const result = await SessionModel.updateOne(
        { sessionId: sid },
        { $set: { expiresAt: newExpiresAt } },
        { new: true, upsert: true } // update expires time
      )
      if (result.modifiedCount === 0) {
        console.error('Failed to update session in database')
      } else {
        console.log(`Session ${username}:${sid} TTL in database reset`)
      }

    } catch (err) {
      console.error(`Error heartbeat check: ${err}`)
      await logoutSession(sid)
      res.clearCookie('accessToken')
      res.clearCookie('ghostKey')
      return handlerError(handleValidate.error.internal, req, res, next)
    }
  }

  next()
}

module.exports = heartbeat