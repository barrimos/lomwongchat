const handlerError = require('../middlewares/handlerError')
const SessionModel = require('../models/session.model')
const { updateUserOneField } = require('./handlerUser')

const findSessionWithProjection = async (sessionId, deviceId, username, projection) => {
  if (!sessionId || !deviceId) return new Error('Missing query')

  const session = await SessionModel.findOne(
    {
      $or: [
        { sessionId },
        {
          $and: [
            { username },
            { sessionId }
          ]
        }
      ]
    },
    projection
  )

  return session
}

/**
 * 
 * @param {*} sessionId string
 * @param {*} username string
 * @param {*} deviceId string
 * @param {*} agent string
 * @param {*} ip string
 * @param {*} projection { field: 1, field: 0 } default {}
 * @returns 
 */
const findOrCreateUpdate = async (sessionId, username, deviceId, agent, ip) => {
  if (!sessionId || !deviceId || !username) return Error('Missing query')
  return await SessionModel.findOneAndUpdate(
    {
      $or: [
        { sessionId },
        {
          $and: [
            { username },
            { deviceId }
          ]
        }
      ]
    },
    {
      $set: {  // always set these fields during update
        sessionId,
        ip,
        deviceId,
        agent,
        username,
      },
      $setOnInsert: {  // only for document insertion
        attempts: 3,
        isLoggedIn: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),  // extend session expiry time
        unlockAt: null
      }
    },
    {
      upsert: true,  // create a new document if no matching deviceId and username
      new: true,      // return the updated document
    }
  )
}

const checkIsLoggedIn = async (sessionId, deviceId, username) => {
  try {
    return await SessionModel.findOne(
      {
        $or: [
          { sessionId },
          {
            $and: [
              { deviceId },
              { username }
            ]
          },
        ]
      },
      { isLoggedIn: 1 }
    )
  } catch (err) {
    return Error(err)
  }
}

const updateSessionOneField = async (sessionId, field, value) => {
  try {
    await SessionModel.updateOne(
      { sessionId },
      {
        $set:
          { [field]: value }
      },
      { new: true, upsert: true }
    )
  } catch (err) {
    return Error(`Error update session data: ${err}`)
  }
}

const updateSessionAttempts = async (sessionId, username, ip, deviceId, decrement = true) => {
  const update = decrement ? { $inc: { attempts: -1 } } : {}
  return await SessionModel.findOneAndUpdate(
    {
      $or: [
        { sessionId },
        { deviceId },
        { username },
        { ip },
      ]
    },
    update,
    { new: true, projection: { attempts: 1, isLoggedIn: 1 } }
  )
}

const loggedInSession = async sessionId => {
  await SessionModel.updateOne(
    { sessionId },
    {
      $set: {
        isLoggedIn: true,
        attempts: 0,
      }
    },
    { new: true }
  )
}

const logoutSession = async (sessionId, deviceId, username) => {
  await SessionModel.updateOne(
    {
      $or: [
        { sessionId },
        {
          $and: [
            { deviceId },
            { username }
          ]
        }
      ]
    },
    {
      $set: {
        isLoggedIn: false
      }
    },
    { new: true }
  )
}

const deleteSession = async (sessionId, username, deviceId) => {
  await SessionModel.deleteOne(
    {
      $or: [
        { sessionId },
        {
          $and: [
            { username },
            { deviceId }
          ]
        }
      ]
    }
  )
}


const handlerSessionFailed = async (req, res, next, sessionId, deviceId, username, errorName, isLogoutApp = false, isDeleteSession = false) => {
  await logoutSession(sessionId, deviceId, username)
  res.clearCookie('accessToken',
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      path: '/'
    }
  )
  res.clearCookie('ghostKey',
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      path: '/'
    }
  )

  if (isLogoutApp) {
    await updateUserOneField(username, { [`devices.${deviceId}`]: '' })
  }

  if (isDeleteSession) {
    await deleteSession(sessionId, username, deviceId)
  }

  // reduce attempts
  const session = await updateSessionAttempts(sessionId, username, deviceId)
  handleValidate.error[errorName].remains = session.attempts
  // always redirect to login page
  return handlerError(handleValidate.error[errorName], req, res, next)
}

module.exports = { findSessionWithProjection, findOrCreateUpdate, updateSessionAttempts, updateSessionOneField, loggedInSession, logoutSession, deleteSession, checkIsLoggedIn, handlerSessionFailed }