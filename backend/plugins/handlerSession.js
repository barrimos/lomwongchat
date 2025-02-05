const sessionModel = require('../models/session.model')

const findSession = async (sessionId, uuid, username) => {
  if (!sessionId || !uuid || !username) return Error('Missing query')
  const session = await sessionModel.findOne(
    {
      $or: [
        { sessionId },
        { username },
        { uuid }
      ]
    },
    { attempts: 1, isLoggedIn: 1 }
  )

  if (session) {
    // if found
    if (session.username !== username) {
      session.username = username
    }
    if (session.uuid !== uuid) {
      session.uuid = uuid
    }
    if (session.sessionId !== sessionId) {
      session.sessionId = sessionId
    }
    session.save()

    return session
  }
}

const findOrCreateUpdate = async (sessionId, username, uuid, agent, ip) => {
  if (!sessionId || !username) return Error('Missing query')
  return await sessionModel.findOneAndUpdate(
    {
      $or: [
        { sessionId },
        { username },
        { uuid }
      ]
    },
    {
      $set: {  // always set these fields during update
        sessionId,
        ip,
        uuid,
        agent,
        username,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)  // extend session expiry time
      },
      $setOnInsert: {  // only for document insertion
        attempts: 3,
        isLoggedIn: false,
        createdAt: new Date(),
      }
    },
    {
      upsert: true,  // create a new document if no matching sessionId
      new: true      // return the updated document
    }
  )
}

const checkIsLoggedIn = async (sid, username) => {
  try {
    return await sessionModel.findOne(
      {
        $or: [
          { sessionId: sid },
          { username: username }
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
    await sessionModel.updateOne(
      { sessionId },
      { [field]: value }
    )
  } catch (err) {
    return Error(`Error update session data: ${err}`)
  }
}

const updateSessionAttempts = async (sessionId, decrement = true) => {
  const update = decrement ? { $inc: { attempts: -1 } } : {}
  return await sessionModel.findOneAndUpdate(
    { sessionId },
    update,
    { new: true, projection: { attempts: 1, isLoggedIn: 1 } }
  )
}

const loggedInSession = async sessionId => {
  await sessionModel.updateOne(
    { sessionId: sessionId },
    {
      $set: {
        isLoggedIn: true,
        attempts: 0
      }
    },
    { new: true }
  )
}

const logoutSession = async (sessionId, deviceId, username) => {
  await sessionModel.updateOne(
    {
      $or: [
        { sessionId: sessionId },
        {
          uuid: deviceId,
          username: username
        }
      ]
    },
    {
      $set: {
        isLoggedIn: false,
        attempts: 3
      }
    },
    { new: true }
  )
}

const deleteSession = async (sessionId, username, uuid) => {
  await sessionModel.deleteOne(
    {
      $or: [
        { sessionId },
        {
          $and: [
            { username },
            { uuid }
          ]
        }
      ]
    }
  )
}

module.exports = { findSession, findOrCreateUpdate, updateSessionAttempts, updateSessionOneField, loggedInSession, logoutSession, deleteSession, checkIsLoggedIn }