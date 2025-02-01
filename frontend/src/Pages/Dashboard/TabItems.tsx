import React from 'react'

interface Props {
  data: string
  onClick: (e: React.MouseEvent | React.TouchEvent) => void
}

const TabItems = ({ data, onClick }: Props) => {
  return (
    <div className='tabsWrapper'>
      {
        data && data.length > 0 ?
          <div className='tabItem active' data-open='' data-channel='' onClick={onClick}>unameD</div>
          :
          <></>
      }
    </div>
  )
}

export default TabItems