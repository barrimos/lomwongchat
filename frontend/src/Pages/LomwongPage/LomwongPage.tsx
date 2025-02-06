import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Params, useNavigate, useParams } from 'react-router-dom'
import { BubbleTypes } from '../../types'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import Input from '../../Components/Input/Input'
import Button from '../../Components/Button/Button'
import Channel from '../../Components/Channel/Channel'
import Navbar from '../../Components/Navbar/Navbar'
import './dist/LomwongPage.css'

import { getInputValue } from '../../utils/getInputValue'

import axios, { AxiosResponse } from 'axios'
import UsersList from '../../Components/UsersList/UsersList'
import Chat from '../../Components/Chat/Chat'
import { Link } from 'react-router-dom'
import Modal from '../../Components/Modal/Modal'
import topLayer from '../../utils/topLayer'
import DMLists from '../../Components/DMLists/DMLists'
import socketIO from '../../Socket/socket'
import Loader from '../../Components/Loader/Loader'

const isProduction = process.env.REACT_APP_NODE_ENV === 'production'
const protocol = isProduction ? 'https://' : 'http://'
const port = isProduction ? '' : ':8080'
const url = isProduction ? process.env.REACT_APP_NODE_API : 'localhost'
const server = `${protocol}${url}${port}`

const regexAdmin: RegExp = /(?:^|[^a-zA-Z])(admini?n?i?s?t?r?a?t?o?r?)(?:[^a-zA-Z0-9]|$)|(?:\W+)/i
const isMobileSupported: boolean = /android|iphone|kindle|ipad/i.test(navigator.userAgent)

interface Props { }

const socket = socketIO(server)

const LomwongPage = (props: Props): JSX.Element => {
  const initialized = useRef(false)
  const navigate = useNavigate()

  const { yourName, paramsChannel }: Readonly<Params<string>> = useParams()
  const [userRole, setUserRole] = useState<string>('301')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isAuthen, setIsAuthen] = useState<boolean>(false)
  const [deviceId, setDeviceId] = useState<string>('')
  const [isChangeAsideTab, setIsChangeAsideTab] = useState<boolean>(false)
  const [currTab, setCurrTab] = useState<string[]>(['asideChannels', 'New channel', 'Create'])

  const [inpNewChannelName, setInpNewChannelName] = useState<string>('')

  const [inpSearchUser, setInpSearchUser] = useState<string>('')
  const [inpSearchChannel, setInpSearchChannel] = useState<string>('')

  const [errorBox, setErrorBox] = useState<string[]>([])

  const [channelsList, setChannelsList] = useState<string[]>([])
  const [usersOnline, setUsersOnline] = useState<string[]>([])

  // result searching
  const [resultSearchChannel, setResultSearchChannel] = useState<string[]>([])
  const [resultSearchUser, setResultSearchUser] = useState<string[]>([])

  // use joinNewChannel to be dependency capture at Chat component
  // when join new channel bubblesData (at Chat commponent) it still be
  // old chat logs from previous room, so needs to clear that
  const [joinNewChannel, setJoinNewChannel] = useState<boolean>(false)
  const [isCreateNewChannel, setIsCreateNewChannel] = useState<[boolean, string | null]>([false, null])

  // curChannel use for global room
  const [currChannel, setCurrChannel] = useState<string | null>(null)

  // dmRoomName use for private room
  const [dmRoomName, setDmRoomName] = useState<string>('')
  const [dmRoomId, setDmRoomId] = useState<string>('')
  const [isOpenDM, setIsOpenDM] = useState<boolean>(false)
  const [listsDM, setListsDM] = useState<string[] | []>([])
  const [noti, setNoti] = useState<string[] | []>([])
  const [clearListDmRoom, setClearListDmRoom] = useState<string>('')

  const [isToggleMenuOpen, setIsToggleMenuOpen] = useState<boolean>(false)

  const switchTab = (e: React.MouseEvent | React.TouchEvent): void => {
    const target: string = (e.target as HTMLButtonElement).name
    if (target === 'asideChannels') {
      setCurrTab(['asideChannels', 'New channel', 'Create'])
    } else {
      setCurrTab(['asideUsers', 'Search someone', 'Search'])
    }
    setIsChangeAsideTab(true)
  }

  const createNewChannel = async (e: React.MouseEvent | React.TouchEvent | KeyboardEvent): Promise<void> => {
    e.preventDefault()

    if (!inpNewChannelName || errorBox.length > 0) {
      return
    }

    const handlerErrorBox = (errName: string, errType: string) => {
      setErrorBox([errName, errType])
      setTimeout(() => {
        setErrorBox([])
      }, 3000)
    }

    if (regexAdmin.test(inpNewChannelName)) {
      const match: string = inpNewChannelName.match(regexAdmin)![0]
      handlerErrorBox(`Cannot create this room name with this ${match}`, 'create')
      setInpNewChannelName('')
    } else if (channelsList.includes(inpNewChannelName)) {
      handlerErrorBox('This room is already exists', 'create')
      setInpNewChannelName('')
    } else {
      try {
        await axios.post(`${server}/data/channel/create`,
          {
            newRoomName: inpNewChannelName
          },
          {
            headers: {
              username: yourName,
              access: 'lomwong'
            },
            withCredentials: true
          }
        )
        socket.emit('newChannelCreated', inpNewChannelName)
        setIsCreateNewChannel([true, inpNewChannelName])
        // joinChannel(inpNewChannelName)
      } catch (err: any) {
        console.error(err.response.data.error)
        withReactContent(Swal).fire({
          icon: 'warning',
          title: err.response.data.error,
          timer: 2000
        }).then(() => {
          navigate('/')
        })
      }
      setInpNewChannelName('')
    }
  }

  const clearPM = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const elem: HTMLElement = (e.target as HTMLElement)
    const dmName: string | undefined = elem.dataset.receiver
    const dataDmRoomId: string | undefined = elem.dataset.dmRoomId

    // clear user in ListPM
    setListsDM(prev => prev.filter(name => name !== dmName))

    // clear noti
    setNoti((prev: string[]) => {
      const update = prev.filter(name => name !== dmName)
      // need to save this to database for next time or refresh page notification still their
      // save into cache redis
      return update
    })

    // when clear list, if the modal that opening the name as same as list that closing then close modal too
    const currModal: HTMLElement | null = document.querySelector(`.modal[data-receiver="${dmName}"]`)
    if (currModal && dmName === currModal!.dataset.receiver) {
      closeDM()
    }

    socket.emit('leaveDmRoom', yourName, dataDmRoomId)
  }

  const closeDM = () => {
    setIsOpenDM(false)
  }

  const openDM = async (e: React.MouseEvent | React.TouchEvent) => {
    const targetUser: string | undefined = (e.currentTarget! as HTMLElement).dataset.receiver
    // to clear noti in cache
    // data in cache like this ['a', 'b', 'c']
    // shouldn't clear all noti just user who you open dm modal
    // const targetUserIndex: string | undefined = (e.currentTarget! as HTMLElement).dataset.index
    if (!targetUser || targetUser === yourName) return

    setDmRoomName(targetUser)

    // add user who to dm to pmList
    setListsDM((prev: string[]) => {
      if (prev.includes(targetUser)) return prev
      return [...prev, targetUser] // new dm list
    })

    if (!isOpenDM && !document.querySelector(`.moda[data-receiver="${targetUser}"]`)) {
      // index 0 is who you want to talk to
      // index 1 is your name it for generate room name with index 0
      // automatic invitation to targetUser too but don't want users connect this room immediatly
      // then just notification when you text to
      // until users will connect only by open modal with execution this opneDM function
      // index 2 tell socket that you is sender and just opening modal dm room needs to fetch chat logs
      socket.emit('joinDm', [targetUser, yourName, true])

      // remove noti from list pm name that open modal
      setNoti((prev: string[]) => {
        const update: string[] = prev.filter(name => name !== targetUser)
        return update
      })

      // remove noti from cache if where modal that notificated
      socket.emit('clearNotiInCache', targetUser, yourName)

      // open modal
      setIsOpenDM(true)
    }
  }

  // join channel when click at side menu and navbar
  const joinChannel = (str: string): void => {
    let targetChannel: string = str

    if ((currChannel && currChannel === targetChannel) || targetChannel === 'null') return

    if (!channelsList.includes(targetChannel) && !isCreateNewChannel[0]) {
      console.error(`Channel ${targetChannel} doesn't exist`)
      targetChannel = 'lobby'
    }

    setIsCreateNewChannel([false, null])

    setJoinNewChannel(true)

    socket.emit('joinChannel', [currChannel, targetChannel, yourName, deviceId])
    setCurrChannel(targetChannel)
    sessionStorage.setItem('channel', targetChannel)
    navigate(`/lomwong/${yourName}/${targetChannel}`)
  }

  const fetchChannels = async (): Promise<void> => {
    try {
      const response: AxiosResponse = await axios.get(`${server}/data/env/fetch`,
        {
          headers: {
            username: yourName,
            access: 'lomwong'
          },
          withCredentials: true
        }
      )
      const updateChannel: string[] = [...channelsList, ...response.data.channels]
      // console.log('fetchChannel', updateChannel)
      setChannelsList(updateChannel)
    } catch (err) {
      throw err
    }
  }

  const handlerSearching = (data: string): void => {
    let resultSearching: string[] = []
    if ((currTab[0] === 'asideChannels') && inpSearchChannel) {
      resultSearching = channelsList.filter(channel => channel === inpSearchChannel)
      setResultSearchChannel(resultSearching)
      setInpSearchChannel('')
    } else if ((currTab[0] === 'asideUsers') && inpSearchUser) {
      resultSearching = usersOnline.filter(user => user.includes(data))
      setResultSearchUser(resultSearching)
    } else {
      return
    }
  }

  const clearSearchChannel = (): void => {
    setResultSearchChannel([])
  }

  const toggleMenu = (): void => {
    const btn = document.querySelector('.menuBtn i')

    if (isToggleMenuOpen) {
      setIsToggleMenuOpen(false)
      btn!.classList.remove('fa-close')
      btn!.classList.add('fa-bars')
    } else {
      setIsToggleMenuOpen(true)
      btn!.classList.remove('fa-bars')
      btn!.classList.add('fa-close')
    }
  }

  const handlerLogoutBtn = async (e?: React.MouseEvent | React.TouchEvent): Promise<void> => {
    e?.preventDefault()
    e?.stopPropagation()
    try {
      await axios.delete(`${server}/user/logout`,
        {
          headers: {
            username: yourName,
            access: 'lomwong',
            pairdeviceid: localStorage.getItem('deviceId')
          },
          withCredentials: true
        }
      )
    } catch (err) {
      console.error(err)
    }
    socket.emit('logout', yourName, currChannel, deviceId)
    sessionStorage.clear()
    localStorage.clear()
    socket.disconnect()
    navigate('/')
  }

  const authentication = async (): Promise<void> => {
    await axios.get(`${server}/user/auth/token`,
      {
        headers: {
          username: yourName,
          access: 'lomwong',
          pairdeviceid: localStorage.getItem('deviceId')
        },
        withCredentials: true
      }
    )
      .then(async res => {
        if (res.data.valid) {
          try {
            setIsAuthen(res.data.valid)
            setDeviceId(res.data.deviceId.slice(0, 8) ?? 'undefined')
            localStorage.setItem('deviceId', res.data.deviceId)

            // Fetch channels after setting up socket listeners
            await fetchChannels()
            // history each room storing in cache
            // when access in room (One to One or One to Many)
          } catch (err) {
            console.error(`Cannot connect socket: ${err}`)
          }
        } else {
          // if authen token failure back to login page
          if (res.data.error) {
            withReactContent(Swal).fire({
              text: res.data.error,
            })
              .then(() => {
                navigate('/')
              })
          }
        }
      })
      .catch((err) => {
        if (err.response.data.isForceLogout) {
          withReactContent(Swal).fire({
            title: err.response.data.error
          })
          return handlerLogoutBtn()
        } else if (err.response.data.error) {
          // if request api error back to login page
          withReactContent(Swal).fire({
            text: err.response.data.error,
          })
            .then(() => {
              navigate('/')
            })
        }
      })
  }

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      authentication()
    }
  }, [])

  useEffect(() => {
    if (isCreateNewChannel[0] && isCreateNewChannel[1]) {
      joinChannel(isCreateNewChannel[1])
    }
  }, [isCreateNewChannel])

  useEffect(() => {
    const initConnect = async () => {
      // authenticate user
      socket.auth = { username: yourName, role: userRole, deviceId: deviceId }
      // connect socket
      socket.connect()
      // Set loading state off and authorized only after completing all tasks
      setIsLoading(false)

      // Register the user
      socket.emit('registering', yourName)

      await joinChannel(sessionStorage.getItem('channel') || currChannel || 'lobby')
      socket.emit('getNoti', yourName)

      // Clean up the listener to prevent duplicates
      socket.off('getId')

      // get new socket id
      socket.on('getId', (id: string, recentJoin: string) => {
        sessionStorage.setItem('skid', id)
        sessionStorage.setItem('channel', sessionStorage.getItem('channel') ?? recentJoin ?? 'lobby')
      })
    }
    if (channelsList.length && isAuthen) {
      initConnect()
    }
  }, [channelsList, isAuthen])

  useEffect(() => {
    // change aside tab
    if (isChangeAsideTab) {
      document.querySelector('.asideBtn.active')?.classList.remove('active')
      document.querySelector(`.${currTab}`)?.classList.add('active')
      setIsChangeAsideTab(false)
    }
  }, [isChangeAsideTab, currTab])


  useEffect(() => {
    const getUsersOnline = (usersConnect: string[]): void => {
      const updateUsersList: string[] = usersConnect.filter((name: string) => name !== yourName)
      setUsersOnline(updateUsersList)
    }

    // when someone messaging to you and you didn't join same room
    // sender will invite you to join that room
    // and you will automatic to join for recieve message
    // if that user send message you can receive a notification at getNotificaiton()
    // index 2 tell socket that you is receiver
    const receiveInviteDm = (inviter: string): void => {
      socket.emit('joinDm', [inviter, yourName, false])
    }

    const getNotification = async ([newMessage, isDm, channel]: [BubbleTypes['bubble'][], boolean, string]): Promise<void> => {
      const newMsg: BubbleTypes['bubble'][] = newMessage
      newMsg.map((msg: BubbleTypes['bubble']) => {

        const sender: string = msg.username

        // show notification
        if (sender !== yourName && !isOpenDM && isDm && !document.querySelector(`.modal[data-receiver=${sender}]`)) {
          // if cleared lists in dm list I another tried send dm again, hsi name will adding to listPM again
          setListsDM((prev: string[]) => {
            if (prev.includes(sender)) return prev
            return [...prev, sender]
          })
          // then turn noti again
          setNoti((prev: string[]) => {
            const update = !prev.includes(sender) ? [...prev, sender] : prev
            // need to save this to database for next time or refresh page notification still their
            // save into cache redis
            return update
          })

          // when someome sending message to you and you didn't open modal
          // that message will save into cache for remidner you
          // when you were logout and didn't read it and later you login back again
          // set name in listsDm
          // and noti in setNoti
          socket.emit('saveNotiToCache', sender, yourName)
        }
      })

    }

    const getCacheNoti = (noti: { [key: string]: number }): void => {
      const names: string[] = Object.keys(noti)
      names.forEach((notiName: string) => {
        setListsDM((prev: string[]) => !prev.includes(notiName) ? [...prev, notiName] : prev)
        setNoti((prev: string[]) => !prev.includes(notiName) ? [...prev, notiName] : prev)
      })
      // get noti from cache
      // it just array of name who send message to you
      // render lists at listDM component with noti
    }

    const forceLogout = (message: string): void => {
      withReactContent(Swal).fire({
        title: message,
        allowOutsideClick: true
      })
      handlerLogoutBtn()
    }

    socket.on('getCacheNoti', getCacheNoti)
    socket.on('usersOnline', getUsersOnline)
    socket.on('fetchNewChannel', fetchChannels)
    socket.on('inviteDm', receiveInviteDm)
    socket.on('broadcast', getNotification)
    socket.on('forceLogout', forceLogout)

    return () => {
      socket.off('getCacheNoti', getCacheNoti)
      socket.off('inviteDm', receiveInviteDm)
      socket.off('broadcast', getNotification)
      socket.off('usersOnline', getUsersOnline)
      socket.off('fetchNewChannel', fetchChannels)
      socket.off('forceLogout', forceLogout)
    }
  }, [])

  useEffect(() => {
    const setCurrDmRoomId = (_dmRoomId: string, receiver: string): void => {
      // DOM exists: After re-render, if the opened modal for the receiver exists,
      // set the current "dm room id" to enable sending messages to all users in the room.
      // 
      // DOM doesn't exist: For other users in this room who haven't opened the DM modal,
      // skip setting the "dm room id." These users will only receive notifications
      // until they open the modal to join the DM room.
      if (document.querySelector(`.modal[data-receiver=${receiver}]`)) {
        setDmRoomId(_dmRoomId)
        setClearListDmRoom(_dmRoomId)
      } else {
        setClearListDmRoom(_dmRoomId)
      }
    }
    socket.on('dmRoomId', setCurrDmRoomId)
    return () => {
      socket.off('dmRoomId', setCurrDmRoomId)
    }
  }, [isOpenDM])

  useEffect(() => {
    if (isOpenDM && isToggleMenuOpen) toggleMenu()
  }, [isOpenDM, dmRoomName])

  useEffect(() => {
    handlerSearching(inpSearchUser)
  }, [inpSearchUser])

  return (
    <>
      {
        isLoading || !isAuthen ?
          <Loader />
          :
          <div className='container'>
            <div className='row'>
              <div className='d-none d-md-block col-md-2'>
                <aside id='asideProfile'>
                  <div className='profileUsername'>
                    <h1>{yourName}</h1>
                    <div className='deviceId'>{deviceId}</div>
                  </div>
                  <div className='asideProfileMenu'>
                    <span>Reports</span>
                    <Link to={`/lomwong/helps/${yourName}`} className='linkTicket'>
                      <i className='fa fa-ticket'></i>
                    </Link>
                  </div>
                  <div className='asideProfileMenu'>
                    <span>Direct Message</span>
                  </div>
                  <ul className='personalMessageList'>
                    {
                      listsDM && listsDM.length > 0 ?
                        listsDM.map((dmName: string, i: number) => {
                          return (
                            <DMLists
                              key={i}
                              dataIndex={i}
                              isMobileSupported={isMobileSupported}
                              dmName={dmName}
                              clearPM={clearPM}
                              openDM={openDM}
                              clearBtnDmRoom={clearListDmRoom}
                              noti={noti}
                              isOpenDM={isOpenDM}
                            />
                          )
                        })
                        :
                        <li className='empty'>No direct message</li>
                    }
                  </ul>
                </aside>
              </div>
              <div className='col-12 col-md-6 p-0'>
                <main>
                  <Navbar
                    yourName={yourName}
                    isToggleMenuOpen={isToggleMenuOpen}
                    toggleMenu={toggleMenu}

                    // setState current tab
                    setCurrTab={setCurrTab}
                    // value current tab
                    currTab={currTab}
                    // list users online
                    usersOnline={inpSearchUser.length > 0 ? resultSearchUser : usersOnline}
                    // input search user online
                    inpSearchUser={inpSearchUser}
                    // setState search user online
                    setInpSearchUser={setInpSearchUser}

                    errorBox={errorBox}

                    // list channels
                    ch={channelsList}
                    // current join channel
                    currChannel={currChannel}
                    // setState create new channel
                    setInpNewChannelName={setInpNewChannelName}
                    // input create new channel
                    inpNewChannelName={inpNewChannelName}
                    // method create new channel
                    createNewChannel={createNewChannel}
                    // method join channel
                    joinChannel={joinChannel}
                    // input search channel
                    inpSearchChannel={inpSearchChannel}
                    // setState search channel
                    setInpSearchChannel={setInpSearchChannel}
                    // result search channel
                    resultSearchChannel={resultSearchChannel}
                    // clear search
                    clearSearchChannel={clearSearchChannel}
                    // open dm modal
                    openDM={openDM}
                    // bring top layer
                    topLayer={topLayer}

                    // method search user and channel
                    handleSearching={handlerSearching}

                    // notification
                    noti={noti}
                    isOpenDM={isOpenDM}

                    // logout
                    handlerLogoutBtn={handlerLogoutBtn}
                  />
                  <Chat
                    server={server}
                    yourName={yourName}
                    socket={socket}
                    id='displayChat'
                    joinNewChannel={joinNewChannel}
                    setJoinNewChannel={setJoinNewChannel}
                    currChannel={currChannel}
                    isToggleMenuOpen={isToggleMenuOpen}
                    toggleMenu={toggleMenu}
                    autoFocus={true}
                    isDm={false}
                    role={userRole}
                  />
                  {
                    isOpenDM ?
                      <Modal
                        title={dmRoomName}
                        isMobileSupported={isMobileSupported}
                        draggable={true}
                        handlerCloseModal={closeDM}
                        topLayer={topLayer}
                        handleClearModal={clearPM}
                        clearBtnDmRoom={clearListDmRoom}
                        className='dmModal'
                      >
                        <Chat
                          server={server}
                          yourName={yourName}
                          socket={socket}
                          id='dmDisplay'
                          currChannel={dmRoomId}
                          joinNewChannel={joinNewChannel}
                          setJoinNewChannel={setJoinNewChannel}
                          autoFocus={true}
                          isDm={true}
                          isToggleMenuOpen={isToggleMenuOpen}
                          toggleMenu={toggleMenu}
                          role={userRole}
                        />
                      </Modal>
                      :
                      <></>
                  }
                </main>
              </div>
              <aside className='col-md-4 d-none d-md-block'>
                <div id='asideMenu'>
                  <div className='aside-menu d-flex justify-content-between align-items-center'>
                    <Button
                      type='button'
                      name='asideChannels'
                      id='asideChannels'
                      className='asideBtn asideChannels active'
                      innerText='Channels'
                      onClick={(e: React.MouseEvent | React.TouchEvent) => switchTab(e)}
                    />
                    <Button
                      type='button'
                      name='asideUsers'
                      id='asideUsers'
                      className='asideBtn asideUsers'
                      innerText='Users'
                      onClick={(e: React.MouseEvent | React.TouchEvent) => switchTab(e)}
                    />
                    <Button
                      type='button'
                      name='logoutBtn'
                      id='logoutBtn'
                      className='asideBtn logoutBtn'
                      innerText='fa fa-power-off'
                      useIconFA={true}
                      onClick={handlerLogoutBtn}
                    />
                  </div>
                  <div id='inpAside'>
                    <Input
                      onChange={(e: ChangeEvent<HTMLInputElement>) => getInputValue(e, currTab[0] === 'asideChannels' ? setInpNewChannelName : setInpSearchUser)}
                      type='text'
                      name='inpCreateNewChannel'
                      id='inpCreateNewChannel'
                      className='inpValueSearch'
                      data-submit={currTab[2].toLocaleLowerCase()}
                      placeHolder={currTab[1]}
                      value={currTab[0] === 'asideChannels' ? inpNewChannelName : inpSearchUser}
                    />
                    {
                      currTab[0] === 'asideChannels' ?
                        <Button
                          onClick={(e: React.MouseEvent | React.TouchEvent | KeyboardEvent) => createNewChannel(e)}
                          type='button'
                          name='submitAsideBtn'
                          id='submitAsideBtn'
                          className='submitInp'
                          innerText={currTab[2]}
                          value={inpNewChannelName}
                        />
                        :
                        <></>
                    }
                    {
                      errorBox[0] ?
                        <div className={`errorBox ${errorBox[0] ? 'active' : ''}`}>{errorBox[0]}</div>
                        :
                        <></>
                    }
                  </div>
                  <div id="groupWrapper">
                    <ul id='groupList'>
                      <Button
                        type='button'
                        name='asideChatAdmin'
                        className='asideChatAdmin p-5 asideBtn'
                        innerText=''
                        attr={[{ 'data-receiver': 'admin' }, { 'data-is-open': false }]}
                        onClick={openDM}
                      >
                        Text to admin <i className='fa fa-commenting-o'></i>
                      </Button>
                      {
                        currTab[0] === 'asideChannels' ?
                          <Channel
                            currChannel={currChannel}
                            ch={resultSearchChannel.length > 0 ? resultSearchChannel : channelsList}
                            resultSearchChannel={resultSearchChannel}
                            clearSearchChannel={clearSearchChannel}
                            joinChannel={joinChannel}
                            setInpSearch={setInpSearchChannel}
                            handleSearching={handlerSearching}
                            inpSearch={inpSearchChannel}
                          />
                          :
                          <UsersList yourName={yourName} usersOnline={inpSearchUser.length > 0 ? resultSearchUser : usersOnline} openDM={openDM} />
                      }
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          </div >
      }
    </>
  )
}

export default LomwongPage