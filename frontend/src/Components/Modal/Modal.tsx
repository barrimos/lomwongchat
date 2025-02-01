import React, { Dispatch, ReactNode, SetStateAction, useEffect } from 'react'
import './dist/Modal.css'
import Button from '../Button/Button'

interface Props {
  id?: string
  title?: string
  subtitle?: string
  className?: string
  children?: ReactNode
  isReportModalOpen?: boolean
  attr?: { [key: string]: string | undefined }[]
  handlerCloseModal?: (e: React.MouseEvent | React.TouchEvent, refSetState?: Dispatch<SetStateAction<boolean>>) => void
  isMobileSupported?: boolean
  handleClearModal?: (e: React.MouseEvent | React.TouchEvent) => void
  topLayer?: (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => void
  clearBtnDmRoom?: string
  draggable?: boolean
}

const Modal = ({ clearBtnDmRoom, id, title, subtitle, className = '', children, attr, draggable = false, handlerCloseModal, isMobileSupported, handleClearModal, topLayer, isReportModalOpen }: Props) => {
  const startEvent: string = isMobileSupported ? 'touchstart' : 'mousedown'
  const moveEvent: string = isMobileSupported ? 'touchmove' : 'mousemove'
  const endEvent: string = isMobileSupported ? 'touchend' : 'mouseup'

  const dragElement = (modal: HTMLElement): void => {
    let pos1: number = 0, pos2: number = 0, pos3: number = 0, pos4: number = 0
    modal.querySelector('.modalHeadTitle')!.addEventListener(startEvent, dragDown, { passive: false })

    function dragDown(e: any) {
      e.preventDefault()

      if (document.querySelector('.modal.active.topLayer')) {
        document.querySelector('.modal.active.topLayer')?.classList.remove('topLayer')
        document.querySelector('.modal.active')?.classList.remove('active')
      }
      (e.target as HTMLElement).closest('.modal')?.classList.add('active');
      (e.target as HTMLElement).closest('.modal.active')?.classList.add('topLayer');

      const modalRect = modal.getBoundingClientRect()

      // get the mouse cursor position at startup:
      pos3 = (isMobileSupported ? e.touches[0].clientX : e.clientX) - modalRect.left
      pos4 = (isMobileSupported ? e.touches[0].clientY : e.clientY) - modalRect.top

      document.addEventListener(endEvent, dragEnd, { passive: false })
      // call a function whenever the cursor moves:
      document.addEventListener(moveEvent, dragMove, { passive: false })
    }

    function dragMove(e: any) {
      e.preventDefault()
      const parentElem = modal.parentElement as HTMLElement
      const parentRect = parentElem.getBoundingClientRect()

      // calculate the new cursor position:
      pos1 = (isMobileSupported ? e.touches[0].clientX : e.clientX) - pos3 - parentRect.left
      pos2 = (isMobileSupported ? e.touches[0].clientY : e.clientY) - pos4 - parentRect.top

      const newX = Math.max(0, Math.min(pos1, parentElem.clientWidth - modal.offsetWidth))
      const newY = Math.max(0, Math.min(pos2, parentElem.clientHeight - modal.offsetHeight))

      modal.style.top = newY + 'px'
      modal.style.left = newX + 'px'
    }

    function dragEnd() {
      // stop moving when mouse button is released:
      document.removeEventListener(endEvent, dragEnd)
      document.removeEventListener(moveEvent, dragMove)
    }
  }

  useEffect(() => {
    const modals: NodeListOf<HTMLElement> | null = document.querySelectorAll('.modal')
    modals.forEach((modal: HTMLElement, i: number) => {
      if (modal.dataset.draggable === 'true') {
        dragElement(modal)
      }
      modal.addEventListener('click', e => {
        const elem = (e.currentTarget as HTMLElement)
        // e.preventDefault()
        if (elem.classList.contains('active')) {
          return
        } else {
          elem?.classList.add('active')
        }
      })
    })
  }, [])

  return (
    <div className={`modal ${className}`} data-receiver={title} data-draggable={draggable || false} {...(attr && attr.reduce((acc, obj) => ({ ...acc, ...obj }), {}))} /**style={{ 'top': pos?.y, 'left': pos?.x }}*/ onClick={topLayer}>
      <div className='d-flex justify-content-between align-items-center'>
        <h4 className='modalHeadTitle w-100 d-flex align-items-center'>{title}<i className='fa fa-arrows' style={{ 'fontSize': '.6em', 'marginLeft': '10px' }}></i></h4>
        <Button type='button' name='modalBtnControl' className='modalBtnControl' id='closeModal' useIconFA={true} innerText='fa fa-window-minimize' onClick={handlerCloseModal} attr={attr} />
        {
          isMobileSupported && title !== 'Report form' ?
            <i
              className='modalBtnControl fa fa-window-close'
              id='clearModal'
              onClick={handleClearModal}
              data-receiver={title}
              data-dm-room-id={clearBtnDmRoom}
            ></i>
            :
            <></>
        }
      </div>
      {
        subtitle ?
          <div className='modalHeadSubtitle'>{subtitle}</div>
          :
          <></>
      }
      {children}
    </div>
  )
}

export default Modal