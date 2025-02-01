const bcrypt = require('bcrypt')
const handlerError = require('../middlewares/handlerError')
const clientRedis = require('../redis/redisServer')
const userModel = require('../models/user.model')
const { logoutSession } = require('../plugins/handlerSession')
const handleValidate = require('../plugins/handleValidate')

const checkOwner = async (req, res, next) => {
	const code = req.headers.code ?? req.params.code
	const username = req.headers.username ?? req.params.username
	const user = req.headers.user ?? req.params.user
	const sid = req.sessionID

	const isUser = user === 'undefined' || !user
	const uname = isUser ? username : user
	const { accessToken, deviceId, signature, ghostKey } = req.cookies
	let cacheIssue

	const payload = JSON.parse(atob(accessToken.split('.')[1]))

	// general check
	if (!code || !uname || !accessToken || !sid || !deviceId) {
		console.error('Invalid credentials to verify')
		handleValidate.error.unauthorized.message = 'Invalid credentials to verify'
		return handlerError(handleValidate.error.unauthorized, req, res, next)
	}

	// if admin role
	if (ghostKey) {
		try {
			const isMatch = await bcrypt.compareSync(signature, ghostKey)

			if (!signature || !isMatch || payload.role !== handleValidate.role.admin) {
				console.error('Permission denied')
				return handlerError(handleValidate.error.unauthorized, req, res, next)
			}
		} catch (err) {
			console.error(`Error specific: ${err}`)
			return handlerError(handleValidate.error.unauthorized, req, res, next)
		}
	}

	// check url params
	// e.g. `red` was banned and open dispute page
	// url path allowed only this two conditions and can't cross access each other
	// when `red` access /code/username/undefined
	// 		: /ac12/red (user will be undefined)
	//		jwt payload must be `red` only
	// when `admin` access /code/username/user
	// 		: /ac12/admin/red (admin will be username instead red will move to be user)
	//		jwt payload must be `admin` only

	// jwt username not match with owner dispute page
	if (payload.username !== username
		// or user is not undefined and jwt username not match username or jwt username not match admin
		|| ((user !== 'undefined' && user) && (payload.username !== username || payload.role !== handleValidate.role.admin))
		|| ((user === 'undefined' || !user) && payload.username === username && payload.role === handleValidate.role.admin)
	) {
		if (payload.role !== handleValidate.role.admin) {
			await logoutSession(sid)
			res.clearCookie('accessToken')
		}
		console.error('Error authenticate owner this page')
		return handlerError(handleValidate.error.unauthorized, req, res, next)
	}

	// find data of owner dispute page
	try {
		// find in cache first
		cacheIssue = await clientRedis.json.GET('users', { path: `$.${uname}.issue` })
	} catch (err) {
		// get from database instead
		cacheIssue = []
		try {
			const { issue } = await userModel.findOne(
				{ username: uname },
				{ issue: { status: 1, code: 1 }, _id: 0 }
			)
			if (!issue) {
				console.error('Not found user\'s record')
				handleValidate.error.notFound.message = 'Not found user\'s record'
				return handlerError(handleValidate.error.notFound, req, res, next)
			}

			// storing found data
			cacheIssue.push({ status: issue.status, code: issue.code })
		} catch (err) {
			if (payload.role !== handleValidate.role.admin) {
				await logoutSession(sid)
				res.clearCookie('accessToken')
			}
			console.error(`Error fetch issue: ${err.message ?? err}`)
			handleValidate.error.internal.message = 'Error fetch issue'
			return handlerError(handleValidate.error.internal, req, res, next)
		}
	}

	// if not found that mean wrong username or that user has not been banned
	// or found and that user banned too but code didn't match to url params code
	if (!cacheIssue.length || code !== cacheIssue[0].code || cacheIssue[0].status === false) {
		if (payload.role !== handleValidate.role.admin) {
			await logoutSession(sid)
			res.clearCookie('accessToken')
		}
		console.error('No issue data found or Incorrect data')
		handleValidate.error.notFound.message = 'No issue data found or Incorrect data'
		return handlerError(handleValidate.error.notFound, req, res, next)
	}

	next()
}

module.exports = checkOwner