const SessionModel = require('../models/session.model')

const findSession = async (uuid, username) => {
  if (!uuid || !username) return Error('Missing query')
  const session = await SessionModel.findOne(
    {
      $and: [
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
    session.save()

    return session
  }
}

const findOrCreateUpdate = async (username, uuid, agent, ip) => {
  if (!sessionId || !username) return Error('Missing query')
  return await SessionModel.findOneAndUpdate(
    {
      $and: [
        { username },
        { uuid }
      ]
    },
    {
      $set: {  // always set these fields during update
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
    return await SessionModel.findOne(
      {
        $and: [
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

const updateSessionOneField = async (uuid, field, value) => {
  try {
    await SessionModel.updateOne(
      { uuid },
      { [field]: value }
    )
  } catch (err) {
    return Error(`Error update session data: ${err}`)
  }
}

const updateSessionAttempts = async (uuid, decrement = true) => {
  const update = decrement ? { $inc: { attempts: -1 } } : {}
  return await SessionModel.findOneAndUpdate(
    { uuid },
    update,
    { new: true, projection: { attempts: 1, isLoggedIn: 1 } }
  )
}

const loggedInSession = async uuid => {
  await SessionModel.updateOne(
    { uuid },
    {
      $set: {
        isLoggedIn: true,
        attempts: 0
      }
    },
    { new: true }
  )
}

const logoutSession = async (uuid, username) => {
  await SessionModel.updateOne(
    {
      $and: [
        { uuid },
        { username }
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

const deleteSession = async (username, uuid) => {
  await SessionModel.deleteOne(
    {
      $and: [
        { username },
        { uuid }
      ]
    }
  )
}

module.exports = { findSession, findOrCreateUpdate, updateSessionAttempts, updateSessionOneField, loggedInSession, logoutSession, deleteSession, checkIsLoggedIn }