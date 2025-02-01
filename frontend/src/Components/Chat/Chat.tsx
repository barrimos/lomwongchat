import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import Button from '../Button/Button'
import { getInputValue } from '../../utils/getInputValue'
import DisplayChat from '../DisplayChat/DisplayChat'
import TextArea from '../TextArea/TextArea'
import { ToBottomIcon } from '../Icons/ExitRoomIcon'
import { BubbleTypes, TicketBubbleTypes } from '../../types'

import ReplyForm from '../BubbleChat/ReplyForm'
import { Socket } from 'socket.io-client'

import './dist/Chat.css'
import { randomCharacter } from '../../utils/randomCharacter'
import axios from 'axios'
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'
import ProcessingQueue from '../../utils/processQueue'

interface Props {
  server: string
  yourName: string | undefined
  socket: Socket
  id: string
  joinNewChannel?: boolean
  setJoinNewChannel?: Dispatch<SetStateAction<boolean>>
  currChannel: string | null
  isToggleMenuOpen?: boolean
  toggleMenu?: () => void
  autoFocus?: boolean
  isDm: boolean
  role: string
}

const Chat = ({ yourName, socket, id, joinNewChannel, setJoinNewChannel, currChannel, isToggleMenuOpen, toggleMenu, autoFocus, isDm, server, role }: Props) => {
  const processingQueue = new ProcessingQueue()
  const [inpMessage, setInpMessage] = useState<string>('')
  const [bubblesData, setBubblesData] = useState<BubbleTypes['bubble'][]>([])
  const [bubblesDataDm, setBubblesDataDm] = useState<{ log: { [key: string]: BubbleTypes['bubble'][] } } | { log: {} }>({ log: {} })

  const [isContextOpen, setIsContextOpen] = useState<boolean>(false)
  const [closeContext, setCloseContext] = useState<boolean>(false)
  const [currIdContext, setCurrIdContext] = useState<string>('')
  const [contextClick, setContextClick] = useState<boolean>(false)
  const [replyBubble, setReplyBubble] = useState<{ username: string, idBubble: string, message: string } | undefined>(undefined)

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false)
  const [reportBubbleData, setReportBubbleData] = useState<TicketBubbleTypes | {}>({})
  const [inpReportMessage, setInpReportMessage] = useState<string>('')

  const [newJoinedOrLeaved, setNewJoinedOrLeaved] = useState<[string | null, boolean | null]>([null, null])

  // custom react hook
  const useInitializeElements = (id: string) => {
    const displayChatRef = useRef<HTMLElement | null>(null)
    const chatWrapperRef = useRef<HTMLElement | null>(null)
    const inputWrapperRef = useRef<HTMLElement | null>(null)
    const toTopButtonRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
      // Initialize elements and store them in refs
      const displayChat = document.querySelector<HTMLElement>(`#${id}`)

      displayChatRef.current = displayChat
      chatWrapperRef.current = displayChat?.querySelector<HTMLElement>('.outerBubblesWrapper') || null
      inputWrapperRef.current = displayChat?.nextElementSibling as HTMLElement
      toTopButtonRef.current = inputWrapperRef.current?.querySelector<HTMLElement>('.toBottomBtn') || null
    }, [id]) // Re-run only when `id` changes

    return {
      displayChat: displayChatRef,
      chatWrapper: chatWrapperRef,
      inputWrapper: inputWrapperRef,
      toTopButton: toTopButtonRef,
    }
  }

  const { displayChat, chatWrapper, inputWrapper, toTopButton } = useInitializeElements(id)

  const isMobileSupported: boolean = /android|iphone|kindle|ipad/i.test(navigator.userAgent)

  const handleSubmitMessage = (e?: React.MouseEvent | React.TouchEvent): void => {

    if (/^\s*$/.test(inpMessage)) {
      setInpMessage('')
      return
    }

    const d = new Date()
    const bid: string = randomCharacter(4)

    const bubble = {
      rid: currChannel ?? currChannel,
      bid: bid,
      username: yourName ?? sessionStorage.getItem('username'),
      message: inpMessage,
      unixTime: d.getTime(),
      reply: replyBubble,
      deviceId: localStorage.getItem('deviceId')
    }

    socket.emit('message', [bubble, isDm], role)
    setInpMessage('')
    setReplyBubble(undefined)
    setCurrIdContext('')

    inputWrapper.current ? (inputWrapper.current?.childNodes[0] as HTMLElement).focus() : <></>
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && inpMessage && !isMobileSupported) {
      e.preventDefault()
      handleSubmitMessage(e as any)
    }
  }

  const copyMessage = (e: React.MouseEvent | React.TouchEvent, message: string): void => {
    if (message) {
      const temp_input = document.createElement('textarea')
      temp_input.style.zIndex = '-99999'

      const menu_context_opened = document.querySelector('#replyForm[data-reply-to]')
      // if menu context was opened at some bubble remove menu wrapper and then add menu context to new bubble called
      if (menu_context_opened !== null) {
        setReplyBubble(undefined)

        if (toTopButton.current && toTopButton.current!.classList.contains('active')) {
          if (displayChat.current!.scrollHeight > displayChat.current!.clientHeight * 2) {
            if (displayChat.current!.scrollTop * 2 < displayChat.current!.scrollHeight * .9) {
              toTopButton.current!.style.bottom = '60px'
            }
          }
        }
      }

      document.body.appendChild(temp_input)
      temp_input.innerHTML = message
      temp_input.select()
      temp_input.setSelectionRange(0, 99999)
      document.execCommand('copy')
      document.body.removeChild(temp_input)
    }
    setCloseContext(true)
  }

  const replyMessage = (e: React.MouseEvent | React.TouchEvent, message: string): void => {
    const targetElem = (e.target as HTMLElement).dataset
    const dataReply = {
      username: targetElem.username as string,
      idBubble: targetElem.idBubble as string,
      message: message.slice(0, 40) + '...' as string,
    }
    setReplyBubble(dataReply)

    if (toTopButton.current && toTopButton.current!.classList.contains('active')) {
      if (displayChat.current!.scrollHeight > displayChat.current!.clientHeight * 2) {
        if (displayChat.current!.scrollTop * 2 < displayChat.current!.scrollHeight * .9) {
          toTopButton.current!.style.bottom = '110px'
        } else {
          toTopButton.current!.style.bottom = '60px'
        }
      }
    }
    setCloseContext(true)
  }

  const reportMessage = async (e: React.MouseEvent | React.TouchEvent, message: string, ...replies: string[]): Promise<void> => {
    if (isReportModalOpen) return
    const targetElem = (e.target as HTMLElement)
    const dataReport: TicketBubbleTypes = {
      code: randomCharacter(5),
      status: 'queue',
      reporter: yourName,
      channel: currChannel!,
      username: targetElem.dataset.username as string,
      idBubble: targetElem.dataset.idBubble as string,
      message: message as string,
      replies: replies,
      details: null,
      timeMessage: targetElem.parentElement?.dataset.time as string
    }

    setCloseContext(true)
    if (setIsReportModalOpen) setIsReportModalOpen(true)
    if (setReportBubbleData) setReportBubbleData(dataReport)
  }

  const handleInputReportDetail = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const dataDetail: string = (e.target as HTMLTextAreaElement).value
    if (dataDetail.length > 100) return
    setInpReportMessage(dataDetail)
  }

  const confirmedReport = async (e: any): Promise<void> => {
    e.preventDefault()
    if (!inpReportMessage) {
      withReactContent(Swal).fire({
        title: 'Needs detail',
        timer: 2000,
        width: '240px'
      })
      return
    }
    await axios.post(`${server}/data/ticket/post`,
      { data: reportBubbleData, details: inpReportMessage },
      {
        headers: {
          username: yourName
        },
        withCredentials: true
      }
    )
      .then(res => {
        withReactContent(Swal).fire({
          title: res.data.message,
          text: `Ticket code is ${res.data.ticket}`
        })
      })
      .catch(err => {
        withReactContent(Swal).fire(err.response.data.error)
      })

    if (setReportBubbleData) setReportBubbleData({})
    closeReportModal()
  }

  const closeReportModal = (): void => {
    setInpReportMessage('')
    if (setIsReportModalOpen) setIsReportModalOpen(false)
  }

  const scrollToReplyRef = (e: React.MouseEvent | React.TouchEvent): void => {
    e.stopPropagation()
    const replyToId: string | undefined = (e.target as HTMLElement).dataset.replyIdBubble
    document.querySelector(`.bubbleWrapper[data-id-bubble="${replyToId}"]`)!.scrollIntoView(true)
  }

  const closereplyForm = (e: React.MouseEvent | React.TouchEvent): void => {
    setReplyBubble(undefined)

    if (toTopButton.current && toTopButton.current!.classList.contains('active')) {
      if (displayChat.current!.scrollHeight > displayChat.current!.clientHeight * 2) {
        if (displayChat.current!.scrollTop * 2 < displayChat.current!.scrollHeight * .9) {
          toTopButton.current!.style.bottom = '60px'
        }
      }
    }
  }

  useEffect(() => {
    if (toTopButton.current?.classList.contains('active')) {
      if (replyBubble !== undefined) {
        toTopButton.current!.style.bottom = '110px'
      } else {
        toTopButton.current!.style.bottom = '60px'
      }
    }

    const activeScrollToToptn = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      if (chatWrapper.current!.scrollHeight - chatWrapper.current!.scrollTop - chatWrapper.current!.clientHeight > 1200) {
        toTopButton.current!.classList.add('active')
        if (replyBubble !== undefined) {
          toTopButton.current!.style.bottom = '110px'
        } else {
          toTopButton.current!.style.bottom = '60px'
        }
      } else {
        toTopButton.current!.classList.remove('active')
        toTopButton.current!.style.bottom = '5px'
      }
    }

    const scrollToTop = () => {
      chatWrapper.current!.scrollTop = chatWrapper.current!.scrollHeight
    }

    toTopButton.current!.addEventListener('click', scrollToTop)
    chatWrapper.current?.addEventListener('scroll', activeScrollToToptn)

    return () => {
      toTopButton.current!.removeEventListener('click', scrollToTop)
      chatWrapper.current!.removeEventListener('scroll', activeScrollToToptn)
    }
  }, [replyBubble])

  useEffect(() => {
    if (joinNewChannel) {
      // use joinNewChannel to be dependency capture
      // when join new channel bubblesData it still old chat logs from
      // previous room, so needs to clear that
      setBubblesData([])
      setJoinNewChannel!(false)

      // in case if user change channel while to top bottom button active
      // button will stay active, should reset
      // const bottomButton: HTMLButtonElement | null = document.querySelector('.toBottomBtn.active')
      if (toTopButton.current) {
        toTopButton.current!.classList.remove('active')
        toTopButton.current!.style.bottom = '5px'
      }
    }
  }, [joinNewChannel])


  useEffect(() => {
    let pendingUpdate = false

    const trackViewport = () => {
      if (pendingUpdate) {
        return
      }

      pendingUpdate = true

      requestAnimationFrame(() => {
        pendingUpdate = false

        // web api for detect size of device
        const viewport: VisualViewport | null = window.visualViewport
        if (!viewport) return

        // window.innerHeight is screen height of device
        // viewport.height is viewport that remain after virtual keyboard open
        // other word it is exceed of viewport from device height that is height size of virtual keyboard
        const keyboardHeight: number | undefined = window.innerHeight - viewport!.height

        // threshold to ensure that the keyboard is larger than this value.
        const isKeyboardOpen: boolean = keyboardHeight > 100

        // initial height size of element in app
        // use for calculate to translate and resize display
        // navbar
        const initNavHeight: number = 40
        // main inputWrapper
        const mainInputWrapperHeight: number = 50
        // padding modal
        const paddingModal: number = 15

        if (id === 'dmDisplay') {
          displayChat.current = (displayChat.current?.closest('.modal.dmModal')! as HTMLElement)
        }

        const heightDisplayChat =
          id === 'dmDisplay'
            ? parseInt(displayChat.current!.style.height)
            : window.innerHeight

        const newDisplayHeight: number = heightDisplayChat - (keyboardHeight + initNavHeight + mainInputWrapperHeight)
        const baseDisplayHeight: number = heightDisplayChat - (initNavHeight + mainInputWrapperHeight)

        // adjust size display chat and position for input
        if (isKeyboardOpen) {
          displayChat.current!.style.height = `${newDisplayHeight}px`
        } else {
          displayChat.current!.style.height = `${baseDisplayHeight}px`
        }

        if (viewport.offsetTop >= 0) {
          if (id === 'dmDisplay') {
            displayChat.current!.style.transform = `translateY(${Math.min(0, viewport.offsetTop)}px)`
          } else {
            displayChat.current!.parentElement!.style.transform = `translateY(${Math.max(0, viewport.offsetTop)}px)`
          }
        }

        inputWrapper.current!.style.transform = 'translateY(0)'
        chatWrapper.current!.scrollTop = chatWrapper.current!.scrollHeight
      })
    }

    // Attach visualViewport event listener
    window.visualViewport?.addEventListener('resize', trackViewport)
    window.visualViewport?.addEventListener("scroll", trackViewport)

    return () => {
      // Cleanup event listener
      window.visualViewport?.removeEventListener('resize', trackViewport)
      window.visualViewport?.addEventListener("scroll", trackViewport)
    }
  }, [chatWrapper, displayChat, id, inputWrapper])



  // toggle navbar menu
  useEffect(() => {
    if (isToggleMenuOpen) {
      toggleMenu!()
    }
  }, [inpMessage])

  useEffect(() => {
    document.querySelectorAll('.displayChat .outerBubblesWrapper').forEach(display => {
      display.addEventListener('click', e => {
        if (isToggleMenuOpen && toggleMenu) {
          toggleMenu()
        }
      })
    })
  }, [isToggleMenuOpen, isContextOpen])


  useEffect(() => {
    const receiveMessage = ([newMessage, isDm, dmChannel]: [BubbleTypes['bubble'][], boolean, string]) => {
      const newMsg: BubbleTypes['bubble'][] = newMessage
      newMsg.map((msg: BubbleTypes['bubble']) => msg.timestamp = new Date(msg.unixTime).toTimeString().slice(0, 5))

      if (isDm) {
        setBubblesDataDm((prevMessages: { log: { [key: string]: BubbleTypes['bubble'][] } }) => {
          const existingMessages: BubbleTypes['bubble'][] = prevMessages.log[dmChannel] || []
          return {
            log: {
              ...prevMessages.log,
              [dmChannel]: [...existingMessages, ...newMsg],
            }
          }
        })
      } else {
        setBubblesData((prevMessages: any) => {
          // Check if the message is already present in the state
          if (!prevMessages.includes(...newMsg)) {
            // If not present, add the message to the state
            return [...prevMessages, ...newMsg]
          }
          // If present, return the previous state without adding the message
          return prevMessages
        })
      }
    }

    const whoJustJoinedAndLeaved = (whoName: string, isJoined: boolean) => {

      // Add tasks to the queue
      processingQueue.addQueue(async () => {
        setNewJoinedOrLeaved([whoName, isJoined])
      })

      processingQueue.addQueue(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        setNewJoinedOrLeaved([null, null])
      })
    }

    socket.on('whoJustJoinedAndLeave', whoJustJoinedAndLeaved)
    socket.on('broadcast', receiveMessage)

    return () => {
      socket.off('broadcast', receiveMessage)
      socket.off('whoJustJoinedAndLeave', whoJustJoinedAndLeaved)
    }
  }, [])

  return (
    <>
      <DisplayChat
        id={id}
        bubbles={bubblesData}
        isDm={isDm}
        bubblesDm={(bubblesDataDm.log as { [key: string]: BubbleTypes['bubble'][] })[currChannel!]}
        setIsContextOpen={setIsContextOpen}
        isContextOpen={isContextOpen}
        setCurrIdContext={setCurrIdContext}
        currIdContext={currIdContext}
        setReplyBubble={setReplyBubble}
        replyBubble={replyBubble}
        copyMessage={copyMessage}
        replyMessage={replyMessage}
        reportMessage={reportMessage}
        contextClick={contextClick}
        setContextClick={setContextClick}
        scrollToReplyRef={scrollToReplyRef}
        isReportModalOpen={isReportModalOpen}
        handleInputReportDetail={handleInputReportDetail}
        inpReportMessage={inpReportMessage}
        reportBubbleData={reportBubbleData}
        confirmedReport={confirmedReport}
        closeReportModal={closeReportModal}
        yourName={yourName}
        newJoinedOrLeaved={newJoinedOrLeaved}
        closeContext={closeContext}
        setCloseContext={setCloseContext}
      />
      {
        replyBubble ?
          <ReplyForm replyBubble={replyBubble} closereplyForm={closereplyForm} />
          :
          <></>
      }
      <div className='inpMessageWrapper'>
        <TextArea
          className='inpMessage'
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => getInputValue(e, setInpMessage)}
          value={inpMessage}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)}
          placeHolder={`Send message ${isMobileSupported ? '' : 'shift + enter : new line'}`}
          resizer={null}
          autoFocus={autoFocus!}
        />
        <Button type='button' name='submitMessageBtn' className='submitMessageBtn' innerText='fa fa-fire' useIconFA={true} onClick={handleSubmitMessage} />
        <Button type='button' name='toBottomBtn' className='toBottomBtn' useIconFA={false} innerText=''>
          <ToBottomIcon />
        </Button>
      </div>
    </>
  )
}

export default Chat