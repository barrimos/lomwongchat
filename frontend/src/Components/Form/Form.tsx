import { FormTypes } from '../../types'


const Form = ({
  head,
  headClass,
  subHead,
  subHeadClass,
  method,
  action,
  className,
  id,
  target,
  autoComplete,
  children,
  encType
}: FormTypes): JSX.Element => {
  return (
    <form action={action} method={method} className={className} id={id} target={target} autoComplete={autoComplete} encType={encType}>
      {
        head && subHead ?
          <div id='titleForm'>
            <div className={headClass}>{head}</div>
            <div className={subHeadClass}>{subHead}</div>
          </div>
          :
          <></>
      }
      {children}
    </form>
  )
}

export default Form