import React from 'react'

type Props = {}

export const ExitRoomIcon = (props: Props): JSX.Element => {
  return (
    <svg viewBox='0 0 15 15' width='25' height='25'>
      <path
        d='M8 3 L11 3 L11 12 L8 12 M6 5 L4 7 L6 9 M4 7 L8 7'
        fill='transparent'
        strokeWidth='1'
        strokeLinecap='round'
        stroke='black'
      />
    </svg>
  )
}


export const ToBottomIcon = (props: Props): JSX.Element => {
  return (
    <svg viewBox='0 0 15 15' width='30' height='30'>
      <path
        d='M4 6.5 L7.5 9.5 L11 6.5'
        fill='transparent'
        strokeWidth='2'
        strokeLinecap='round'
        stroke='hsl(254 64% 46%)'
      />
    </svg>
  )
}

export const FeelsIcon = (props: Props): JSX.Element => {
  // 128127 - 128128
  // 129324
  // 128512 - 128580
  // 128584 - 128586
  // 129296 - 129488
  return (
    <select name='feelsIcon' id='feelsIcon'>
      <option value=''></option>
    </select>
  )
}