const express = require('express')
const userModel = require('../models/user.model')
const { channelModel } = require('../models/chatLogs.model')
const ticketModel = require('../models/ticket.model')
const uploadFileModel = require('../models/uploadFile.model')
const clientRedis = require('../redis/redisServer')
const getRole = require('../plugins/getRole')
const handleValidate = require('../plugins/handleValidate')
const sessionModel = require('../models/session.model')

const resetBanned = async username => {
	try {
		const isExistCache = await clientRedis.json.GET('users', { path: `$.${username}` })
		if (isExistCache.length > 0) {
			await clientRedis.json.SET('users', `$.${username}.status`, 'normal')
			await clientRedis.json.SET('users', `$.${username}.issue.code`, '')
			await clientRedis.json.SET('users', `$.${username}.issue.comment`, [])
			await clientRedis.json.SET('users', `$.${username}.issue.status`, false)
		}
	} catch (err) {
		console.error('Set user status error: ', err)
	}
}

const handleDataEndpointRouter = express.Router()

handleDataEndpointRouter.all('/:topic/:action', async (req, res) => {
	// who request where access
	const { username, access } = req.headers
	// optional fetch
	const { topic, action } = req.params
	// topic : action
	// env : get
	// channel : post
	// ticket : get, update and post
	// ssid: delete

	// get role from cache first
	let userRole
	try {
		userRole = await clientRedis.json.GET('users', { path: `$.${username}.role` })
	} catch (err) {
		console.error(`Error get user's role: ${err}`)
		userRole = await getRole(username)
	}
	userRole = userRole[0] || userRole.role

	// default fetch
	if (req.verified.valid) {
		try {
			if (topic === 'env' && action === 'fetch') {
				let channelsNameList = await clientRedis.LRANGE('channels', 0, -1)
				if (channelsNameList.length < 1 || !channelsNameList) {
					const listsChannel = await channelModel.find({}, { room: 1, _id: 0 })
					listsChannel.map(async channel => {
						await clientRedis.RPUSH('channels', channel.room)
					})
				}
				channelsNameList = await clientRedis.LRANGE('channels', 0, -1)

				// for admin role
				if (handleValidate.access[access] === handleValidate.access.adsysop
					&& userRole === handleValidate.role.admin
				) {
					// for admin role and request from adsysop page only
					const usersData = await userModel.find(
						{  },
						{
							dmLists: 0,
							'issue.comment': 0,
							password: 0,
							token: 0,
							createdAt: 0,
							_id: 0, __v: 0
						}
					)
					const reportsData = await ticketModel.find({}, { _id: 0 })

					const sessions = await sessionModel.find({},
						{
							attempts: 0,
							createdAt: 0,
							_id: 0
						}
					)

					return res.status(200).json({
						valid: true,
						users: usersData,
						reports: reportsData,
						channels: channelsNameList,
						sessions: sessions
					})
				} else {
					// in case user role will return only channels
					return res.status(200).json({
						valid: true,
						channels: channelsNameList
					})
				}
			}
		} catch (err) {
			console.error(`Error fetch env: ${err}`)
			return res.status(400).json({ error: 'Error fetch environments' })
		}

		// create channel
		try {
			if (topic === 'channel' && action === 'create') {
				// find if exits
				const isExist = await channelModel.findOne({ room: { $eq: req.body.newRoomName } })

				if (!isExist && userRole !== handleValidate.role.admin) {
					const data = new channelModel({ room: req.body.newRoomName })
					data.save()
						.then(() => {
							return res.status(201).json({ message: 'created completed' })
						})
						.catch(err => {
							return res.status(400).json({ message: 'craete incomplete', err })
						})
				} else {
					return res.status(400).json({ error: 'Room already exists' })
				}
			}
		} catch (err) {
			console.error(`Error create channel: ${err}`)
			return res.status(400).json({ error: 'Error create channel' })
		}

		// ticket
		try {
			if (topic === 'ticket') {
				if (action === 'fetch') {
					try {
						const allTickets = await ticketModel.find({}, { _id: 0, __v: 0 })

						if (allTickets.length > 0) {
							res.status(200).json({ reportDatas: allTickets })
						}
					} catch (err) {
						console.error(`Error fetch tickets: ${err}`)
						return res.status(400).json({ error: 'Error fetch tickets' })
					}
				}

				if (action === 'post') {
					const data = req.body.data
					data.details = req.body.details

					data.timeMessage = new Date(Number(data.timeMessage))

					const newTicket = new ticketModel(data)
					await newTicket.validate()

					newTicket.save()
					return res.status(201).json({ message: 'Ticket reported', ticket: newTicket.code })
				}

				if (action === 'update' && handleValidate.access[access] === handleValidate.access.adsysop && userRole === handleValidate.role.admin) {
					const { ticket, newStatus } = req.body
					const successUpdated = await ticketModel.updateOne(
						{ code: ticket },
						{ $set: { status: newStatus } },
						{ $new: true }
					)
					if (successUpdated) {
						return res.status(201).json({ reports: successUpdated })
					} else {
						console.error(`Update ticket or status error: ${err}`)
						return res.status(304).json({ error: 'Update ticket or status error' })
					}
				}

				if (action === 'close' && handleValidate.access[access] === handleValidate.access.adsysop && userRole === handleValidate.role.admin) {
					const { ticket } = req.headers
					const successDeletedTicket = await ticketModel.deleteOne({ code: ticket })
					if (successDeletedTicket) {
						return res.status(201).json({ reports: successDeletedTicket })
					} else {
						console.error(`Delete ticket error: ${err}`)
						return res.status(304).json({ error: 'Delete ticket error' })
					}
				}
			}
		} catch (err) {
			console.error(`Error ticket management: ${err}`)
			return res.status(404).json({ error: 'Error ticket management' })
		}

		// dispute admin
		try {
			if (topic === 'dispute' && action === 'close') {
				if (handleValidate.access[access] === handleValidate.access.adsysop && userRole === handleValidate.role.admin) {
					// const { access, username } = req.headers
					const { user, code } = req.body
					try {
						const deletedImage = await uploadFileModel.deleteMany(
							{
								$and: [
									{ code: code },
									{ username: user }
								]
							}
						)
						const updatedStatus = await userModel.updateOne(
							{ username: user },
							{
								$set: {
									'issue.status': false,
									'issue.code': '',
									'issue.comment': [],
									'issue.requestClose': false,
									status: 'normal'
								}
							},
							{ new: true }
						)

						if (deletedImage || updatedStatus) {
							// reset issue in cache
							resetBanned(user)

							return res.status(201).end()
						}
					} catch (err) {
						console.error(`Error close dispute issue: ${err}`)
						return res.status(409).json({ error: 'Error close dispute issue' })
					}
				} else {
					return res.status(401).json({ valid: false, error: 'Unauthorized' })
				}
			}
		} catch (err) {
			console.error(`Error terminate close issue: ${err}`)
			return res.status(404).json({ error: 'Error terminate close issue' })
		}

		try {
			if (topic === 'ssid') {
				if (handleValidate.access[access] === handleValidate.access.adsysop && userRole === handleValidate.role.admin) {
					const { data, uuid } = req.body
					if (data.length < 1) {
						return res.status(400).json({ valid: false, error: 'Invalid delete data' })
					}
					if (action === 'delete') {
						// cron job
						// const now = new Date()
						// await sessionModel.deleteMany({ expiresAt: { $lte: now } })

						const success = await sessionModel.deleteMany(
							{ sessionId: { $in: data } }
						)

						if (success.deletedCount > 0) {
							res.status(201).json({ valid: true, message: 'Delete sesion id complete' })

							// delete session in cache
							uuid.forEach(async id => {
								await clientRedis.DEL(`session:${username}:${id}`)
							})
						} else {
							res.status(204).json({ valid: false, message: 'Delete session id incomplete' })
						}
					} else {
						return res.status(400).json({ valid: false, error: 'Error request command' })
					}
				} else {
					return res.status(401).json({ valid: false, error: 'Unauthorized' })
				}
			}
		} catch (err) {
			console.error(`Error delete session ID: ${err}`)
			return res.status(500).json({ error: 'Server delete sid error' })
		}

	} else {
		return res.status(403).json({ valid: false, error: req.verified.error })
	}
})

module.exports = handleDataEndpointRouter