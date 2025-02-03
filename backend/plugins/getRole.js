const userModel = require('../models/user.model')

const getRole = async username => {
	return await userModel.findOne(
		{ username: username },
		{ role: 1, _id: 0 }
	)
}

module.exports = getRole