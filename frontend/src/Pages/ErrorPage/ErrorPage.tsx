import React from 'react'
import './dist/ErrorPage.css'

interface Props {
  code?: number
  error?: string
  detail?: string
}

const ErrorPage = ({ code, error, detail }: Props) => {
  return (
    <div className='errorPageWrapper d-block d-md-flex'>
      <div className='leftError'>
        <h1>&otimes;</h1>
      </div>
      <div className='rightError'>
        <div>
          <h1 className='status code'>404</h1>
          <span className='status error'>NOT FOUND</span>
          {
            detail ?
              <span>{detail}</span>
              :
              <></>
          }
        </div>
      </div>
    </div>
  )
}

export default ErrorPage