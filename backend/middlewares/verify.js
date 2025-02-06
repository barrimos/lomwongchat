const nodeCrypto = require('node:crypto')
const clientRedis = require('../redis/redisServer')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const handleValidate = require('../plugins/handleValidate')
const { findSessionWithProjection, handlerSessionFailed } = require('../plugins/handlerSession')
const { updateUserOneField, findOneByUsername } = require('../plugins/handlerUser')
const { decrypt } = require('../plugins/cipher')

const verify = async (req, res, next) => {
  const { accessToken, ghostKey, sessionId } = req.cookies
  const { username, access } = req.headers
  let deviceId = req.cookies.deviceId ?? req.headers.pairdeviceid

  try {
    if (!accessToken || !sessionId) {
      if (!accessToken) {
        handleValidate.error.unauthorized.message = 'Token is require'
      }
      if (!sessionId) {
        handleValidate.error.unauthorized.message = 'Session Id is require'
      }
      return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'unauthorized')
    }
  } catch (err) {
    console.error(`Error missing credentials ${err}`)
  }

  try {
    // check if decryption not error that mean all pass
    decrypt(sessionId, process.env.SESSION_KEY, process.env.SESSION_IV)
  } catch (err) {
    console.error(`Error: decryption sesion id: ${err}`)
    return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'unauthorized')
  }


  try {
    if (!deviceId) {
      // get in cache
      const cacheDeviceId = await clientRedis.GET(`session:${username}:${sessionId}`)

      if (!cacheDeviceId) {
        // check in database
        try {
          const data = await findSessionWithProjection(sessionId, cacheDeviceId, username, { deviceId: 1 })
          if (!data.deviceId) throw Error('Device id doesn\'t exist')

          deviceId = data.deviceId

        } catch (err) {
          console.error(`Error: ${err}`)
          return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'internal', true)
        }
      }

      // set deviceId from database
      res.cookie('deviceId', deviceId ?? cacheDeviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 86400000
      })
    }

  } catch (err) {
    console.error(`Error verify session: ${err.message ?? err}`)

    // force logout when catch error
    const now = Math.floor(new Date().getTime() / 1000) // Current time in seconds
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const tokenTTL = payload.exp - now // Remaining lifespan of the token in seconds
    if (tokenTTL > 0) {
      // revoke token with Redis TTL after logout
      await clientRedis.SET(`revoke:token:${accessToken}`, tokenTTL, { NX: true, EX: tokenTTL })
    } else {
      console.error('Token is already expired')
    }

    handleValidate.error.unauthorized.message = `Error verify: ${err.message ?? err}`
    return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'unauthorized', true, true)
  }

  const isRevoked = await clientRedis.GET(`revoke:token:${accessToken}`)
  if (isRevoked === accessToken) {
    console.error(`Token revoked`)
    handleValidate.error.unauthorized.message = 'Token revoked'
    return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'unauthorized')
  }

  try {
    // check Timestamp
    const now = Math.floor(Date.now() / 1000)
    const lastVerify = await clientRedis.json.GET('users', { path: `$.${username}.timeStamp` })

    const decoded = jwt.verify(accessToken, process.env.ACCESS_KEY)
    if (decoded.username !== username) {
      req.verified = { valid: false, error: 'Authenticate error' }
      return next()
    }

    if (req.path === '/logout') {
      const now = Math.floor(new Date().getTime() / 1000) // Current time in seconds
      const tokenTTL = decoded.exp - now // Remaining lifespan of the token in seconds
      if (tokenTTL > 0) {
        // revoke token with Redis TTL after logout
        await clientRedis.SET(`revoke:token:${accessToken}`, tokenTTL, { NX: true, EX: tokenTTL })
      } else {
        console.error('Token is already expired')
      }
    }

    // if last verified less than 900 sec quick bypass further checks
    // no need to decode and verify jwt
    if (lastVerify[0] && now - lastVerify[0] < 900) {
      req.verified = { valid: true, username: username, deviceId: deviceId ?? deviceId }
      return next() // go to heartbeat check
    }

    try {
      // Replay Attack
      // nonce will set when token create or renew token
      const nonce = await clientRedis.GET(`users:${username}:nonce`)
      // in case nonce in cache doesn't exist
      // that mean you have to wait until jwt token expired
      // to prevent reuse invalid or expired jwt token
      // This logic ensures that each JWT token can only be used once within its validity period.
      // By checking the nonce in Redis against the one in the token, you effectively mitigate replay attacks.
      if (decoded.kid !== nonce) {
        req.verified = { valid: false, error: 'Replay attack detected' }
        return next()
      }

      const lockKey = `users:${username}:lock`
      // prevent race condition and too much refresh page
      // and or user bypass lastVerify logic
      const isLocked = await clientRedis.SET(lockKey, 'locked', { NX: true, EX: 1 }) // Lock 1 sec
      // if lockKey is Exists response error
      if (!isLocked) {
        return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'tooMuch')
      }

      // set new Timestamp
      await clientRedis.json.SET('users', `$.${username}.timeStamp`, now)
    } catch (err) {
      console.error('Error caching server', err)
    }

    req.verified = { valid: true, extend: true, deviceId: deviceId ?? deviceId }

    try {
      // for adsysop page
      if (handleValidate.access[access] === handleValidate.access.adsysop
        && decoded?.role === handleValidate.role.admin && req.path !== '/logout'
      ) {
        if (!ghostKey) {
          // non-blocking use hash
          // blocking use hashSync
          const ghostKey = await bcrypt.hash(process.env.GHOST_KEY, 5)
          res.cookie('ghostKey', ghostKey, {
            httpOnly: true,
            // Use secure cookies in production
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax', // Allow cross-origin in production
            maxAge: 86400000
          })
        }
      }
    } catch (err) {
      console.error(`Error to set specific cookies: ${err}`)
      handleValidate.error.badReq.message = 'Error to set specific cookies'
      return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'badReq')
    }

    next()
  } catch (err) {
    // in case token expired
    if (err.name === 'TokenExpiredError') {
      const ref = await findOneByUsername(username, { token: { refreshToken: 1 }, _id: 0 })

      if (!ref) {
        console.error('Error reference not found')
        return handlerSessionFailed(req, res, next, sessionId, deviceId, username, 'notFound')
      }

      const refPayload = ref.token.refreshToken.split('.')[1]
      const { kid: refKid, username: refName, exp: refExp } = JSON.parse(atob(refPayload))
      const isRefExpired = new Date().getTime() / 1000 > refExp

      const currPayload = accessToken.split('.')[1]
      const { kid: currKid, role: currRole } = JSON.parse(atob(currPayload))

      if (currKid === refKid && username === refName) {
        try {
          const newKid = isRefExpired ? await nodeCrypto.randomBytes(4).toString('hex') : currKid
          const newPayLoad = { username: username, role: currRole, kid: newKid }
          const newToken = {}
          const reNewAccessToken = await jwt.sign(
            newPayLoad,
            process.env.ACCESS_KEY,
            { expiresIn: 900 }
          )
          newToken.accessToken = reNewAccessToken
          if (isRefExpired) {
            const reNewRefreshToken = await jwt.sign(
              newPayLoad,
              process.env.REFRESH_KEY,
              { expiresIn: 86400 * 7 }
            )
            newToken.refreshToken = reNewRefreshToken
          }

          const update = isRefExpired
            ? { 'token.accessToken': newToken.accessToken, 'token.refreshToken': newToken.refreshToken }
            : { 'token.accessToken': newToken.accessToken }

          const success = await updateUserOneField(username, update)

          if (success.modifiedCount === 1) {
            console.log('Renewal token success')
            req.verified = { valid: true, deviceId: deviceId ?? deviceId, extend: true }
            res.cookie('accessToken', newToken.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production', // Use secure cookies in production, // Use secure cookies in production
              sameSite: 'Lax', // Allow cross-origin in production
              maxAge: 86400000
            })
          } else {
            console.error(`Update re-sign error: ${err}`)
            req.verified = { valid: false, error: 'Update re-sign error' }
          }

          // new nonce after re-sign token
          try {
            await clientRedis.SET(`users:${username}:nonce`, newKid, { EX: 900 }) // เก็บ Nonce 15 นาที
          } catch (err) {
            console.error('Error caching signature:', err)
          }

        } catch (err) {
          console.error(`Re-sign token error: ${err}`)
          req.verified = { valid: false, error: 'Re-sign token error' }
        }
      } else {
        console.error(`Reference unauthorized: ${err}`)
        req.verified = { valid: false, error: 'Reference unauthorized' }
      }
    } else {
      console.error(`Error: ${err}`)
      req.verified = { valid: false, error: `Error payload ${err.name ?? err}` }
    }
    next()
  }
}

module.exports = verify