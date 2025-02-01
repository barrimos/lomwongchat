import React from 'react'
import { ButtonTypes } from '../../types'

const Button = ({ type, name, value, id, className, innerText, onClick, useIconFA, disabled, children, attr }: ButtonTypes): JSX.Element => {
  return (
    <button type={type}
      name={name}
      value={value}
      id={id}
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...(attr && attr.reduce((acc, obj) => ({ ...acc, ...obj }), {}))}
    >
      {
        useIconFA ?
          <i className={innerText}></i>
          :
          <>
            {
              innerText ?
               innerText
               :
               children
            }
          </>
      }
    </button>
  )
}

export default Button