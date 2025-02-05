const handlerError = require('./handlerError')
const bcrypt = require('bcrypt')
const { updateSessionAttempts, updateSessionOneField } = require('../plugins/handlerSession')
const handleValidate = require('../plugins/handleValidate')
const clientRedis = require('../redis/redisServer')
const jwt = require('jsonwebtoken')
const getRole = require('../plugins/getRole')
const { updateUserOneField, findOneByUsername } = require('../plugins/handlerUser')

// login > trackSession > isMatch
const isMatch = async (req, res, next) => {
  const { username, password, access } = req.headers
  const deviceId = req.cookies.deviceId ?? req.deviceId
  const sid = req.sessionID

  try {
    // Validate input
    if (!username || !password || !handleValidate.access[access]) {
      console.error('Invalid input or access type')
      handleValidate.error.forbidden.message = 'Invalid input or access type'
      return handlerError(handleValidate.error.forbidden, req, res, next)
    }
    if (!deviceId) {
      console.error('Device id not found')
      return handlerError(handleValidate.error.unauthorized, req, res, next)
    }

    const userRole = await getRole(username)

    let projection = { password: 1, token: { accessToken: 1 }, role: 1, issue: 1, status: 1, dmLists: 1, _id: 0 }
    // Check if username is 'admin'
    if (handleValidate.role.admin === userRole && handleValidate.access[access] === handleValidate.access.adsysop) {
      // for admin role, only need dmLists
      // admin can't ban themself so field issue are not necessary
      projection = { password: 1, token: { accessToken: 1 }, role: 1, dmLists: 1, _id: 0 } // Only get 'dmLists'
    }

    const user = await findOneByUsername(username, projection, true)

    if (!user) {
      console.error('No user found to verify credentials')
      // reduce attempts
      const session = await updateSessionAttempts(sid)
      handleValidate.error.unauthorized.remains = session.attempts
      return handlerError(handleValidate.error.unauthorized, req, res, next)
    }

    // Admin role not have permission to access lomwong page
    if (handleValidate.access[access] === handleValidate.access.lomwong && user.role === handleValidate.role.admin) {
      handleValidate.error.unauthorized.message = 'Admin cannot access this page'
      return handlerError(handleValidate.error.unauthorized, req, res, next)
    }

    // User role not have permission to access adsysop page
    if (handleValidate.access[access] === handleValidate.access.adsysop && user.role !== handleValidate.role.admin) {
      const session = await updateSessionAttempts(sid)
      handleValidate.error.unauthorized.remains = session.attempts
      return handlerError(handleValidate.error.unauthorized, req, res, next)
    }

    // Validate password
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
      console.error('Unauthorize credentials')
      const session = await updateSessionAttempts(sid)
      handleValidate.error.unauthorized.remains = session.attempts
      return handlerError(handleValidate.error.unauthorized, req, res, next)
    }

    const isRevoked = await clientRedis.GET(`revoke:token:${user.token.accessToken}`)
    const decoded = user.token.accessToken ? jwt.decode(user.token.accessToken) : null
    const isExpired = decoded ? Date.now() >= decoded.exp * 1000 : true

    if (isRevoked || isExpired || !user.token.accessToken) {
      // delete ttl and use other datas for sign new token 
      delete decoded.iat
      delete decoded.exp
      // Issue a new token only if the current one is invalid
      user.token.accessToken = await jwt.sign(decoded, process.env.ACCESS_KEY, { expiresIn: 900 })

      // update in database
      await updateUserOneField(username, { 'token.accessToken': user.token.accessToken })
    }

    // credentials passes
    // delete cookie captcha, didn't use it anymore
    res.clearCookie('captcha')

    // Set token in cookies
    res.cookie('accessToken', user.token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 86400000, // 1 day
    })

    delete user.password
    delete user.token
    user.role === handleValidate.role.admin ? delete user.issue : null

    try {
      // nonce
      await clientRedis.SET(`users:${username}:nonce`, decoded.kid, { EX: 900 })

      try {
        // user's data
        // overwriting
        await clientRedis.json.SET('users', `$.${username}`, user)
      } catch (err) {
        if (err.toString() === 'Error: ERR new objects must be created at the root') {
          try {
            await clientRedis.json.SET('users', '$', {})
            await clientRedis.json.SET('users', `$.${username}`, user)
          } catch (err) {
            console.error('Error set new key')
          }
        } else {
          console.error(`Error caching user's data: ${err}`)
        }
      }

      // users session ttl
      // if not set this ttl login and verify will error
      await clientRedis.SET(`session:${username}:${sid}`, deviceId, { NX: true, EX: 1800 }) // expires 30 mins

    } catch (err) {
      console.error('Error caching signature:', err)
    }

    // all passes
    req.verified = { valid: true, deviceId: deviceId }
    next()
  } catch (err) {
    console.error('Error server:', err)
    return handlerError(handleValidate.error.internal, req, res, next)
  }
}

module.exports = isMatch