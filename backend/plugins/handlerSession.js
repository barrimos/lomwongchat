const SessionModel = require('../models/session.model')

const findSession = async (deviceId, username, projection) => {
  if (!deviceId || !username) return new Error('Missing query')

  const session = await SessionModel.findOne(
    { username, deviceId },
    projection
  )

  if (session) {
    // Update session fields if they are different
    let updated = false

    if (session.username !== username) {
      session.username = username
      updated = true
    }
    if (session.deviceId !== deviceId) {
      session.deviceId = deviceId
      updated = true
    }

    if (updated) {
      await session.save() // Save only if modified
    }

    return session
  }

  return null // Return null if no session is found
}

const findOrCreateUpdate = async (username, deviceId, agent, ip) => {
  if (!deviceId || !username) return Error('Missing query')
  return await SessionModel.findOneAndUpdate(
    {
      $and: [
        { username },
        { deviceId }
      ]
    },
    {
      $set: {  // always set these fields during update
        ip,
        deviceId,
        agent,
        username,
        unlockAt: null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)  // extend session expiry time
      },
      $setOnInsert: {  // only for document insertion
        attempts: 3,
        isLoggedIn: false,
        createdAt: new Date(),
      }
    },
    {
      upsert: true,  // create a new document if no matching deviceId and username
      new: true      // return the updated document
    }
  )
}

const checkIsLoggedIn = async (deviceId, username) => {
  try {
    return await SessionModel.findOne(
      {
        $and: [
          { deviceId },
          { username }
        ]
      },
      { isLoggedIn: 1 }
    )
  } catch (err) {
    return Error(err)
  }
}

const updateSessionOneField = async (deviceId, field, value) => {
  try {
    await SessionModel.updateOne(
      { deviceId },
      { [field]: value }
    )
  } catch (err) {
    return Error(`Error update session data: ${err}`)
  }
}

const updateSessionAttempts = async (username, ip, deviceId, decrement = true) => {
  const update = decrement ? { $inc: { attempts: -1 } } : {}
  return await SessionModel.findOneAndUpdate(
    {
      $or: [
        { deviceId },
        { username },
        { ip },
      ]
    },
    update,
    { new: true, projection: { attempts: 1, isLoggedIn: 1 } }
  )
}

const loggedInSession = async deviceId => {
  await SessionModel.updateOne(
    { deviceId },
    {
      $set: {
        isLoggedIn: true,
        attempts: 0
      }
    },
    { new: true }
  )
}

const logoutSession = async (deviceId, username) => {
  await SessionModel.updateOne(
    {
      $and: [
        { deviceId },
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

const deleteSession = async (username, deviceId) => {
  await SessionModel.deleteOne(
    {
      $and: [
        { username },
        { deviceId }
      ]
    }
  )
}

module.exports = { findSession, findOrCreateUpdate, updateSessionAttempts, updateSessionOneField, loggedInSession, logoutSession, deleteSession, checkIsLoggedIn }