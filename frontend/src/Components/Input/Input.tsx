import { Children } from 'react';
import { InputTypes } from '../../types'
import ToggleShowHideBtn from '../ToggleShowHideBtn/ToggleShowHideBtn'

const Input = ({
  type,
  name,
  id,
  className,
  placeHolder,
  required,
  onClick,
  onChange,
  onFocus,
  onKeyDown,
  value,
  useLabel = false,
  labelText,
  labelId,
  labelClass,
  min,
  max,
  checked,
  useShowHide,
  attr
}: InputTypes): JSX.Element => {

  const [useShow, setState] = useShowHide || [false, () => { }];

  return (
    <>
      {
        useShow ?
          <ToggleShowHideBtn setToggleShowHide={setState} />
          :
          <></>
      }
      <input
        type={type}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onClick={onClick}
        name={name}
        id={id}
        value={value}
        className={className}
        placeholder={placeHolder}
        required={required}
        min={min}
        max={max}
        checked={checked}
        {...(attr && attr.reduce((acc, obj) => ({ ...acc, ...obj }), {}))}
      />
      {
        useLabel ?
          <label
            htmlFor={id}
            id={labelId}
            className={labelClass}
          >
            {labelText}
          </label>
          :
          ''
      }
    </>
    // </div>
  )
}

export default Input