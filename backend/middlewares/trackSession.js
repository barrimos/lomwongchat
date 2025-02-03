const cookieParser = require('cookie-parser')
const { findOrCreateUpdate, logoutSession } = require('../plugins/handlerSession')
const handlerError = require('./handlerError')
const { v4: uuidv4 } = require('uuid')
const handleValidate = require('../plugins/handleValidate')
const { findOneByUsername } = require('../plugins/handlerUser')

// login > trackSession > isMatch
const trackSession = async (req, res, next) => {
  let deviceId = req.cookies.deviceId
  const { username } = req.headers
  const sid = req.sessionID
  const ip = req.ip

  try {
    // Verify signed session ID
    const signCookies = cookieParser.signedCookies(req.cookies, process.env.SESSION_KEY)
    if (!signCookies['connect.sid'] || sid !== signCookies['connect.sid']) {
      console.error(`Invalid session for SID: ${sid}, username: ${username}`)
      handleValidate.error.forbidden.message = 'Invalid session'
      return handlerError(handleValidate.error.forbidden, req, res, next)
    }

    if (!deviceId) {
      // get from database
      const user = await findOneByUsername(username, { session: 1 })
      let availableSlotKey
      // check available slot
      if (user) {
        // if uuid in database was full of 3
        // find empty slot
        availableSlotKey = user && Object.keys(user.session).find(key => user.session[key] === '')
        const uuidLen = user ? Object.entries(user.session).length : 0
        if (uuidLen >= 3 && !availableSlotKey) {
          // if not available that mean you logged in reached to maximum login limit
          // then response error back
          handleValidate.error.unauthorized.message = 'Maximum login limit reached'
          return handlerError(handleValidate.error.unauthorized, req, res, next)
        }
      }

      // use that uuid for current
      // or create new one
      deviceId = availableSlotKey || uuidv4()

      // save in to client-coolie
      res.cookie('deviceId', deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 86400000,
      })
      req.deviceId = deviceId
    }

    // get agent
    const agent = req.get('user-agent').match(/windows|mobile|ipad/i)[0]

    // save tracking session into database both update and insert
    const session = await findOrCreateUpdate(sid, username, deviceId, agent, ip)

    if (session.attempts <= 0) {
      // if exists and out of attempts
      console.error('Session locked')
      await logoutSession(sid, deviceId, username)
      res.clearCookie('accessToken')
      res.clearCookie('ghostKey')
      handleValidate.error.forbidden.message = 'Session locked. Contact supervisor'
      return handlerError(handleValidate.error.forbidden, req, res, next)
    }

    next()
  } catch (err) {
    console.error('Error during session verification:', err)
    return handlerError(handleValidate.error.internal, req, res, next)
  }
}

module.exports = trackSession