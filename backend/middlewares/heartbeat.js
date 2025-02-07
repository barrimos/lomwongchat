const { checkIsLoggedIn, logoutSession, updateSessionOneField } = require('../plugins/handlerSession')
const handleValidate = require('../plugins/handleValidate')
const clientRedis = require('../redis/redisServer')
const handlerError = require('./handlerError')

const heartbeat = async (req, res, next) => {
  const { username } = req.headers
  const { deviceId, sessionId } = req.cookies

  try {
    // if session in database doesn't exist (expires or accident delete) catch Error
    const { isLoggedIn } = await checkIsLoggedIn(sessionId, deviceId, username)
    if (!isLoggedIn) {
      return next()
    }
  } catch (err) {
    console.error(`Error check state login: ${err}`)
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
    handleValidate.error.notFound.message = 'Session timeout, Login again'
    return handlerError(handleValidate.error.notFound, req, res, next)
  }

  if (req.verified.extend) {
    try {
      const isExists = await clientRedis.EXISTS(`session:${username}:${sessionId}`)
      if (!isExists) {
        console.error('Error session doesn\'t exists')
        handleValidate.error.notFound.message = 'Session id not found'
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
        return handlerError(handleValidate.error.notFound, req, res, next)
      }

      // reset session TTL in cache
      console.log(`Session ${username}:${sessionId} TTL in cache reset`)
      await clientRedis.EXPIRE(`session:${username}:${sessionId}`, 1800) // 30 minutes

      // update expire time in database
      const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      await updateSessionOneField(sessionId, 'expiresAt', newExpiresAt)
      console.log(`Session ${username}:${sessionId} TTL in database reset`)

      // update expire time in cookies
      res.cookie('sessionId', sessionId, {
        maxAge: newExpiresAt
      })

    } catch (err) {
      console.error(`Error heartbeat check: ${err}`)
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
      return handlerError(handleValidate.error.internal, req, res, next)
    }
  }

  next()
}

module.exports = heartbeat