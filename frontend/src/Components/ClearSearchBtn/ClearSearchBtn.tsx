import React from 'react'

type Props = {
  clearSearchChannel: () => void
}

const ClearSearchBtn = ({ clearSearchChannel }: Props) => {
  return (
    <div
      onClick={clearSearchChannel}
      style={{
        'width': '100%',
        'padding': '5px',
        'textAlign': 'center',
        'fontSize': '.75em',
        'fontWeight': '500',
        'color': 'hsl(0, 100%, 60%)',
        'cursor': 'pointer'
      }}
    >Clear search</div>
  )
}

export default ClearSearchBtn