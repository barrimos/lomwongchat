// package
const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const clientRedis = require('../../redis/redisServer')

// middlewares
const verify = require('../../middlewares/verify')
const { rateLimiterLogin, rateLimiterAuthen } = require('../../middlewares/rateLimit')
const { encrypt } = require('../../plugins/cipher')
const heartbeat = require('../../middlewares/heartbeat')
const handlerError = require('../../middlewares/handlerError')

// plugins
const signToken = require('../../plugins/signToken')
const handleValidate = require('../../plugins/handleValidate')
const { deleteSession, logoutSession, loggedInSession, updateSessionAttempts, findOrCreateUpdate } = require('../../plugins/handlerSession')
const { findOneByUsername, updateUserOneField, insertNewUser } = require('../../plugins/handlerUser')
const getRole = require('../../plugins/getRole')

const blockWords = new RegExp(/(?:admin)|(?:administrator)|(?:moderator)/i)

const trackSession = async (req, res, next) => {
	let deviceId = req.cookies.deviceId
	const { sessionId } = req.cookies
	const { username } = req.headers
	const ip = req.ip

	try {
		const user = await findOneByUsername(username, { devices: 1 })

		if (user) {
			// if uuid in database was full of 3
			// find empty slot
			const availableSlotKey = Object.keys(user.devices).find(key => user.devices[key] === '')

			const uuidLen = user ? Object.entries(user.devices).length : 0
			if (uuidLen >= 3 && !availableSlotKey) {
				// if not available that mean you logged in reached to maximum login limit
				// then response error back
				handleValidate.error.unauthorized.message = 'Maximum login limit reached'
				return handlerError(handleValidate.error.unauthorized, req, res, next)
			}

			deviceId = availableSlotKey || uuidv4()

			// save in to client-coolie
			res.cookie('deviceId', deviceId, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'None',
				maxAge: 86400000,
			})
			req.deviceId = deviceId
		}

		// get agent
		const agent = req.get('user-agent').match(/windows|mobile|ipad/i)[0]

		// save tracking session into database both update and insert
		// it always check if same session id but deifference username or device id or ip or agent
		// it will update
		const session = await findOrCreateUpdate(sessionId, username, deviceId, agent, ip)

		if (session.attempts <= 0 || session.unlockAt) {
			// if exists and out of attempts
			console.error('Session locked')
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
			handleValidate.error.forbidden.message = 'Session locked. Contact supervisor'
			return handlerError(handleValidate.error.forbidden, req, res, next)
		}

		next()
	} catch (err) {
		console.error('Error during session verification:', err)
		return handlerError(handleValidate.error.internal, req, res, next)
	}
}


const isMatch = async (req, res, next) => {
	const { username, password, access } = req.headers
	const deviceId = req.deviceId ?? req.cookies.deviceId
	const { sessionId } = req.cookies
	const ip = req.ip
	let session

	try {
		// Validate input
		if (!username || !password || !handleValidate.access[access]) {
			console.error('Invalid input or access type')
			session = await updateSessionAttempts(sessionId, username, ip, deviceId)
			handleValidate.error.forbidden.remains = session.attempts
			handleValidate.error.forbidden.message = 'Invalid input or access type'
			return handlerError(handleValidate.error.forbidden, req, res, next)
		}
		if (!deviceId) {
			console.error('Device id not found')
			session = await updateSessionAttempts(sessionId, username, ip, deviceId)
			handleValidate.error.unauthorized.remains = session.attempts
			handleValidate.error.unauthorized.message = 'Device id not found, Login again'
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
			session = await updateSessionAttempts(sessionId, username, ip, deviceId)
			handleValidate.error.unauthorized.remains = session.attempts
			handleValidate.error.unauthorized.message = 'Invalid credentials'
			return handlerError(handleValidate.error.unauthorized, req, res, next)
		}

		// Admin role not have permission to access lomwong page
		if (handleValidate.access[access] === handleValidate.access.lomwong && user.role === handleValidate.role.admin) {
			handleValidate.error.unauthorized.message = 'Admin cannot access this page'
			return handlerError(handleValidate.error.unauthorized, req, res, next)
		}

		// User role not have permission to access adsysop page
		if (handleValidate.access[access] === handleValidate.access.adsysop && user.role !== handleValidate.role.admin) {
			session = await updateSessionAttempts(sessionId, username, ip, deviceId)
			handleValidate.error.unauthorized.remains = session.attempts
			return handlerError(handleValidate.error.unauthorized, req, res, next)
		}

		// Validate password
		const isPasswordMatch = await bcrypt.compare(password, user.password)
		if (!isPasswordMatch) {
			console.error('Unauthorize credentials')
			session = await updateSessionAttempts(sessionId, username, ip, deviceId)
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
		res.clearCookie('captcha',
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'None',
				path: '/'
			}
		)

		// Set token in cookies
		res.cookie('accessToken', user.token.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'None',
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
			await clientRedis.SET(`session:${username}:${sessionId}`, deviceId, { EX: 1800 }) // expires 30 mins

		} catch (err) {
			console.error('Error caching signature:', err)
		}

		// all passes
		req.verified = { valid: true, deviceId }
		next()
	} catch (err) {
		console.error('Error server:', err)
		return handlerError(handleValidate.error.internal, req, res, next)
	}
}

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
			console.error('Error registration:', err)
			res.status(400).json({ error: err })
		}
	} catch (err) {
		console.error('Error registration')
		res.status(400).json({ error: err })
	}
})

handleUserEndpointRouter.get('/login', [rateLimiterLogin, trackSession, isMatch], async (req, res) => {
	if (req.verified.valid) {
		const { username } = req.headers
		const ip = req.ip

		await updateUserOneField(username, { [`devices.${req.verified.deviceId}`]: ip })

		res.status(200).json({
			valid: req.verified.valid,
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
	const { username, access } = req.headers // when login
	const { statusName, user } = req.body // when admin set new status and user in app
	const { action } = req.params
	const { issueCode, accessToken } = req.cookies

	if (!username || !handleValidate.access[access] || handleValidate.access[access] !== handleValidate.access.lomwong) {
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
				const hashingCode = encrypt(crypto.randomBytes(32).toString('hex'), process.env.ISSUE_KEY, process.env.ISSUE_IV)

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
				sameSite: 'None', // Allow cross-origin in production
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
handleUserEndpointRouter.get('/auth/token', [rateLimiterAuthen, verify, heartbeat], async (req, res) => {
	const { sessionId } = req.cookies

	if (req.verified.valid) {
		// verify passes
		// update session state
		await loggedInSession(sessionId)

		res.status(200).json({
			valid: req.verified.valid,
			deviceId: req.verified.deviceId
		})
	} else {
		await logoutSession(sessionId)
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
		res.status(401).json({
			valid: req.verified.valid,
			error: req.verified.error,
			remains: req.verified.remains,
			isForceLogout: req.verified.isForceLogout
		})
	}
})

handleUserEndpointRouter.delete('/logout', verify, async (req, res) => {
	try {
		if (req.verified.valid) {
			const key = `logout-attempts:${req.ip}`
			const lastReset = await clientRedis.get(key)
			const now = Date.now()

			// Clear accessToken cookie
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

			// clear session that tied with uuid in database to available for next login
			await deleteSession(req.cookies.sessionId, req.headers.username, req.cookies.deviceId)
			await updateUserOneField(req.headers.username, { [`devices.${req.cookies.deviceId}`]: '' })

			if (lastReset && now - lastReset < 30 * 1000) {
				return res.status(429).json({ error: 'Too many logouts, try again later' })
			}

			await clientRedis.SET(key, now, { EX: 60 }) // Store with expiry (1 min)

			rateLimiterLogin.resetKey(req.ip)
			rateLimiterAuthen.resetKey(req.ip)

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