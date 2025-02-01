const UserModel = require('../models/user.model')

const insertNewUser = async data => {
  try {
    const newUser = new UserModel(data)
    newUser.save()
    return { success: true }
  } catch (err) {
    return Error(`Error to insert new user's document: ${err}`)
  }
}

const findOneByUsername = async (username, projection = {}, lean) => {
  try {
    const query = UserModel.findOne({ username }, projection)

    if (lean) {
      return await query.lean()
    } else {
      return await query
    }
  } catch (err) {
    return Error(`Error find user: ${err}`)
  }
}

const updateUserOneField = async (username, update) => {
  try {
    return await UserModel.updateOne(
      { username: username },
      { $set: update },
      { new: true, upsert: true }
    )
  } catch (err) {
    return Error('Update user\'s data error')
  }
}

const logoutUserByUsername = async username => {
  try {
    await UserModel.updateOne(
      { username: username },
      { $set: { [`session.${deviceId}`]: '' } }
    )
  } catch (err) {
    return Error(`Logout user error: ${err}`)
  }
}

module.exports = { insertNewUser, findOneByUsername, updateUserOneField, logoutUserByUsername }