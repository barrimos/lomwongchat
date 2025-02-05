const express = require('express')
const multer = require('multer')

const userModel = require('../../models/user.model')
const uploadFileModel = require('../../models/uploadFile.model')

const clientRedis = require('../../redis/redisServer')

const verify = require('../../middlewares/verify')
const { decrypt } = require('../../middlewares/cipher')
const checkOwner = require('../../middlewares/checkOwner')

const IMG = {
	'image/jpg': 'jpg',
	'image/jpeg': 'jpeg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/bmp': 'bmp',
	width: 2000,
	height: 1000,
	size: 2 * 1_048_576
}
const disputeResolution = express.Router()

// Configure Multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './uploads') // Directory to save the uploaded files
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(null, `${uniqueSuffix}-${file.originalname}`)
	},
})

const upload = multer({
	storage: storage,
	limits: { fileSize: IMG['size'] }, // Limit file size to 2MB
})

disputeResolution.post('/open', async (req, res) => {
	try {
		const { username } = req.headers
		const { title, detail } = req.body

		// if client confirmed create issue. change issue's status
		const success = await userModel.updateOne(
			{ username: username },
			{
				$set: { 'issue.status': true },
				$push: {
					'issue.comment': {
						$each: [[title, detail]], $position: 0
					}
				}
			},
			{ new: true }
		)

		if (success.modifiedCount === 1) {
			try {
				await clientRedis.json.SET('users', `$.${username}.issue.status`, true)
				await clientRedis.json.ARRAPPEND('users', `$.${username}.issue.comment`, [title, detail])
			} catch (err) {
				console.error(`Error caching issue update: ${err}`)
			}

			return res.status(201).json({ valid: true })
		} else {
			throw Error('Error issue update')
		}
	} catch (err) {
		console.error(`Error request open issue: ${err}`)
		return res.status(400).json({ error: 'Error request open issue' })
	}
})

// verify when visit dispute page
// still check every refresh page
// should use cache instead
// cache should short life
disputeResolution.get('/:code/:username/:user?', [checkOwner, verify, decrypt], async (req, res) => {
	if (req.verified.valid) {
		res.status(201).json({ valid: req.verified.valid, message: 'Authorized' })
	} else {
		res.status(503).json({ valid: req.verified.valid, error: 'Forbidden Zone' })
	}
})

disputeResolution.get('/fetchComment/:code/:username/:user?', [checkOwner, verify, decrypt], async (req, res) => {
	const topic = []
	if (!req.verified.valid) {
		return res.status(401).json({
			valid: req.verified.valid,
			topic,
			error: 'Unauthorized'
		})
	}

	const uname = req.params.user === 'undefined' ? req.params.username : req.params.user
	try {
		// fetch from cache first
		const cacheIssue = await clientRedis.json.GET('users', { path: `$.${uname}.issue` })
		// first title and detail should have been stored since user opening page
		// so it should already have data
		res.status(200).json({
			valid: req.verified.valid,
			comments: cacheIssue[0].comment,
			requestClose: cacheIssue[0].requestClose
		})
	} catch (err) {
		console.error(`Error fetch cache comment: ${err}`)

		// fallback to database instead if cache is empty or invalid
		try {
			const user = await userModel.findOne(
				{ username: uname },
				{
					issue: { comment: 1, requestClose: 1 }, _id: 0
				}
			)

			if (user && user.issue && user.issue.comment) {
				const { comment, requestClose } = user.issue

				// Push the first two comments into the topic array if they exist
				if (comment.length > 0) {
					topic.push(comment[0], comment[1]);
				}

				res.status(200).json({
					valid: req.verified.valid,
					comments: comment,
					requestClose: requestClose
				})
			}
		} catch (err) {
			console.error(`Error fetch comment from database: ${err}`)
			res.status(500).json({ error: 'Error fetch comment from database' })
		}
	}
})

disputeResolution.post('/postComment/:code/:username/:user?', [checkOwner, verify, decrypt, upload.single('file')], async (req, res) => {
	if (req.verified.valid) {
		// always owner
		const uname = req.params.user === 'undefined' ? req.params.username : req.params.user

		try {
			const isRequestedClose = await clientRedis.json.GET('users', `$.${uname}.issue.requestClose`)
			if (isRequestedClose[0]) {
				return res.status(409).json({ error: 'User requested to close' })
			}
		} catch (err) {
			console.error(`Error to checking request close: ${err}`)

			// fallback to database instead
		}

		const { code } = req.params
		const file = req.file // The uploaded file

		// data comment username unixTime
		const dataComment = [req.body.comment, req.body.username, parseInt(req.body.unixTime)]

		if (!file) {
			if (!req.body.comment || !req.body.username || !uname) {
				return res.status(400).json({
					error: 'Comment and username are required.'
				}
				)
			}
		} else {
			// if attach image
			dataComment.push(file.path)
		}

		const commented = await userModel.updateOne(
			// filter username where still not request to close
			{ username: uname, 'issue.requestClose': false },
			{ $push: { 'issue.comment': dataComment } },
			{ new: true }
		)

		if (commented.modifiedCount === 0) {
			res.status(409).json({ error: 'User requested close', requestClose: true })
		} else {
			try {
				if (file) {
					if (file.size > IMG['size']) {
						return res.status(413).json(
							{
								invalid: true,
								error: 'File is too large'
							}
						)
					} else if (!IMG[file.mimetype]) {
						return res.status(415).json(
							{
								invalid: true,
								error: `File type ${file.mimetype} not support`
							}
						)
					}

					const dataImage = {
						filename: file.originalname,
						path: file.path,
						mimetype: file.mimetype,
						size: file.size,
						username: uname,
						code: code
					}

					try {
						const newFile = new uploadFileModel(dataImage)
						// Save the file metadata in the database:
						newFile.save()

					} catch (err) {
						console.error(`Error insert attach file: ${err}`)
						res.status(500).json({ error: 'Error insert attach file' })
					}
				}
				await clientRedis.json.ARRAPPEND('users', `$.${uname}.issue.comment`, dataComment)

			} catch (error) {
				console.error('Upload error:', error)
				res.status(500).json({ message: 'Failed to upload file' })
			}

			// responds
			if (file) {
				res.status(200).json({
					valid: req.verified.valid,
					message: 'Comment with File uploaded successfully',
					path: file.path
				})
			} else {
				res.status(200).json({
					valid: req.verified.valid,
					message: 'comment successfully',
				})
			}
		}
	} else {
		res.status(401).json({ valid: req.verified.valid, error: 'Unauthorized' })
	}
})

disputeResolution.post('/requestCloseIssue/:code/:username/:user?', [checkOwner, verify, decrypt], async (req, res) => {
	if (req.verified.valid) {
		const uname = req.params.user === 'undefined' ? req.params.username : req.params.user
		await userModel.updateOne({ username: uname }, { $set: { 'issue.requestClose': true } }, { new: true })
			.then(() => {
				res.status(200).json({ valid: req.verified.valid, message: 'Submitting your request', subTitle: 'waiting for Admin response' })
			})
			.catch(err => {
				res.status(409).json({ valid: false, error: err })
			})
	} else {
		res.status(401).json({ valid: req.verified.valid, error: 'Unauthorized' })
	}
})

module.exports = disputeResolution