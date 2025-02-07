const genNonce = require('../../plugins/genNonce')
const express = require('express')
const handleGeneralEndpointRouter = express.Router()
const nodeCrypto = require('node:crypto')
const { encrypt } = require('../../plugins/cipher')
const { findSessionWithProjection } = require('../../plugins/handlerSession')

handleGeneralEndpointRouter.get('/:action', async (req, res) => {
	const { action } = req.params
	const { username } = req.headers
	const { deviceId, sessionId, captcha } = req.cookies
	const state = {
		isStayLoggedIn: false
	}
	try {
		// initial
		// check uuid that is stay logged in isn't it
		state.isStayLoggedIn = await findSessionWithProjection(sessionId, deviceId, username, { username: 1, isLoggedIn: 1 })
	} catch (err) {
		console.error(`Error get login state: ${err}`)
	}

	if (action === 'gen') {
		try {
			const strCaptcha = genNonce(6)
			const signCaptcha = nodeCrypto.createHmac('sha256', process.env.CAPTCHA_KEY).update(strCaptcha).digest('hex')
			res.cookie('captcha', `${strCaptcha}.${signCaptcha}`,
				{
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
				}
			)

			return res.status(200).json({ captcha: strCaptcha, state: state.isStayLoggedIn || false })
		} catch (err) {
			console.error(`Generate captcha error: ${err}`)
			return res.status(400).json({ error: 'Generate captcha error' })
		}
	}

	if (action === 'verifyCaptcha') {
		const { inputcaptcha } = req.headers
		const [stringCaptcha, signature] = captcha.split('.')
		const validateSignature = nodeCrypto.createHmac('sha256', process.env.CAPTCHA_KEY).update(stringCaptcha).digest('hex')

		if (inputcaptcha === stringCaptcha && validateSignature === signature) {
			return res.status(200).json({ verified: true })
		} else {
			console.error('Verification captcha error')
			return res.status(401).json({ verified: false })
		}
	}

	if (action === 'getRemainsAttempts') {
		res.clearCookie('captcha')
		try {
			// get attempts
			const session = await findSessionWithProjection(sessionId, deviceId, username, { attempts: 1 })

			if (!session) throw Error('Require session id')

			return res.status(200).json({ remains: session.attempts ?? 3 })
		} catch (err) {
			console.error(`Error Get remains: ${err}`)
			return res.status(400).json({ error: 'Get remains error', remains: 3 })
		}
	}

	if (action === 'session') {
		if (!req.cookies.sessionId) {
			const data = nodeCrypto.randomBytes(32).toString('hex').slice(0, 16)
			const sessionId = encrypt(data, process.env.SESSION_KEY, process.env.SESSION_IV)
			res.cookie('sessionId', sessionId, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
				maxAge: 86400000
			})
		}
		return res.status(201).end()
	}
})

module.exports = handleGeneralEndpointRouter