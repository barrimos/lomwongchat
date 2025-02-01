import React, { useEffect, useState } from 'react'
import tentIcon from '../../img/tent.png'

interface Props {
  dmName: string
  clearPM: (e: React.MouseEvent | React.TouchEvent) => void
  openDM: (e: React.MouseEvent | React.TouchEvent) => void
  noti: string[]
  isOpenDM: boolean
  isMobileSupported: boolean
  clearBtnDmRoom: string
  dataIndex: number
}

const DMLists = ({ dmName, clearPM, openDM, noti, isOpenDM, isMobileSupported,clearBtnDmRoom, dataIndex }: Props) => {
  const [isNoti, setIsNoti] = useState<boolean>(false)

  useEffect(() => {
    if (noti.length > 0
      && noti.includes(dmName) // if name in noti match in name in list
      && (!isOpenDM || !document.querySelector(`.modal[data-receiver=${dmName}]`))) {
      setIsNoti(true)
    } else {
      setIsNoti(false)
    }
  }, [noti])

  return (
    <li
      className='pmListItem'
      data-receiver={dmName}
      onClick={openDM}
      data-index={dataIndex}
      data-noti={isNoti}
    >
      <div className='dmName'>
        <img src={tentIcon} alt='private' className='tentIcon' />
        {dmName}
      </div>
      <i className={`deletePMBtn ${isMobileSupported ? 'active' : ''} fa fa-close`} data-is-mobile-supported={isMobileSupported} data-receiver={dmName} data-dm-room-id={clearBtnDmRoom} onClick={clearPM}></i>
    </li>
  )
}

export default DMLists