import React, { ChangeEvent } from 'react'

interface Props {
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  value: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeHolder?: string
  id?: string
  className?: string
  resizer: any
  autoFocus: boolean
  style?: { [key: string]: number | string }
}

const TextArea = ({ onChange, value, onKeyDown, placeHolder, className, id, resizer, autoFocus, style }: Props): JSX.Element => {

  return (
    <textarea
      style={style ? { 'resize': resizer ? resizer : '', fontSize: style!.fontSize + 'em', lineHeight: style!.lineHeight + 'px' } : { 'resize': resizer ? resizer : '' }}
      className={className}
      onChange={onChange}
      value={value}
      onKeyDown={onKeyDown}
      placeholder={placeHolder}
      id={id}
      autoFocus={autoFocus}
    />
  )
}

export default TextArea