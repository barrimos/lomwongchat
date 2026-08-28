import React, { useState } from 'react'
import './dist/GuideBoxLogin.css'
import Button from '../Button/Button'
import { GuideBoxLoginTypes } from '../../types'

const GuideBoxLogin = ({ setInputUsername, setInputPassword }: GuideBoxLoginTypes): JSX.Element => {
  const [isOpenGuideBox, setIsOpenGuideBox] = useState<boolean>(false)

  const handleToggleGuideBox = (): void => {
    setIsOpenGuideBox(!isOpenGuideBox)
  }

  const handlePasteToField = (e: React.MouseEvent<HTMLParagraphElement> | React.TouchEvent<HTMLParagraphElement>): void => {
    const usernameSelect: string | null = (e.target as HTMLElement).getAttribute('data-username')
    setInputUsername(usernameSelect as string)
    setInputPassword('123')
    handleToggleGuideBox()
  }
  return (
    <div className='guideBoxContainer'>
      <Button
        onClick={handleToggleGuideBox}
        type='button'
        name='guideBoxOpen'
        id='guideBoxBtn'
        innerText='ℹ️'
      />
      {
        isOpenGuideBox ?
        <div className='guideItem'>
          <div className='d-flex justify-content-between align-items-center'>
            <p style={{ width: '100%', color: 'gray' }}>Click to pasting</p>
            <Button
              onClick={handleToggleGuideBox}
              type='button'
              name='guideBoxClose'
              id='closeGuideBoxBtn'
              innerText='❌'
              />
          </div>
          <p className='testUsername' onClick={handlePasteToField} data-username='rvv'>rvv</p>
          <p className='testUsername' onClick={handlePasteToField} data-username='red'>red (Banned test)</p>
          <p className='testUsername' onClick={handlePasteToField} data-username='aes'>aes</p>
          <p className='testUsername' onClick={handlePasteToField} data-username='dexter'>dexter</p>
          <p className='testUsername' onClick={handlePasteToField} data-username='dosan'>dosan</p>
          <p className='testUsername' onClick={handlePasteToField} data-username='zata'>zata</p>
        </div>
        :
        <></>
      }
    </div>
  )
}

export default GuideBoxLogin