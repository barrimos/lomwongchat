import React, { useEffect, useState } from 'react'

interface props {
    noti: string[]
    receiver: string
    openDm: (e: React.MouseEvent | React.TouchEvent) => void
    clearPM: (e: React.MouseEvent | React.TouchEvent) => void
    children: React.ReactNode
    isOpenDM: boolean
    clearListDmRoom: string
}

const TabDm = ({ noti, receiver, openDm, clearPM, isOpenDM, children, clearListDmRoom }: props): JSX.Element => {

  const [isNoti, setIsNoti] = useState<boolean>(false)

  useEffect(() => {
    if (noti.length > 0
      && noti.includes(receiver)
      && (!isOpenDM || !document.querySelector(`.modal[data-receiver=${receiver}]`))) {
        setIsNoti(true)
      } else {
        setIsNoti(false)
      }
  }, [noti])

    return (
        <div className='tabItemWrapper' data-receiver={receiver} onClick={e => openDm(e)}>
            <div className='tabItem' data-noti={isNoti}>{children}</div>
            <i className='fa fa-close clearDmListBtn' data-receiver={receiver} data-dm-room-id={clearListDmRoom} onClick={clearPM}></i>
        </div>
    )
}

export default TabDm