import React, { useEffect, useState } from 'react'
import Button from '../../Components/Button/Button'
import { DashboardUsers } from '../../types'

interface Props {
  actionStatus: (e: React.MouseEvent | React.TouchEvent, user: DashboardUsers, statusNum: string) => void
  personalMessage: (e: React.MouseEvent | React.TouchEvent) => void
  user: DashboardUsers
  noti: string[]
  isOpenDM: boolean
}

const ActionButtonStatus = ({ actionStatus, personalMessage, user, noti, isOpenDM }: Props) => {
  const [isNoti, setIsNoti] = useState<boolean>(false)

  useEffect(() => {
    if (noti.length > 0
      && noti.includes(user.username)
      && (!isOpenDM || !document.querySelector(`.modal[data-receiver=${user.username}]`))) {
        setIsNoti(true)
      } else {
        setIsNoti(false)
      }
  }, [noti])

  return (
    <div className='actionBtns'>
      <Button type='button' name='normal' id='actionStatusNormal' className={`actionStatusBtn ${user.status === 'normal' ? 'active' : ''} normal`} innerText='fa fa-check-circle-o' useIconFA={true} onClick={(e: React.MouseEvent | React.TouchEvent) => actionStatus(e, user, '301')} />
      <Button type='button' name='warning' id='actionStatusWarning' className={`actionStatusBtn ${user.status === 'warning' ? 'active' : ''} warning`} innerText='fa fa-warning' useIconFA={true} onClick={(e: React.MouseEvent | React.TouchEvent) => actionStatus(e, user, '400')} />
      <Button type='button' name='banned' id='actionStatusBanned' className={`actionStatusBtn ${user.status === 'banned' ? 'active' : ''} banned`} innerText='fa fa-ban' useIconFA={true} onClick={(e: React.MouseEvent | React.TouchEvent) => actionStatus(e, user, '401')} />
      <Button type='button' name='dm' id='actionStatusDM' className={`actionStatusBtn dm`} innerText='fa fa-commenting-o' useIconFA={true} onClick={(e: React.MouseEvent | React.TouchEvent) => personalMessage(e)} attr={[{ 'data-dm': isNoti, 'data-receiver': user.username }]} />
    </div>
  )
}

export default ActionButtonStatus