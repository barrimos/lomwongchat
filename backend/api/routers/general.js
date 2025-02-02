const sessionModel = require('../models/session.model')
const genNonce = require('../plugins/genNonce')
const express = require('express')
const handleGeneralEndpointRouter = express.Router()
const nodeCrypto = require('node:crypto')

handleGeneralEndpointRouter.get('/:action', async (req, res) => {
	const { action } = req.params
	const deviceId = req.cookies.deviceId
	const state = {
		isStayLoggedIn: false
	}
	try {
		// initial
		// check uuid that is stay logged in isn't it
		state.isStayLoggedIn = await sessionModel.findOne(
			{ uuid: req.cookies.deviceId },
			{ username: 1, isLoggedIn: 1 }
		)
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
					sameSite: 'Lax'
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
		const [captcha, signature] = req.cookies.captcha.split('.')
		const validateSignature = nodeCrypto.createHmac('sha256', process.env.CAPTCHA_KEY).update(captcha).digest('hex')

		if (inputcaptcha === captcha && validateSignature === signature) {
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
			const session = await sessionModel.findOne(
				{
					$or: [
						{ sessionId: req.sessionID },
						{ uuid: deviceId }
					]
				},
				{ attempts: 1, isLoggedIn: 1 }
			)

			if (!session) throw Error('Require session id')

			return res.status(200).json({ remains: session.attempts ?? 3 })
		} catch (err) {
			console.error(`Error Get remains: ${err}`)
			return res.status(400).json({ error: 'Get remains error', remains: 3 })
		}
	}
})

module.exports = handleGeneralEndpointRouter