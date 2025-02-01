import React from 'react'

interface Props {
  resultVerified: string
}

const CaptchaStatus = ({ resultVerified }: Props): JSX.Element => {
  return (
    <div>Status: <span id='captchaStatus' className={resultVerified}>{resultVerified.toUpperCase() || 'idle'}</span></div>
  )
}

export default CaptchaStatus