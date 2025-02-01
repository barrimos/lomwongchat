import { BubbleTypes } from '../../types'
import ContextMenu from './ContextMenu'
import React, { useEffect, useRef, useState } from 'react'

const BubbleChat = ({ yourName, bubble, setIsContextOpen, isContextOpen, setCurrIdContext, currIdContext, contextClick, copyMessage, replyMessage, reportMessage, setContextClick, scrollToReplyRef, isSameSender, closeContext, setCloseContext }: BubbleTypes): JSX.Element => {
  const owner = bubble.username === yourName ? 'you' : 'other'
  const [longPressOpenContext, setLongPressOpenContext] = useState<NodeJS.Timeout | null>(null)
  const [axisTop, setAxisTop] = useState<boolean>(false)

  const useInitializeElements = () => {
    const isScrollingRef = useRef<boolean | null>(null)

    useEffect(() => {
      isScrollingRef.current = false
    }, [])

    return {
      isScrolling: isScrollingRef
    }
  }
  const { isScrolling } = useInitializeElements()

  const handlerOpenContextMenu = async (e: any): Promise<void> => {
    const target = e.currentTarget as HTMLDivElement

    if (isContextOpen && !target.classList.contains('contextMenu')) {
      removeContextMenu()
    }

    const longPressTimeout = setTimeout(async () => {
      if (setIsContextOpen) {
        await setIsContextOpen(true)
      }
      if (setCurrIdContext && !isScrolling.current) {
        setCurrIdContext(target.parentElement?.dataset.idBubble!)
        if (target.clientHeight < 60) {
          setAxisTop(true)
        }
      }

      setLongPressOpenContext(null) // Clear the state
    }, 500)
    setLongPressOpenContext(longPressTimeout) // Store the timeout ID in state
  }

  const handlerCancelContextMenu = (e: any): void => {
    if (e.cancelable) {
      e.preventDefault()
    }
    if (longPressOpenContext) {
      clearTimeout(longPressOpenContext)
    }
    if (e.target.classList.contains('bubbleWrapper')) {
      removeContextMenu()
    }
  }

  const removeContextMenu = async (): Promise<void> => {
    if (setIsContextOpen) {
      setIsContextOpen(false)
    }
    if (setCurrIdContext) {
      setCurrIdContext('')
    }
    setAxisTop(false)
    isScrolling.current = false
  }

  const handlerCancleWebContextMenu = (event: any) => {
    // Prevent the browser's context menu from opening
    event.preventDefault()
  }

  const setNewStyle = async () => {
    if (currIdContext) {
      const contextMenu: HTMLElement = (document.querySelector('#contextMenuWrapper') as HTMLElement)
      if (contextMenu) {
        if (contextMenu.nextElementSibling!.getBoundingClientRect().top > 70) {
          contextMenu.classList.add('absolute')
        } else {
          if (contextMenu.nextElementSibling?.clientHeight! < 50) {
            contextMenu.classList.add('absolute')
            contextMenu.classList.add('up')
            contextMenu.style.top = '50px'
          } else {
            contextMenu.classList.remove('absolute')
          }
        }
      }
    }
  }

  useEffect(() => {
    const scrolling = () => {
      isScrolling.current = true
    }
    const scrollEnd = () => {
      isScrolling.current = false
    }

    document.querySelector('.outerBubblesWrapper')?.addEventListener('scroll', scrolling)
    document.querySelector('.outerBubblesWrapper')?.addEventListener('scrollend', scrollEnd)
    return () => {
      document.querySelector('.outerBubblesWrapper')?.removeEventListener('scroll', scrolling)
      document.querySelector('.outerBubblesWrapper')?.removeEventListener('scrollend', scrollEnd)
    }
  }, [])
  
  useEffect(() => {
    if (currIdContext) {
      const elem: HTMLElement = (document.querySelector('#contextMenuWrapper') as HTMLElement)
      if (elem.parentElement?.classList.contains('you')) {
        elem.classList.add('you')
      } else {
        elem.classList.add('other')
      }
      elem.classList.add('active')
    }

    if (axisTop) {
      setNewStyle()
    }
  }, [currIdContext])

  useEffect(() => {
    if (contextClick) {
      removeContextMenu()
      setContextClick(false)
    }
  }, [contextClick])

  useEffect(() => {
    if (closeContext) {
      removeContextMenu()
      setCloseContext(false)
    }
  }, [closeContext])

  return (
    <div
      className={`bubbleWrapper ${owner}`}
      data-time={bubble.unixTime}
      onContextMenu={handlerCancleWebContextMenu}
      onMouseUp={handlerCancelContextMenu}
      data-id-bubble={bubble.bid}
    >
      {
        isContextOpen && bubble.bid === currIdContext ?
          <ContextMenu
            message={bubble.message}
            unixTime={bubble.unixTime}
            idBubble={bubble.bid}
            username={bubble.username}
            setContextClick={setContextClick}
            copyMessage={copyMessage}
            replyMessage={replyMessage}
            reportMessage={reportMessage}
            replyIdBubble={bubble.reply?.idBubble}
            replyTo={bubble.reply?.username}
          />
          :
          <></>
      }
      <pre
        className={`messageWrapper ${owner} ${isSameSender ? 'remUsername' : ''}`}
        data-id-bubble={bubble.bid}
        data-time={bubble.unixTime}
      >
        {
          isSameSender ?
            <></>
            :
            <div className={`owner ${owner}`}>
              {bubble.username}
            </div>
        }
        <div
          className={`message ${owner}`}
          // onClick={handleCancelContextMenu}
          onMouseDown={handlerOpenContextMenu}
          onMouseUp={handlerCancelContextMenu}

          onTouchStart={handlerOpenContextMenu}
          onTouchEnd={handlerCancelContextMenu}
        >
          {
            bubble.reply ?
              <div
                className='replyBubble'
                data-reply-id-bubble={bubble.reply.idBubble}
                data-reply-to={bubble.reply.username}
                onClick={scrollToReplyRef}
                onTouchStart={scrollToReplyRef}
              >
                Reply to {bubble.reply.username}<br />
                {bubble.reply.message}
              </div>
              :
              <></>
          }
          {bubble.message}
        </div>
        <div className={`timestamp ${owner}`} data-time={bubble.unixTime}>
          {bubble.timestamp}
        </div>
      </pre>
    </div>
  )
}

export default BubbleChat