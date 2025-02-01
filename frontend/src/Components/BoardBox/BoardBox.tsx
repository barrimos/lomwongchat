import React, { Dispatch, SetStateAction } from 'react'

interface Props {
  className?: string
  maxHeight?: string
  iconFa: string
  title: string
  value: number | string
  titleColor?: string
  valueColor?: string
  onClick?: (e: React.MouseEvent | React.TouchEvent, refSetState?: Dispatch<SetStateAction<boolean>>) => void
  isAbleOpen?: boolean
  refSetState?: Dispatch<SetStateAction<boolean>>
}

const BoardBox = ({ className, maxHeight, iconFa, title, value, titleColor, valueColor, onClick, isAbleOpen, refSetState }: Props) => {
  return (
    <div
      className={`boardBox ${maxHeight} ${className ?? 'defaultColor'} ${isAbleOpen ? 'pointer' : ''}`}
      onClick={refSetState ? (e) => onClick!(e, refSetState) : onClick}
    >
      <div className='d-flex justify-content-center align-items-center'>
        <div className='iconBox'>
          <i className={iconFa}></i>
        </div>
        {
          isAbleOpen ?
            <i className='fa fa-expand expandClick'></i>
            :
            <></>
        }
        <h5 style={{ 'color': `${titleColor}` }}>{title}</h5>
      </div>
      <span style={{ 'color': `${valueColor}` }}>{value}</span>
    </div>
  )
}

export default BoardBox