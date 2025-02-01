const socket_io = require('socket.io')
const clientRedis = require('../redis/redisServer')
const { channelModel, privateRoomModel } = require('../models/chatLogs.model')
const handleValidate = require('../plugins/handleValidate')
const { findOneByUsername } = require('../plugins/handlerUser')

const socket = async (server, options) => {
  // to store clients socket id
  const clientsConnected = {}
  // to store admin socket id
  const adminConnected = {}
  // to store all users username mapping with socket id
  const loginName = {}

  // initial value for create new channel
  const channels = {
    lobby: {
      count: 0,
      users: []
    },
    deepSeekR1: {
      count: 0,
      users: []
    }
  }

  // map which room the client is currently in
  const currJoinChannel = {}

  // flag for tracking channel that having update or not when time to save
  // chat logs to database to avoid unnecessary writes to the database
  const flag = {} // for tracking that which channel have chat update
  const trackingChatIndex = {} // for tracking last index of chat log each channel

  const io = socket_io(server, {
    cors: options
  })

  const cronJobSaveChatLogs = async () => {
    try {
      // // Get all active rooms from Redis
      // let allChannels = await clientRedis.LRANGE('channels', 0, -1)

      // // If no rooms are found in cache, retrieve from database
      // if (!allChannels || allChannels.length === 0) {
      //   const dbRooms = await channelModel.find({}, { room: 1, _id: 0 })
      //   allChannels = dbRooms.map(item => item.room)
      // }

      for (const room in flag) {
        // Skip rooms with no updates
        // flag[room][0] room has changes update ?
        if (!flag[room] || !flag[room][0]) continue

        // flag[room][1] that room is private or global
        let roomModel = flag[room][1] ? privateRoomModel : channelModel

        try {
          // Ensure tracking index exists (fallback to DB)
          if (trackingChatIndex[room] === undefined) {
            const dbRoom = await roomModel.findOne({ room: room }, { chatLogs: 1 })
            trackingChatIndex[room] = dbRoom ? dbRoom.chatLogs.length : 0
          }

          // Fetch chat logs from Redis
          const cacheChatLogs = await clientRedis.LRANGE(room, trackingChatIndex[room], -1)

          // Only update database if there are new logs
          if (cacheChatLogs.length > 0) {
            await roomModel.updateOne(
              { room: room },
              { $push: { chatLogs: { $each: cacheChatLogs } } }
            )

            // Update last index
            trackingChatIndex[room] = await clientRedis.LLEN(room) || 0
            console.log(`[CRON] Chat logs saved for room: ${room}`)
          }
        } catch (err) {
          console.error(`[CRON] Error saving logs for room: ${room}`, err)
        }
      }
    } catch (err) {
      console.error('[CRON] Failed to execute chat logs cron job', err)
    }
  }


  const authHandshake = (socket, next) => {
    const username = socket.handshake.auth.username
    const userRole = socket.handshake.auth.role
    const userUuid = socket.handshake.auth.uuid
    if (!username || !userRole || !userUuid) {
      return next(new Error('Unauthorized'))
    }
    socket.username = username
    socket.role = userRole
    socket.uuid = userUuid
    next()
  }

  const fetchChatLogs = async (roomName, roomModel, msgFrom, role, isDm) => {
    try {
      // when user join channel broadcast old chat logs
      // // 0, -1 is fron index 0 to last index
      // -20 -1 is from index 20 to last index
      let chatLogs = await clientRedis.LRANGE(roomName, -20, -1)
      if (chatLogs.length < 1) {

        // find in database if database still empty skip broadcast
        chatLogs = await roomModel.aggregate([
          { $match: { room: roomName } },
          { $project: { [roomName]: { $slice: ['$chatLogs', -20] }, _id: 0 } }
        ])
        // in case private room
        // after uesr click open dm room
        // if both users never create once before then create one
        // room name can have multiple names by combining names
        // so it is not possible to create a specific one from the beginning
        if (isDm && chatLogs.length === 0) {
          const newRoomCreate = new roomModel({ room: roomName })
          newRoomCreate.save()
          return
        }
        // if room exist but not have any chat log
        if (chatLogs[0][roomName].length < 1) {
          return
        }
        // update
        chatLogs = chatLogs[0][roomName]

        // storing in cache
        await clientRedis.RPUSH(roomName, chatLogs)
        await clientRedis.EXPIRE(roomName, 86400) // expire 1 day

        // update last index
        trackingChatIndex[roomName] = await clientRedis.LLEN(roomName) || 0
      }

      // broadcast
      chatLogs = chatLogs.map(log => JSON.parse(log))
      if (chatLogs.length > 0) {
        const targetClient = role === handleValidate.role.admin ? adminConnected[msgFrom] : clientsConnected[msgFrom]
        if (!targetClient) {
          console.error(`Error not target user: ${msgFrom} not found`)
        }
        io.to(targetClient).emit('broadcast', [chatLogs, isDm, roomName])
      }
    } catch (err) {
      console.error('Fetching chat logs error:', err)
    }
  }

  io.use(authHandshake)

  io.on('connection', socket => {
    console.log(`${socket.id} connected`)

    socket.on('registering', async username => {
      // console.log('Listeners for getId:', socket.listeners('getId').length)
      // console.log('Current events with listeners:', socket.eventNames())
      if (socket.role === handleValidate.role.admin) {
        adminConnected[username] = socket.id // Update admin socket ID
      } else {
        if (clientsConnected[username] !== socket.id) {
          // delete old socket id
          delete loginName[clientsConnected[username]]

          // Update only if socket ID has changed
          clientsConnected[username] = socket.id

          // map new socket id with username
          loginName[socket.id] = username
        }
      }

      if (!currJoinChannel[username]) {
        currJoinChannel[username] = {}
        currJoinChannel[username][socket.uuid] = null
      }

      // send socket id back
      // in case user stay logged in (not log out request) will attached recently channel joined
      // if log out request it will cleared recent channel join
      await socket.emit('getId', socket.id, currJoinChannel[username][socket.uuid])

      // send to all clients include yourself to lists user who online
      // include admin
      io.emit('usersOnline', Object.keys(clientsConnected))
    })

    // open dm
    socket.on('joinDm', async ([msgTo, msgFrom, isJoinByOpenDm]) => {
      const dmRoomId = [msgFrom, msgTo].sort().join('-')
      const socketIdTarget = clientsConnected[msgTo]
      // const socketIdTarget = adminConnected[msgTo] ?? clientsConnected[msgTo]

      // if channel not exists and have room id
      // crate new and set initial
      // channel will create only once from inviter
      if (!channels[dmRoomId] && dmRoomId) {
        channels[dmRoomId] = { count: 1, users: [msgFrom] }
      }

      if (!channels[dmRoomId].users.includes(msgFrom)) {
        // if channel room exists
        // inviter and guess will come this socket each

        // if your not inviter you will be guest
        // in case inviter created channel, this condition block will false
        // in case guest joining thier socket id will not appeared in channel condition will be true
        channels[dmRoomId].count++
        channels[dmRoomId].users.push(msgFrom)
      }

      // main socket
      await socket.join(dmRoomId)

      // send room id back use for emit sending message to broadcast later
      // msgTo it use for open modal dm room of receiver
      await socket.emit('dmRoomId', dmRoomId, msgTo)

      // send invitation to guest who you message to and notification that person
      // only case that person didn't join this roomc

      if (!channels[dmRoomId].users.includes(msgTo)) {
        // send to all clients except yourself (in case specific client)
        await socket.to(socketIdTarget).emit('inviteDm', msgFrom)
      }

      if (isJoinByOpenDm) {
        fetchChatLogs(dmRoomId, privateRoomModel, msgFrom, socket.role, true)
      }
    })

    // clear dm (not minimize)
    socket.on('leaveDmRoom', (username, dmRoomId) => {
      channels[dmRoomId].count--
      channels[dmRoomId].users = channels[dmRoomId].users.filter(uname => uname !== username)
      if (channels[dmRoomId].count === 0) {
        delete channels[dmRoomId]
      }
    })

    socket.on('joinChannel', async ([leaveChannel, targetChannel, uname, uuid]) => {
      if (uuid !== socket.uuid || uname !== socket.username) return

      const chLeave = channels[leaveChannel]
      let chJoin = channels[targetChannel]

      // if target channel doesn't exist in object channels then create
      if (!chJoin && targetChannel) {
        channels[targetChannel] = { count: 0, users: [] }
        chJoin = channels[targetChannel]
      }

      if (leaveChannel) {
        chLeave.count--
        // update users in channel
        chLeave.users = chLeave.users.filter(user => user !== `${socket.uuid}:${socket.username}`)

        // leave from channel
        socket.leave(leaveChannel)

        // broadcast who leaved
        socket.to(leaveChannel).emit('whoJustJoinedAndLeave', socket.username, false)
      }
      if (targetChannel) {
        // if target channel doesn't exist return lobby
        if (!channels[targetChannel]) {
          targetChannel = 'lobby'
          // update
          chJoin = channels[targetChannel]
        }

        // if users not in this channel
        if (!chJoin.users.includes(`${socket.uuid}:${socket.username}`)) {

          // increase amount
          chJoin.count++

          // add user name with valud uuid
          chJoin.users.push(`${socket.uuid}:${socket.username}`)
        }
        // attach new channel joining
        currJoinChannel[socket.username][socket.uuid] = targetChannel

        socket.join(targetChannel)

        // report to admin where are you now
        io.emit('whereUsersLive', {
          targetUsername: socket.username,
          uuid: socket.uuid,
          leaveChannel: leaveChannel,
          targetChannel: targetChannel,
          currJoinChannel: currJoinChannel,
          isLogOut: false
        })

        // broadcast who joined, send to everyone except you
        socket.to(targetChannel).emit('whoJustJoinedAndLeave', socket.username, true)
        fetchChatLogs(targetChannel, channelModel, socket.username, socket.role, false)
      }
    })

    socket.on('getNoti', async yourName => {
      // Scenario: When a user logs back in:
      // - If the message still exists in the cache, retrieve it from the cache.
      // - If the TTL has expired, retrieve it from the database instead.
      //   The database serves as a fallback to ensure the notification persists,
      //   even if the user doesn't interact with it before the TTL expires.

      // verified
      if (socket.username !== yourName) return

      try {
        // Get notification from Redis cache
        // Logic:
        // - First, check if the notification exists in the Redis cache.
        let fallbackMsg = await clientRedis.json.GET('users', { path: `$.${yourName}.dmLists` })
        if (fallbackMsg[0] && Object.keys(fallbackMsg[0]).length > 0) {
          socket.emit('getCacheNoti', fallbackMsg[0])
        } else {
          // - If not, fetch from the database
          fallbackMsg = await findOneByUsername(yourName, { dmLists: 1, _id: 0 })
          // fallbackMsg = await userModel.findOne({ username: yourName }, { dmLists: 1, _id: 0 })
          if (fallbackMsg.dmLists && Object.keys(fallbackMsg.dmLists).length > 0) {
            socket.emit('getCacheNoti', fallbackMsg[0])
          }
        }
        // the chat logs will fetch when you join a channel or open dm modal
      } catch (err) {
        console.error('Error fetching notification', err)
      }
    })

    socket.on('saveNotiToCache', async (msgFrom, msgTo) => {
      // Purpose: Save notifications to Redis for quick access.
      // - Ensures persistence in case of user logout or sudden app closure.
      // - Temporarily stores the notification in Redis to reduce database load.
      // 
      // Scenario: If a user receives a notification and then closes the app or logs out,
      //           the notification will persist and be available when the user logs back in.
      // 
      // Implementation:
      // - Use Redis's `EX` option to set a TTL (e.g., 7 days).
      // - Optionally, schedule a database save for long-term persistence.

      // Save notification to Redis cache and database
      try {
        // check key exist
        const isExist = await clientRedis.json.GET(`users`, { path: `$.${msgTo}.dmLists` })
        // isExist return [ {} ]
        if (isExist.length === 0) {
          // set initial
          await clientRedis.json.SET(`users`, `$.${msgTo}.dmLists`, {})
          // set expire 1 day
          await clientRedis.json.EXPIRE(`users`, 86400)
        }
        // save into 

        // set dm lists noti
        await clientRedis.json.SET(`users`, `$.${msgTo}.dmLists.${msgFrom}`, 1)
      } catch (err) {
        console.error('saveNotiToCache', err)
      }
    })

    socket.on('clearNotiInCache', async (msgTo, msgFrom) => {
      try {
        // Clear notifications that between you and user who you open dm modal from Redis cache
        // Purpose: Remove notifications once users have opened or interacted with them.
        // Scenario: When a user views a notification, it is no longer necessary to keep
        //           it in the Redis cache, ensuring only unread or pending notifications are stored.

        // when open dm modal to see messages clear dm lists
        await clientRedis.json.DEL('users', `$.${msgFrom}.dmLists.${msgTo}`)
      } catch (err) {
        console.error('Claer notification error', err)
      }
    })

    socket.on('message', async ([{ rid, bid, username, message, unixTime, reply, deviceId }, isDm], role) => {
      if (socket.username !== username) return
      const data = {
        bid: bid,
        username: username,
        message: message,
        unixTime: unixTime,
        reply: reply,
        deviceId: deviceId
      }

      io.to(rid).emit('broadcast', [[data], isDm, rid])
      try {
        // save to cache (push right following chat queue)
        // save chat into each room
        await clientRedis.RPUSH(rid, JSON.stringify(data))

        // save chat log to database when channel is inactive for 30s

        // index 0: update flag for tracking each room that update new chat
        // index 1: and defind that is private or not
        flag[rid] = [true, isDm]

        // lock machanism to save in database
        const isLocked = await clientRedis.GET('global:locked')
        let roomModel
        if (!isLocked) {
          try {
            // locked all rooms prevent to race condition for save chat logs to database first
            await clientRedis.SET('global:locked', 'locked', { NX: true, EX: 900 }) // expire 15 mins

            // loop each channel includes dm room
            for (const room in flag) {
              // check that channel is locked or not ?
              const isRoomLocked = await clientRedis.GET(`room:${room}:locked`)
              if (isRoomLocked) continue

              roomModel = flag[room][1] ? privateRoomModel : channelModel

              // channel chat room update and channel room didn't locked
              if (flag[room][0] && !isRoomLocked) {
                try {
                  if (trackingChatIndex[room] === undefined) {
                    // in case server restart trackingChatIndex will be reset to be undefined
                    // that make lead too conflict update chat log to database
                    // get length from database instead that is latest data
                    // if case cahce server restart too
                    await roomModel.findOne({ room: room }, { chatLogs: 1 })
                      .then(doc => {
                        trackingChatIndex[room] = doc.chatLogs.length
                      })
                  }

                  // get new chat logs while room locked in cache
                  const newData = await clientRedis.LRANGE(room, trackingChatIndex[room] || 0, -1)
                  // save into database
                  await roomModel.updateOne(
                    { room: room },
                    { $push: { chatLogs: { $each: newData } } },
                    { new: true, upsert: true }
                  )

                  // update last index
                  trackingChatIndex[room] = await clientRedis.LLEN(room) || 0

                  // delete flag for next update
                  delete flag[room]

                  // each channel can save chat logs every 15 mins
                  await clientRedis.SET(`room:${room}:locked`, 'locked', { NX: true, EX: 900 }) // expire 15 mins
                  console.log('save to database completed')

                  // Run cron job after saving latest updates in 10 minutes
                  setTimeout(async () => {
                    await cronJobSaveChatLogs()

                    // Schedule a final check 5 minutes AFTER the lock expires
                    setTimeout(async () => {
                      const isGlobalLocked = await clientRedis.GET(`global:locked`)
                      if (!isGlobalLocked) {
                        console.log('Final save after unlock, ensuring no data loss...')
                        await cronJobSaveChatLogs()
                      } else {
                        console.log('[CRON] no update changes between timing gap')
                      }
                    }, 5 * 60 * 1000) // Run this check 5 minutes after unlock
                  }, 10 * 60 * 1000)
                } catch (err) {
                  console.error(`Error saving chat logs for room: ${room}`, err)
                }
              }
            }
          } catch (errLocked) {
            console.error('Locked global error:', errLocked)
          }
        }
      } catch (errPush) {
        console.error('Redis storing data error:', errPush)
      }
    })

    socket.on('newChannelCreated', async newChannelName => {
      const regexAdmin = /(?:^|[^a-zA-Z])(admini?n?i?s?t?r?a?t?o?r?)(?:[^a-zA-Z0-9]|$)|(?:\W+)/i
      if (!newChannelName.trim() || regexAdmin.test(newChannelName)) return
      channels[newChannelName] = { count: 0, users: [] }
      await clientRedis.RPUSH('channels', newChannelName)
      io.emit('fetchNewChannel')
    })

    socket.on('forceUserLogout', (listsUsersTarget, username, role, reason) => {
      if (!adminConnected[username] || role !== handleValidate.role.admin) return
      listsUsersTarget.forEach(username => {
        io.to(clientsConnected[username]).emit('forceLogout', reason)
      })
      // when force log users out, cron job will be emit socket name 'logout'
    })

    socket.on('logout', (username, leaveChannel, uuid) => {
      if (username !== socket.username || uuid !== socket.uuid) return

      channels[leaveChannel].users = channels[leaveChannel].users.filter(uname => uname !== `${socket.uuid ?? uuid}:${socket.username ?? username}`)
      channels[leaveChannel].count--

      // report to admin
      io.emit('whereUsersLive', {
        targetUsername: socket.username ?? username,
        uuid: socket.uuid ?? uuid,
        leaveChannel: leaveChannel,
        targetChannel: null,
        clientsConnected: clientsConnected,
        isLogOut: true
      })

      // then delete in mapping
      delete loginName[clientsConnected[socket.username ?? username]]

      // if admin logout
      delete adminConnected[socket.username ?? username]
      // if client logout
      delete clientsConnected[socket.username ?? username]
      delete currJoinChannel[socket.username ?? username][socket.uuid ?? uuid]

      // broadcast who leaved
      io.to(leaveChannel).emit('whoJustJoinedAndLeave', socket.username ?? username, false)

      // to update online user lists
      io.emit('usersOnline', Object.keys(clientsConnected))
    })

    socket.on('disconnect', () => {
      console.log(`${socket.id} disconnect`)
    })
  })
}


module.exports = socket