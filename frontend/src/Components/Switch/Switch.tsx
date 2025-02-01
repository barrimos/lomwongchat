import React, { ChangeEvent, Dispatch, SetStateAction, useState } from 'react'
import './dist/Switch.css'

interface Props {
  name: string
  id: string
  className: string
  offValue: string
  onValue: string
  textOff?: string
  textOn?: string
  align?: string
  useOwnIcon?: boolean
  onIcon?: string
  offIcon?: string
  setThemeSwitch?: Dispatch<SetStateAction<string>>
}

const Switch = ({ name, id, className, offValue, onValue, textOff, textOn, useOwnIcon: useIcon, onIcon, offIcon, setThemeSwitch }: Props) => {

  const [switchValue, setSwitchValue] = useState<boolean>(false)

  const handleOnSwitchTheme = (e: ChangeEvent): void => {
    const target = e.target as HTMLInputElement
    if (target.checked) {
      target.parentElement!.style.transform = 'translateX(calc(100% - 3px))'
      setThemeSwitch!('')
      setSwitchValue(target.checked)
      target.setAttribute('ckecked', 'true')
    } else {
      target.parentElement!.style.transform = 'translateX(0)'
      setThemeSwitch!('light')
      setSwitchValue(target.checked)
      target.setAttribute('ckecked', 'false')
    }
  }

  return (
    <div className='swithcWrapper'>
      <div className='onLabel switchLabel'>
        {
          useIcon ?
            <img src={onIcon} alt='onIcon' className='onIcon'></img>
            :
            <i className='fa fa-sun-o'></i>
        }
      </div>
      <div className='switchControl'>
        <div className='switchButton' data-name={name}>
          <input type='checkbox' name='switchCheckbox' id={id} className={className} onChange={handleOnSwitchTheme} />
        </div>
      </div>
      <div className='offLabel switchLabel'>
        {
          useIcon ?
            <img src={offIcon} alt='offIcon' className='offIcon'></img>
            :
            <i className='fa fa-moon-o'></i>
        }
      </div>
    </div>
  )
}

export default Switch