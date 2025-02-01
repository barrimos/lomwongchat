import React, { useEffect } from 'react'

interface Props {
  listPM: string[]
  isTogglePMListOpen: boolean
  clearPM: (e: React.MouseEvent | React.TouchEvent) => void
}

const NavDMLists = ({ listPM, isTogglePMListOpen, clearPM }: Props) => {

  useEffect(() => {
    const navListsWrapper: HTMLElement | null = document.querySelector('#navListWrapper')!

    if (isTogglePMListOpen) {
      const listHeight = navListsWrapper.childNodes.length * 40
      if (listHeight > 200) {
        navListsWrapper.style.transition = 'height ease 1s'
      } else {
        navListsWrapper.style.transition = 'height ease .3s'
      }
      navListsWrapper.style.height = `${listHeight}px`
    } else {
      navListsWrapper.style.height = '0px'
    }
  }, [listPM, isTogglePMListOpen])

  return (
    <ul id='navListWrapper' className={`${isTogglePMListOpen ? 'active' : ''}`}>
      {
        listPM && Array.isArray(listPM) && listPM.length > 0 ?
          listPM.map((name: string, i: number) => {
            return (
              <li key={i} className='navLists d-flex justify-content-between align-items-center p-5'>
                <div>{name}</div>
                <i className='fa fa-close' data-key-idx={i} onClick={clearPM}></i>
              </li>
            )
          })
          :
          <li className='empty'>No direct message</li>
      }
    </ul>
  )
}

export default NavDMLists