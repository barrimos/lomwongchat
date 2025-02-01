const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const clientRedis = require('../redis/redisServer')

const verify = require('../middlewares/verify')
const clearSession = require('../middlewares/clearSession')
const isMatch = require('../middlewares/isMatch')
const rateLimiter = require('../middlewares/rateLimit')
const trackSession = require('../middlewares/trackSession')
const { encrypt } = require('../middlewares/cipher')
const heartbeat = require('../middlewares/heartbeat')

const signToken = require('../plugins/signToken')
const handleValidate = require('../plugins/handleValidate')

const { deleteSession, logoutSession, loggedInSession } = require('../plugins/handlerSession')
const { findOneByUsername, updateUserOneField, insertNewUser } = require('../plugins/handlerUser')
const getRole = require('../plugins/getRole')

const blockWords = new RegExp(/(?:admin)|(?:administrator)|(?:moderator)/i)

const handleUserEndpointRouter = express.Router()

handleUserEndpointRouter.post('/regisUsers', async (req, res) => {
	const data = {
		username: '',
		password: '',
		role: '301',
		token: {}
	}

	const { username, password } = req.body

	try {
		const found = await findOneByUsername(username, { username: 1 })
		if (blockWords.test(username) || found) {
			return res.status(409).json({ error: 'You can\'t use this username' })
		}

		const hashPass = await bcrypt.hash(password, 5)
		data.username = username
		data.password = hashPass
		const token = await signToken(data.username, data.role, true)
		if (token) {
			data.token = token
		} else {
			console.error('Cannot create new token')
			return res.status(403).json({ error: 'Registration token error' })
		}
		try {
			const registration = await insertNewUser(data)
			if (registration.success) {
				console.log(`Registration username ${data.username} complete`)
				res.status(201).json({ user: username })
			} else {
				res.status(400).json({ error: `Registration username ${data.username} not complete` })
			}
		} catch (err) {
			res.status(400).json({ error: err.message })
		}
	} catch (err) {
		console.error('Error registration')
		res.status(400).json({ error: err })
	}
})

handleUserEndpointRouter.get('/login', [rateLimiter, trackSession, isMatch], async (req, res) => {
	if (req.verified.valid) {
		const { username } = req.headers

		await updateUserOneField(username, { [`session.${req.verified.deviceId}`]: req.sessionID })
		
		req.session.isAuthenticated = true
		req.session.cookie.maxAge = 30 * 60 * 1000
		res.status(200).json({
			valid: req.verified.valid
		})
	} else {
		res.status(401).json({
			valid: req.verified.valid,
			error: req.verified.error,
			issue: req.verified.issue,
			issueStatus: req.verified.issueStatus,
			banned: req.verified.banned,
			remains: req.verified.remains
		})
	}
})

handleUserEndpointRouter.post('/status/:action', async (req, res) => {
	const { username, access } = req.headers
	const { statusName, user } = req.body
	const { action } = req.params
	const { issueCode, accessToken } = req.cookies

	if (!username || !handleValidate.access[access]) {
		console.error('Error username not found or invalid access type')
		return res.status(401).json({ valid: false, error: 'Invalid credentials' })
	}

	if (action === 'check') {
		let cacheUser, flag = false

		try {
			// check cache key
			const isKeyExist = await clientRedis.exists('users')
			if (!isKeyExist) {
				// create new key
				await clientRedis.json.SET('users', '$', {})
			}
		} catch (err) {
			console.error(`Error check exist key: ${err}`)
		}

		// get data from cache
		try {
			cacheUser = await clientRedis.json.GET('users', { path: `$.${username}` })
			// in case user not found return empty array []
		} catch (err) {
			console.error('Error get caching user', err)
			cacheUser = [] // set default for check
		}
		// code above will make sure that key `users` will always be exist
		// even it deleted at some process
		// and cacheUser will be empty array for default


		// cache user not exists
		if (cacheUser.length === 0) {

			let projection = { issue: 1, status: 1, dmLists: 1, _id: 0 }
			// Check if username is 'admin'
			const role = await getRole(username)
			if (role === handleValidate.role.admin
				&& handleValidate.access[access] === handleValidate.access.adsysop
			) {
				// for admin role, only need dmLists
				// admin can't ban themself so field issue are not necessary
				projection = { dmLists: 1, _id: 0 } // Only get 'dmLists'
			}

			// get latest status from database instead
			try {
				cacheUser[0] = await findOneByUsername(username, projection)
				flag = true
			} catch (err) {
				console.error('Error fetching user from database:', err)
				return res.status(500).json({ valid: false, error: 'Internal server error' })
			}
		}

		// user cache is exist
		// but user status banned
		// for users after being recently banned
		// both login and in app
		if (cacheUser.length === 1 && cacheUser[0].status === 'banned') {
			// if issue code doesn't exist
			if (!cacheUser[0].issue.code
				// or issue code not match to request issue code
				|| cacheUser[0].issue.code !== issueCode
				// or neither issue code nor request issue code doesn't exists
				|| (!cacheUser[0].issue.code || !issueCode)
			) {
				// generate issue code
				let hashingCode = encrypt(crypto.randomBytes(32).toString('hex'))
				// adding salting
				const salt = crypto.createHash('sha256', process.env.SALT_KEY)
					.update(process.env.GHOST_KEY)
					.digest('hex')

				hashingCode += salt

				try {
					// update issue code into database
					// assign to variable
					await updateUserOneField(username, { 'issue.code': hashingCode })
					flag = true

					cacheUser[0].issue.code = hashingCode
				} catch (err) {
					console.error('Error updating in database:', err)
					return res.status(500).json({ valid: false, error: 'Internal server error' })
				}
			}
		}
		// in case flag is true
		// - user doesn't exist in cache
		// - user was banned
		// - issue code between cookie and cache didn't match
		if (flag) {
			try {
				// caching new data
				await clientRedis.json.SET('users', `$.${username}`, cacheUser[0])
			} catch (err) {
				console.error('Error caching user data:', err)
			}

			flag = false
		}

		if (cacheUser[0].status === 'banned') {
			res.cookie('issueCode', cacheUser[0].issue.code, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
				sameSite: 'Lax', // Allow cross-origin in production
				maxAge: 86400000
			})

			return res.status(401).json({
				valid: false,
				error: 'You was banned',
				issue: cacheUser[0].issue.code,
				issueStatus: cacheUser[0].issue.status || false,
				banned: true
			})
		}

		// normal status
		return res.status(200).json({ valid: true })
	}

	if (action === 'update') {
		try {
			const decoded = await jwt.verify(accessToken, process.env.ACCESS_KEY)
			// check role
			if (decoded && decoded.role === handleValidate.role.admin
				&& handleValidate.access[access] === handleValidate.access.adsysop
			) {
				const success = await updateUserOneField(user.username, { status: statusName })

				try {
					await clientRedis.json.SET('users', `$.${user.username}.status`, statusName)
				} catch (err) {
					console.error(`Error update user's status: ${err}`)
				}

				if (success.modifiedCount === 1) {
					res.status(201).json({ valid: true, message: 'Status updated' })
					// notice to users who banned
				} else {
					res.status(400).json({ valid: false, error: 'Status did not update' })
				}

			} else {
				res.status(401).json({ valid: false, error: 'Unauthorized' })
			}
		} catch (err) {
			console.error(`Error verify token or update status to database: ${err}`)
			res.status(409).json({ error: err })
		}
	}
})

// authentication before access page
// status checking while in app and got banned inside
handleUserEndpointRouter.get('/auth/token', [verify, heartbeat], async (req, res) => { // develop
// handleUserEndpointRouter.get('/auth/token', [rateLimiter, verify, heartbeatCheck], async (req, res) => { // production
	if (req.verified.valid) {
		// verify passes
		// update session state
		await loggedInSession(req.sessionID)

		res.status(200).json({
			valid: req.verified.valid,
			deviceId: req.verified.deviceId
		})
	} else {
		await logoutSession(req.sessionID)
		res.clearCookie('accessToken')
		res.clearCookie('ghostKey')
		res.status(401).json({
			valid: req.verified.valid,
			error: req.verified.error,
			remains: req.verified.remains,
			isForceLogout: req.verified.isForceLogout
		})
	}
})

handleUserEndpointRouter.delete('/logout', [verify, clearSession], async (req, res) => {
	try {
		if (req.verified.valid) {
			// Clear accessToken cookie
			res.clearCookie('accessToken')
			res.clearCookie('ghostKey')

			// clear session that tied with uuid in database to available for next login
			await deleteSession(req.sessionID, req.headers.username, req.cookies.deviceId)
			await updateUserOneField(req.headers.username, { [`session.${req.cookies.deviceId}`]: '' })

			// Respond with success
			res.status(201).end()
		} else {
			res.status(409).json({ valid: false, error: 'Logout failed' })
		}
	} catch (err) {
		console.error('Logout error:', err)
		return res.status(500).json({ error: 'Internal server error' })
	}
})

module.exports = handleUserEndpointRouter