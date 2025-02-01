import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import Input from '../../Components/Input/Input'
import { getInputValue } from '../../utils/getInputValue'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import axios, { AxiosResponse } from 'axios'

import './dist/Dashboard.css'
import Button from '../../Components/Button/Button'
import Switch from '../../Components/Switch/Switch'
import { Params, useNavigate, useParams } from 'react-router-dom'
import BoardBox from '../../Components/BoardBox/BoardBox'
import ActionButtonStatus from './ActionButtonStatus'
import Pagination from '../../Components/Pagination/Pagination'
import Chat from '../../Components/Chat/Chat'
import { BubbleTypes, DashboardUsers, ModalConfig, SessionsDataTypes, TicketBubbleTypes, UsersWhereAreYouTypes } from '../../types'

import Loader from '../../Components/Loader/Loader'
import Modal from '../../Components/Modal/Modal'
import DisputeIssue from './DisputeIssue'
import topLayer from '../../utils/topLayer'
import TabDm from '../../Components/TabDm/TabDm'
import socketIO from '../../Socket/socket'
import TicketManage from './TicketManage'
import SessionManage from './SessionManage'
import sortTable from '../../utils/sortTable'
import handlerListsItemPerPage from '../../utils/handlerListsItemPerPage'

import { testSessions } from '../../testSessions.d'
import { testTicketReports } from '../../testTicketReports.d'
import { testUsers } from '../../testUsers.d'
import { testChannels } from '../../testChannels.d'
import { testChats } from '../../testChats.d'
import { testJoinChannel } from '../../testJoinChannel.d'

const protocol = process.env.REACT_APP_NODE_ENV === 'production' ? 'https://' : 'http://'
const server = `${protocol}${window.location.hostname}:8080`

const socket = socketIO(server)

interface Props { }

const Dashboard = (props: Props) => {
  const navigate = useNavigate()
  const ref = useRef(false)

  const { username }: Readonly<Params<string>> = useParams()
  const adminRole: string = '100'
  const [uuid, setUuid] = useState<string>('')

  const now = new Date().toISOString().split('T')

  const [allChannelsList, setAllChannelsList] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<DashboardUsers[]>([])
  const [issueReports, setIssueReports] = useState<DashboardUsers[] | []>([])
  const [sessionsList, setSessionsList] = useState<SessionsDataTypes[] | []>([])

  const [currPage, setCurrPage] = useState<number>(1)
  const [usersListsPerPage, setUsersListsPerPage] = useState<DashboardUsers[]>([])
  const [usersOnline, setUsersOnline] = useState<string[]>([])
  const [userSessions, setUserSessions] = useState<{ [key: string]: string[][] }>({})

  const [inpSearchUser, setInpSearchUser] = useState<string>('')
  const [resultSearchUser, setResultSearchUser] = useState<DashboardUsers[]>()
  const [usersPerPage, setUsersPerPage] = useState<number>(5)

  const [joinNewChannel, setJoinNewChannel] = useState<boolean>(false)
  const [currChannel, setCurrChannel] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthPass, setIsAuthPass] = useState<boolean>(false)

  const [themeSwitch, setThemeSwitch] = useState<string>('light')

  const [sortedAsc, setSortedAsc] = useState<boolean>(true)
  const [selectValue, setSelectValue] = useState<string>('')

  const [ticketsItems, setTicketsItems] = useState<TicketBubbleTypes[]>([])
  const [isTicketManageOpen, setIsTicketManageOpen] = useState<boolean>(false)
  const [isIssueManageOpen, setIsIssueManageOpen] = useState<boolean>(false)
  const [isSessionManageOpen, setIsSessionManageOpen] = useState<boolean>(false)
  const [isDeleteSession, setIsDeleteSession] = useState<[boolean, SessionsDataTypes['sessionId'][] | string[] | []]>([false, []])

  const [isReady, setIsReady] = useState<boolean>(false)

  // only name
  const [dmRoomName, setDmRoomName] = useState<string>('')
  const [dmRoomId, setDmRoomId] = useState<string>('')
  const [isOpenDM, setIsOpenDM] = useState<boolean>(false)
  const [listsDM, setListsDM] = useState<string[] | []>([])
  const [noti, setNoti] = useState<string[] | []>([])
  const [clearListDmRoom, setClearListDmRoom] = useState<string>('')

  const isMobileSupported: boolean = /android|iphone|kindle|ipad/i.test(navigator.userAgent)

  const reset = (): void => {
    setAllUsers([])
    setAllChannelsList(['lobby'])
    setIsAuthPass(false)
    setIsLoading(false)
    sessionStorage.clear()
    localStorage.clear()
    ref.current = false
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectValue(event.target.value) // Update the state with the selected value
  }

  const clearPM = async (e: React.MouseEvent | React.TouchEvent): Promise<void> => {
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

    socket.emit('leaveDmRoom', await sessionStorage.getItem('skid'), dataDmRoomId)
  }

  const closeDM = (): void => {
    setIsOpenDM(false)
  }

  const openDm = (e: React.MouseEvent | React.TouchEvent): void => {
    const targetUser: string | undefined = (e.currentTarget! as HTMLElement).dataset.receiver
    if (!targetUser || targetUser === username) return

    setDmRoomName(targetUser!)

    // add user who to dm to pmList
    setListsDM((prev: string[]) => {
      if (prev.includes(targetUser)) return prev
      return [...prev, targetUser] // new dm list
    })

    if (!isOpenDM && !document.querySelector(`.modal[data-receiver="${targetUser}"]`)) {
      socket.emit('joinDm', [targetUser, username, true])

      setNoti((prev: string[]) => {
        const update: string[] = prev.filter(name => name !== targetUser)
        return update
      })

      // remove noti from cache if where modal that notificated
      socket.emit('clearNotiInCache', targetUser, username)

      setIsOpenDM(true)
    }
  }

  const searchingUser = (data: string): void => {
    const resultSearching: DashboardUsers[] = allUsers.filter(userObj => userObj.username.toLowerCase().includes(data))
    setTimeout(() => {
      setResultSearchUser(resultSearching)
    }, 500)
  }

  const fetchData = async (): Promise<void> => {
    try {
      // authenticate to request data
      await axios.get(`${server}/data/env/fetch`,
        {
          headers: {
            username: username,
            access: 'adsysop'
          },
          withCredentials: true
        }
      )
        .then(async res => {
          const { users, channels, sessions, reports } = res.data

          // setAllUsers(testUsers)
          setAllUsers(users)

          // handlerListsItemPerPage(testUsers, usersPerPage, currPage, setUsersListsPerPage)
          handlerListsItemPerPage(users, usersPerPage, currPage, setUsersListsPerPage)

          // setAllChannelsList(testChannels)
          setAllChannelsList(channels)

          // setSessionsList(testSessions)
          setSessionsList(sessions)

          // setTicketsItems(testTicketReports)
          setTicketsItems(reports)

          // const filteredUsers = testUsers.filter((user: { issue: { status: boolean } }) => user.issue.status === true)
          const filteredUsers = users.filter((user: { issue: { status: boolean } }) => user.issue.status === true)
          setIssueReports(filteredUsers)

          setIsReady(true)
        })
        .catch(err => {
          withReactContent(Swal).fire(err.response.data.error)
          navigate('/adsysop')
          reset()
        })
    } catch (err) {
      console.error(`Error fetch environment data: ${err}`)
    }
  }


  const renderTableRow = (data: DashboardUsers[]): JSX.Element[] => {
    return (
      data.map((user, index) => {
        const lastActive = (user.lastActive || user.updatedAt).split('T')
        return (
          <tr key={index}>
            <td className='stick' data-key={index}>{user.username}</td>
            <td data-username={user.username}>
              <select defaultValue={'v1'} onChange={handleChange}>
                {
                  userSessions[user.username] ?
                    userSessions[user.username]?.map((item: string[], i: number) => (
                      <option key={i} value={`v${i}`} data-uuid={item[0]} data-room-join={item[1]}>
                        {`${item[0]}-${item[1]}`}
                      </option>
                    ))
                    :
                    <>
                      <option value='v1' data-uuid='null' data-room-join='null'>Offline</option>
                    </>
                }
              </select>
            </td>
            <td>
              <div>{lastActive[0]}</div>
              <div>{lastActive[1].slice(0, 5)}</div>
            </td>
            <td colSpan={2}>
              <div className={`statusName ${user.status}`} data-username={user.username}>
                {user.status}
              </div>
              <ActionButtonStatus
                actionStatus={updateUserStatus}
                personalMessage={openDm}
                user={user}
                noti={noti}
                isOpenDM={isOpenDM}
              />
            </td>
          </tr >
        )
      })
    )
  }

  const logoutDashboard = async (): Promise<void> => {
    await axios.delete(`${server}/user/logout`,
      {
        headers: {
          username: username,
          access: 'adsysop'
        },
        withCredentials: true
      }
    )
      .then(() => {
        socket.emit('logout', username, currChannel, uuid)
        reset()
        socket.disconnect()
        navigate('/adsysop')
      })
      .catch(err => {
        console.error(err.response.data.eror)
        reset()
        socket.disconnect()
        navigate('/adsysop')
      })
  }

  const updateUserStatus = async (e: React.MouseEvent | React.TouchEvent, user: DashboardUsers, statusNum: string): Promise<void> => {
    const btn = (e.currentTarget as HTMLElement)
    // prevent press same current status
    if (btn.classList.contains('active')) return

    const newStatusName: string | null = btn.getAttribute('name')

    const qryUser: HTMLElement = (document.querySelector(`td>div.statusName[data-username="${user.username}"]`) as HTMLElement)
    const currentStatus: string = qryUser.classList[1]

    await axios.post(`${server}/user/status/update`, { statusName: newStatusName, user: user },
      {
        headers: {
          username: username,
          access: 'adsysop'
        },
        withCredentials: true
      }
    )
      .then(() => {
        // change UI
        qryUser.nextElementSibling?.querySelector('.actionStatusBtn.active')?.classList.remove('active')
        qryUser.classList.remove(currentStatus)
        qryUser.classList.add(newStatusName!)
        qryUser.innerText = newStatusName!
        btn.classList.add('active')

        // notice user
        socket.emit('forceUserLogout', [user.username], username, adminRole, 'You was banned, Login again')
      })
      .catch(err => {
        withReactContent(Swal).fire(err)
      })
  }

  // join channel when click at side menu and navbar
  const joinChannel = async (targetChannel: string): Promise<void> => {
    await socket.emit('joinChannel', [currChannel, targetChannel, username!, uuid])
    setCurrChannel(targetChannel)
    sessionStorage.setItem('channel', targetChannel)
    setJoinNewChannel(true)
  }

  // when refresh page check authorize in case logged-in alraedy
  const verify = async (): Promise<void> => {
    if (!ref.current) {
      ref.current = true
      await axios.get(`${server}/user/auth/token`,
        {
          headers: {
            username: username,
            access: 'adsysop',
            pairdeviceid: localStorage.getItem('deviceId')
          },
          withCredentials: true
        }
      )
        .then(async res => {
          setIsAuthPass(res.data.valid)
          setUuid(res.data.deviceId.slice(0, 8))
          localStorage.setItem('deviceId', res.data.deviceId)
          // fetching data
          await fetchData()
        })
        .catch(err => {
          console.error(err.response.data.error ?? err)
          withReactContent(Swal).fire({
            title: err.response.data.error ?? err
          })
          reset()
          navigate('/adsysop')
        })
    }
  }

  const updateStatusTicket = async (e: MouseEvent | TouchEvent, status: string): Promise<void> => {
    const { idx, currStatus, ticket } = (e.currentTarget as HTMLElement).dataset
    if (currStatus === status || !ticket || !status) return

    await axios.post(`${server}/data/ticket/update`,
      {
        ticket: ticket,
        newStatus: status
      },
      {
        headers: {
          username: username,
          access: 'adsysop'
        },
        withCredentials: true
      }
    )
      .then(res => {
        if (res.data.error) {
          withReactContent(Swal).fire(res.data.error)
          return
        }
        const updateTicketsItems = [...ticketsItems]
        updateTicketsItems[parseInt(idx!)].status = status

        setTicketsItems(updateTicketsItems)
      })
      .catch(err => {
        withReactContent(Swal).fire(err.response.data.error)
      })
  }

  const handlerCloseDispute = async (e: React.MouseEvent | React.TouchEvent) => {
    const elem: HTMLButtonElement | undefined = (e.currentTarget as HTMLButtonElement)
    const idx: number = parseInt(elem.value)
    const disputeCode: string | undefined = elem.dataset.code
    const bannedUser: string | undefined = elem.dataset.user
    await axios.post(`${server}/data/dispute/close`,
      {
        user: bannedUser,
        code: disputeCode
      },
      {
        headers: {
          username: username,
          access: 'adsysop'
        },
        withCredentials: true
      }
    )
      .then(async (res: AxiosResponse) => {
        // update issue item
        await setIssueReports(prev => {
          prev.splice(idx, 1)
          return prev
        })
      })
      .then(() => {
        fetchData()
      })
      .catch((err: any) => {
        withReactContent(Swal).fire(err)
      })
  }


  const deleteTicket = async (e: MouseEvent | TouchEvent): Promise<void> => {
    const { ticket, currStatus } = (e.currentTarget as HTMLButtonElement).dataset
    if (!ticket) return

    await axios.delete(`${server}/data/ticket/close`,
      {
        headers: {
          username: username,
          ticket: ticket,
          access: 'adsysop'
        },
        withCredentials: true
      }
    )
      .then(res => {
        if (res.data.error) {
          withReactContent(Swal).fire(res.data.error)
          return
        }
        document.querySelector(`.ticketItem[data-ticket="${ticket}"]`)?.remove()
        setTicketsItems(tk => tk.filter(t => t.code !== ticket))
      })
      .catch(err => {
        withReactContent(Swal).fire(err.response.data.error)
      })
  }

  // Define your modals with explicit typing
  const modals: Record<string, ModalConfig> = {
    ticketManage: {
      isOpen: isTicketManageOpen,
      Component: TicketManage,
      props: {
        ticketsItems,
        updateReports: updateStatusTicket,
        deleteTicket,

        className: 'ticketsDashboard manageModal',
        title: 'Tickets',
        subtitle: `Total tickets: ${ticketsItems.length}`,
      },
      setState: setIsTicketManageOpen,
    },
    issueManage: {
      isOpen: isIssueManageOpen,
      Component: DisputeIssue,
      props: {
        issueData: issueReports,
        handlerCloseDispute,
        yourName: username,
        server,

        isMobileSupported: isMobileSupported,
        className: 'issueModalLists manageModal',
        title: 'Report Issue lists',
        subtitle: `Total issue open ${issueReports.length}`,
      },
      setState: setIsIssueManageOpen,
    },
    sessionManage: {
      isOpen: isSessionManageOpen,
      Component: SessionManage,
      props: {
        sessionsList: sessionsList,
        className: 'sessionModalLists manageModal',
        title: 'Session lists',
        subtitle: `Total sesions ${sessionsList.length}`,
        setSessionsList,
        setIsDeleteSession
      },
      setState: setIsSessionManageOpen
    }
  }

  const handleToggleManageModal = (e: React.MouseEvent | React.TouchEvent, refState?: Dispatch<SetStateAction<boolean>>): void => {
    refState!(prev => !prev)
  }

  const updateUsersLive = (targetUsername: string, uuid: string, leaveChannel: string, targetChannel: string, isLogOut: boolean): void => {
    // find user element
    try {
      const selectElement: HTMLElement | null = document.querySelector(`td[data-username="${targetUsername}"] select`) as HTMLElement | null
      let targetElement: HTMLOptionElement | null = null
      if (!selectElement) {
        console.error(`User ${targetUsername}'s element not found`)
      }

      if (selectElement) {
        if (isLogOut) {
          if (!leaveChannel) {
            console.error(`Error value of leave channel is not found: ${leaveChannel}`)
          }
          targetElement = selectElement.querySelector(`option[data-uuid="${uuid}"]`) as HTMLOptionElement
          targetElement.setAttribute('data-room-join', 'null')
          targetElement.setAttribute('data-uuid', 'null')
          targetElement.innerText = 'Offline'
        } else {
          if (!targetChannel) {
            console.error(`Error user ${targetUsername} didn't have value of target channel: ${targetChannel}`)
          } else {
            // bind channel to element when user join
            // if you change the channel use same element
            targetElement = selectElement.querySelector(`option[data-uuid="${uuid}"]`) as HTMLOptionElement

            // if another devices or first login find a empty slot
            if (!targetElement) {
              targetElement = selectElement.querySelector(`option[data-uuid="null"]`) as HTMLOptionElement
              // but if still not have a slot, it error
              if (!targetElement) {
                console.error(`Error slots for ${targetUsername} is full or not found: ${targetElement}`)
              }
            }

            targetElement.setAttribute('data-room-join', targetChannel)
            targetElement.setAttribute('data-uuid', uuid)
            targetElement.innerText = uuid + '-' + targetChannel
          }
        }
      }
    } catch (err) {
      console.error(`Error to set where users live: ${err}`)
    }
  }

  useEffect(() => {
    // prevent back to dashboard after logout or try to bypass login
    window.history.pushState(null, '', username)

    // even if params can set by user himself but if did not make login it will be verified failure
    if (username) {
      // if passes page loading still true and it will chage state in verify funtion
      verify()
    } else {
      // set false(remove loading page) then render login component
      setIsLoading(false)
    }
  }, [username])

  useEffect(() => {
    const initConnect = async () => {
      socket.auth = { username: username, role: adminRole, uuid: uuid }
      socket.connect()

      // Set loading state off and authorized only after completing all tasks
      setIsLoading(false)

      // after user verified will come here to registering
      // and checking who is online now
      socket.emit('registering', username)

      await joinChannel('lobby')
      socket.emit('getNoti', username)

      socket.off('getId')

      // to get their socket id
      socket.on('getId', async (id: string) => {
        // to set in session storage
        sessionStorage.setItem('skid', id)
      })
    }

    if (isAuthPass && isReady) {
      initConnect()
    }
  }, [isAuthPass, isReady])

  useEffect(() => {
    const getNotification = ([newMessage, isDm, channel]: [BubbleTypes['bubble'][], boolean, string]) => {
      const newMsg: BubbleTypes['bubble'][] = newMessage
      newMsg.map((msg: BubbleTypes['bubble']) => {
        const sender: string = msg.username

        // show notification
        if (sender !== username && !isOpenDM && isDm && !document.querySelector(`.modal[data-receiver=${sender}`)) {
          setListsDM((prev: string[]) => {
            if (prev.includes(sender)) return prev
            return [...prev, sender]
          })
          setNoti((prev: string[]) => {
            const update = !prev.includes(sender) ? [...prev, sender] : prev
            return update
          })

          socket.emit('saveNotiToCache', sender, username)
        }
      })

    }

    const getCacheNoti = (noti: { [key: string]: number }) => {
      const names: string[] = Object.keys(noti)
      names.forEach((notiName: string) => {
        setListsDM((prev: string[]) => !prev.includes(notiName) ? [...prev, notiName] : prev)
        setNoti((prev: string[]) => !prev.includes(notiName) ? [...prev, notiName] : prev)
      })
      // get noti from cache
      // it just array of name who send message to you
      // render lists at listDM component with noti
    }

    // when someone messaging to you and you didn't join same room
    // sender will invite you to join that room
    // and you will automatic to join for recieve message
    // if that user send message you can receive a notification at getNotificaiton()
    // index 2 tell socket that you is receiver
    const receiveInviteDm = (inviter: string): void => {
      socket.emit('joinDm', [inviter, username, false])
    }

    const getUsersOnline = (usersConnect: string[]): void => {
      setUsersOnline(usersConnect)
    }

    socket.on('getCacheNoti', getCacheNoti)
    socket.on('inviteDm', receiveInviteDm)
    socket.on('broadcast', getNotification)
    socket.on('usersOnline', getUsersOnline)

    return () => {
      socket.off('getCacheNoti', getCacheNoti)
      socket.off('inviteDm', receiveInviteDm)
      socket.off('broadcast', getNotification)
      socket.off('usersOnline', getUsersOnline)
    }
  }, [])

  useEffect(() => {
    const whereUsersLive = ({ targetUsername, uuid, leaveChannel, targetChannel, currJoinChannel, isLogOut }: UsersWhereAreYouTypes): void => {
      updateUsersLive(targetUsername, uuid, leaveChannel, targetChannel, isLogOut)
      // if admin join after users join it will not show currently where users join
      // have to wait for users refresh page or join other channel and send emission back
      // so use currJoinChannel that contains all users where they joining instead
      // at for the first load only after that is transport data with users via socket
      if (targetUsername === username) {
        const updatedSessions: { [key: string]: string[][] } = {}

        usersListsPerPage.forEach((item: DashboardUsers) => {
          const uname: string = item.username
          const userChannels = currJoinChannel[uname]
          if (!userChannels) return

          updatedSessions[uname] = []
          Object.entries(userChannels).map(item => {
            updatedSessions[uname].push([item[0], item[1]])
          })
        })

        setUserSessions(updatedSessions)
      }
    }
    socket.on('whereUsersLive', whereUsersLive)
    return () => {
      socket.off('whereUsersLive', whereUsersLive)
    }
  }, [usersOnline, usersListsPerPage])

  useEffect(() => {
    // isDeleteSession[0] is flag
    if (isDeleteSession[0]) {
      // isDeleteSession[1] is array of user's name list who selected to force logout
      socket.emit('forceUserLogout', isDeleteSession[1], username, adminRole, 'Please login again')
      setIsDeleteSession([false, []])
    }
  }, [sessionsList, isDeleteSession])

  useEffect(() => {
    const setCurrDmRoomId = (_dmRoomId: string, receiver: string): void => {
      if (document.querySelector(`.modal[data-receiver=${receiver}]`)) {
        setDmRoomId(_dmRoomId)
        setClearListDmRoom(_dmRoomId)
      }
      else {
        setClearListDmRoom(_dmRoomId)
      }
    }

    socket.on('dmRoomId', setCurrDmRoomId)
    return () => {
      socket.off('dmRoomId', setCurrDmRoomId)
    }
  }, [isOpenDM])

  useEffect(() => {
    document.body.style.transition = 'background-color ease .3s'
    if (themeSwitch === '') {
      document.body.style.background = '#333'
      document.getElementById('helloWorld')!.style.color = '#ccc'
    } else if (themeSwitch === 'light') {
      if (document.getElementById('helloWorld')) {
        document.getElementById('helloWorld')!.style.color = '#333'
      }
      document.body.style.background = '#ddd'
    }
  }, [themeSwitch])

  useEffect(() => {
    searchingUser(inpSearchUser)
  }, [inpSearchUser])

  return (
    <>
      {
        isLoading || !isAuthPass ?
          <div className='w-100 h-vh-100 d-flex justify-content-center align-items-center'>
            <div style={{ 'color': 'white', 'fontSize': '2em', 'display': 'flex', 'justifyContent': 'center', 'alignItems': 'center' }}>Loading&nbsp;{<Loader />}</div>
          </div>
          :
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <nav className='d-flex justify-content-between align-items-center w-100 py-10'>
                  <h3 id='helloWorld' style={{ color: '#333' }}>Welcome <b>{username}</b></h3>
                  <Switch name='themeDarkLight' id='themeDarkLight' className='themeDarkLight' offValue='light' onValue='dark' setThemeSwitch={setThemeSwitch} />
                  <Button type='button' name='logoutDashboard' id='logoutDashboard' className='logoutDashboard' innerText='fa fa-power-off' useIconFA={true} onClick={logoutDashboard} />
                </nav>
                <main id='mainDashboard'>

                  {Object.entries(modals).map(([key, modal]) => {
                    const { isOpen, Component, props } = modal
                    return isOpen ? (
                      <Component
                        {...props}
                        onClick={(e: any) => handleToggleManageModal(e, modal.setState)}
                        key={key}
                      />
                    ) : null
                  })}

                  <div className='row'>
                    <div className='col-12 col-sm-6 col-lg-3 my-10'>
                      <BoardBox title='Total channels' value={allChannelsList.length} iconFa='fa fa-globe' className='noc' />
                    </div>
                    <div className='col-12 col-sm-6 col-lg-3 my-10'>
                      <BoardBox title='Total users' value={allUsers.length} iconFa='fa fa-users' className='nou' />
                    </div>
                    <div className='col-12 col-sm-6 col-lg-3 my-10'>
                      <BoardBox title='Users online' value={usersOnline.length} iconFa='fa fa-feed' className='uso' />
                    </div>
                    <div className='col-12 col-sm-6 col-lg-3 my-10'>
                      <BoardBox title='Tickets' isAbleOpen={true} value={ticketsItems.length} iconFa='fa fa-flag' className='rpt'
                        refSetState={setIsTicketManageOpen}
                        onClick={handleToggleManageModal}
                      />
                    </div>
                    <div className='col-12 col-sm-6 col-lg-3 my-10'>
                      <BoardBox title='Dispute issues' isAbleOpen={true} value={issueReports.length} iconFa='fa fa-legal' className='dpi'
                        refSetState={setIsIssueManageOpen}
                        onClick={handleToggleManageModal}
                      />
                    </div>
                    <div className='col-12 col-sm-6 col-lg-3 my-10'>
                      <BoardBox title='Users session' isAbleOpen={true} value={sessionsList.length} iconFa='fa fa-chain' className='ssn'
                        refSetState={setIsSessionManageOpen}
                        onClick={handleToggleManageModal}
                      />
                    </div>
                    <div className='w-100'></div>
                    <div className='col-12 col-md-6 my-10'>
                      <Pagination
                        allDatas={allUsers}
                        currPage={currPage}
                        setCurrPage={setCurrPage}
                        itemsPerPage={usersPerPage}
                        handlerListsItemPerPage={handlerListsItemPerPage}
                        setListsItemPerPage={setUsersListsPerPage}
                      />
                      <div className='tableWrapper'>
                        <table id='tbOp'>
                          <thead>
                            <tr>
                              <th scope='col'>
                                Name
                                <Button
                                  type='button'
                                  name='username'
                                  className='ascdesBtn'
                                  innerText='fa fa-sort'
                                  useIconFA={true}
                                  onClick={(e: MouseEvent | TouchEvent) => sortTable(e, 0, sortedAsc, setSortedAsc)}
                                />
                              </th>
                              <th scope='col'>
                                Channel
                              </th>
                              <th scope='col'>Last active</th>
                              <th scope='col'>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td colSpan={5}>
                                <div className='d-flex justify-content-between align-items-center'>
                                  <div className='listsPerPage' id='listsPerPage'>
                                    <select value={usersPerPage} style={{ 'padding': '5px' }} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUsersPerPage(Number(e.target.value))}>
                                      <option value="5">5</option>
                                      <option value="10">10</option>
                                      <option value="15">15</option>
                                      <option value="20">20</option>
                                    </select>
                                    <span>per page</span>
                                  </div>
                                  <Input
                                    type='text'
                                    name='searchUser'
                                    id='searchUser'
                                    className='inpValueSearch'
                                    value={inpSearchUser}
                                    placeHolder='Search user'
                                    onChange={e => getInputValue(e, setInpSearchUser)}
                                  />
                                </div>
                              </td>
                            </tr>
                            {
                              inpSearchUser.length > 0 ?
                                resultSearchUser && resultSearchUser.length > 0 ?
                                  renderTableRow(resultSearchUser)
                                  :
                                  <tr>
                                    <td colSpan={5}>Not found</td>
                                  </tr>
                                :
                                usersListsPerPage && usersListsPerPage.length > 0 ?
                                  renderTableRow(usersListsPerPage)
                                  :
                                  <tr>
                                    <td colSpan={5}>No one else</td>
                                  </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        allDatas={allUsers}
                        currPage={currPage}
                        setCurrPage={setCurrPage}
                        itemsPerPage={usersPerPage}
                        handlerListsItemPerPage={handlerListsItemPerPage}
                        setListsItemPerPage={setUsersListsPerPage}
                      />
                    </div>
                    <div className='col-12 col-md-6 my-10'>
                      <div>
                        <select name='channelSelect' id='channelSelect' className='channelSelect' style={{ 'width': '100%' }} value={currChannel!} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => joinChannel(e.target.value)} >
                          {
                            allChannelsList && allChannelsList.length > 0 ?
                              allChannelsList.map((name: string, i: number) => {
                                return (
                                  <option value={name} className='optionRoom' key={i}>#{name}</option>
                                )
                              })
                              :
                              <></>
                          }
                        </select>
                        <div className='tabsWrapper'>
                          {
                            listsDM && listsDM.length > 0 ?
                              listsDM.map((name: string, i: number) => {
                                return (
                                  <TabDm
                                    noti={noti}
                                    key={i}
                                    receiver={name}
                                    openDm={openDm}
                                    clearPM={clearPM}
                                    isOpenDM={isOpenDM}
                                    clearListDmRoom={clearListDmRoom}
                                  >
                                    {name}
                                  </TabDm>
                                )
                              })
                              :
                              <></>
                          }
                        </div>
                      </div>
                      <Chat
                        server={server}
                        yourName={username}
                        socket={socket}
                        id='displayChat'
                        joinNewChannel={joinNewChannel}
                        setJoinNewChannel={setJoinNewChannel}
                        currChannel={currChannel}
                        autoFocus={false}
                        isDm={false}
                        role={adminRole}
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
                              yourName={username}
                              socket={socket}
                              id='dmDisplay'
                              currChannel={dmRoomId}
                              joinNewChannel={joinNewChannel}
                              setJoinNewChannel={setJoinNewChannel}
                              autoFocus={true}
                              isDm={true}
                              role={adminRole}
                            />
                          </Modal>
                          :
                          <></>
                      }
                    </div>
                  </div>
                </main>
              </div>
            </div >
          </div >
      }
    </>
  )
}

export default Dashboard