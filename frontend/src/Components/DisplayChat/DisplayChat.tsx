import BubbleChat from '../BubbleChat/BubbleChat'
import { BubbleTypes, TicketBubbleTypes } from '../../types'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import Modal from '../Modal/Modal'
import Form from '../Form/Form'
import TextArea from '../TextArea/TextArea'
import Button from '../Button/Button'
import topLayer from '../../utils/topLayer'
import './dist/DisplayChat.css'

interface Props {
  bubbles: BubbleTypes['bubble'][]
  setIsContextOpen: Dispatch<SetStateAction<boolean>>
  isContextOpen: boolean
  setCurrIdContext: Dispatch<SetStateAction<string>>
  currIdContext: string
  setReplyBubble: Dispatch<SetStateAction<{ username: string; idBubble: string; message: string; } | undefined>>
  copyMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string) => void
  replyMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string) => void
  reportMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string, ...replies: string[]) => void
  contextClick: boolean
  setContextClick: Dispatch<SetStateAction<boolean>>
  replyBubble: { username: string; idBubble: string; message: string } | undefined
  scrollToReplyRef: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  isReportModalOpen: boolean
  handleInputReportDetail: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  inpReportMessage: string
  reportBubbleData: TicketBubbleTypes | {}
  confirmedReport: (e: any) => void
  closeReportModal: (e: any) => void
  id: string
  isDm: boolean
  bubblesDm: BubbleTypes['bubble'][]
  yourName: string | undefined
  newJoinedOrLeaved: [string | null, boolean | null]
  closeContext: boolean
  setCloseContext: Dispatch<SetStateAction<boolean>>
}

const DisplayChat = ({ newJoinedOrLeaved, yourName, bubbles, setIsContextOpen, isContextOpen, setCurrIdContext, currIdContext, copyMessage, replyMessage, reportMessage, contextClick, setContextClick, replyBubble, scrollToReplyRef, isReportModalOpen, handleInputReportDetail, inpReportMessage, reportBubbleData, confirmedReport, closeReportModal, id, isDm, bubblesDm, closeContext, setCloseContext }: Props): JSX.Element => {

  const [useReply, setUseReply] = useState<HTMLElement>()
  const [bubblesData, setBubbleData] = useState<BubbleTypes['bubble'][]>([])

  const isContextOpenRef = useRef(isContextOpen)

  const isMobileSupported: boolean = /android|iphone|kindle|ipad/i.test(navigator.userAgent)

  /**
   * useState BubbleData: This state manages message chat data for both global room and private room messages.
   * In the Chat component (parent of this component), messages are filtered by isDm (sent to the socket with new messages).
   * The receiver will filter whether it is a private message or a global message.
   */

  /** 
   * In this child component (DisplayChat component), the flag isDm is used to select the DOM:
   * - #displayChat for global room
   * - #dmDisplayChat for private room
   * This is used to render new messages.
   */
  useEffect(() => {
    const data = isDm ? bubblesDm : bubbles
    setBubbleData(data)
    return () => {
      setBubbleData([])
    }
  }, [isDm, bubblesDm, bubbles])

  // scroll to bottom when new message has come
  useEffect(() => {
    const display = isDm
      ? document.querySelector('#dmDisplay .outerBubblesWrapper')
      : document.querySelector('#displayChat .outerBubblesWrapper')

    if (bubblesData && bubblesData.length > 0 && display) {
      display!.scrollTop = display!.scrollHeight
    }

  }, [bubblesData])

  useEffect(() => {
    setUseReply(document.querySelector('#replyForm[data-reply-to]') as HTMLElement)
  }, [useReply])

  useEffect(() => {
    isContextOpenRef.current = isContextOpen
  }, [isContextOpen])

  // for clear context menu
  useEffect(() => {
    const clearUpContextMenu = () => {
      (document.querySelectorAll('.outerBubblesWrapper') as NodeListOf<HTMLElement>).forEach((elem: HTMLElement) => {
        const handleClick = (e: Event) => {
          e.preventDefault()

          if (isContextOpenRef.current && (e.target as HTMLElement).classList.contains('outerBubblesWrapper')) {
            setCloseContext(true)
            setIsContextOpen(false)
          }
        }
        elem.addEventListener('click', handleClick, true)

        // Cleanup function to remove the event listener
        return () => {
          elem.removeEventListener('click', handleClick, true)
        }
      })
    }
    clearUpContextMenu()
  }, [])

  return (
    <div data-id={id} id={id} className={`displayChat ${replyBubble ? 'useReply' : ''}`}>
      {
        isReportModalOpen ?
          <Modal title='Report form' className='reportModal' subtitle='inappropriate, violent, harassment or etc' isReportModalOpen={isReportModalOpen} handlerCloseModal={closeReportModal} id={id} isMobileSupported={isMobileSupported} attr={[{ 'data-draggable': 'true' }]} topLayer={topLayer}>
            <Form action='#' method='POST' className='reportForm' id={`reportForm-${id}`} head='' headClass='' subHead='' subHeadClass='' target='_self' autoComplete='off'>
              <TextArea
                className='reportTextArea'
                id={`reportTextArea-${id}`}
                onChange={handleInputReportDetail}
                value={inpReportMessage}
                placeHolder={`Max 100 characters\nDefendant: ${(reportBubbleData as TicketBubbleTypes).username}\nQuote: ${(reportBubbleData as TicketBubbleTypes).message}`}
                resizer='none'
                autoFocus={true}
              />
              <div className='d-flex justify-content-around align-items-center w-100'>
                <Button type='submit' name='reportSubmitBtn' className='reportSubmitBtn' id='reportSubmitBtn' innerText='Send' onClick={confirmedReport} />
                <Button type='button' name='reportCancelBtn' className='reportCancelBtn' id='reportCancelBtn' innerText='cancel' onClick={closeReportModal} />
              </div>
            </Form>
          </Modal>
          :
          <></>
      }
      <div
        className='outerBubblesWrapper'
      >
        {
          !isDm ?
            <div id='broadcastWhoJoinedAndLeaved' data-announcement={newJoinedOrLeaved[0]}>{newJoinedOrLeaved[0]} {newJoinedOrLeaved[1] ? 'Joined' : 'Leaved'}</div>
            :
            <></>
        }
        {bubblesData && bubblesData.length > 0 ?
          bubblesData.map((bubble: BubbleTypes['bubble'], i: number) => {
            const isSameSender: boolean = i > 0 && bubblesData[i - 1].username === bubblesData[i].username
            return (
              <BubbleChat
                key={i}
                yourName={yourName}
                bubble={bubble}
                setIsContextOpen={setIsContextOpen}
                isContextOpen={isContextOpen}
                setCurrIdContext={setCurrIdContext}
                currIdContext={currIdContext}
                contextClick={contextClick}
                copyMessage={copyMessage}
                replyMessage={replyMessage}
                reportMessage={reportMessage}
                setContextClick={setContextClick}
                scrollToReplyRef={scrollToReplyRef}
                isSameSender={isSameSender}
                closeContext={closeContext}
                setCloseContext={setCloseContext}
              />
            )
          })
          :
          <></>
        }
      </div>
    </div>
  )
}

export default DisplayChat