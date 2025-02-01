import React from 'react'
import './dist/Loader.css'
import loadingFire from '../../img/loadingFire7fps.gif'

type Props = {}

const Loader = (props: Props) => {
  return (
    <div className='wrapperLoader'>
      <span className='loadingTextDot'>
        <div className='ld'>Loading</div>
        <div className='loader'>
          <div className='dot'></div>
          <div className='dot'></div>
          <div className='dot'></div>
        </div>
      </span>
      <img src={loadingFire} className='loadingFire' alt="loadingCanpfire" />
    </div>
  )
}

export default Loader