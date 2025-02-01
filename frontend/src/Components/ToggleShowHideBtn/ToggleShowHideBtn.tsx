import React, { Dispatch, SetStateAction } from 'react'

interface Props {
  setToggleShowHide: Dispatch<SetStateAction<boolean>>
}

const ToggleShowHideBtn = ({ setToggleShowHide }: Props) => {

  const toggleShow = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.preventDefault()
    const target = e.target as HTMLElement
    if (target.classList.contains('fa-eye-slash')) {
      target.classList.remove('fa-eye-slash')
      target.classList.add('fa-eye')
      setToggleShowHide(true)
    } else {
      target.classList.add('fa-eye-slash')
      target.classList.remove('fa-eye')
      setToggleShowHide(false)
    }
  }

  return (
    <i className='fa fa-eye-slash icon-eye' onClick={e => toggleShow(e)}></i>
  )
}

export default ToggleShowHideBtn