import React from 'react'
import './dist/InfoGuide.css'

interface InfoGuideTypes {
  isMobileSupported: boolean
  texts: string[]
}

const InfoGuide = ({ isMobileSupported, texts }: InfoGuideTypes): JSX.Element => {

  const toggleInfo = (e: React.MouseEvent | React.TouchEvent) => {
    const elem: HTMLElement = (e.currentTarget as HTMLElement)
    elem.addEventListener('click', e => {
      if (elem.classList.contains('active')) {
        elem.classList.remove('active')
      } else {
        elem.classList.add('active')
      }
    })
  }

  return (
    <div className={`guideInfoData`} onClick={toggleInfo}>
      {
        texts && texts.length > 0 ?
          texts.map((text: string, i: number) => {
            return (
              <div key={i}>&#x2022; {text}</div>
            )
          })
          :
          <></>
      }
    </div>
  )
}

export default InfoGuide