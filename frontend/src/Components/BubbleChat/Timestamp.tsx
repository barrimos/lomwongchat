import React, { useEffect, useState } from 'react'
import { TimestampTypes } from '../../types'

const Timestamp = ({ timestamp }: TimestampTypes): JSX.Element => {
  const [timestampDate, setTimestampDate] = useState<String[]>([])

  useEffect(() => {
    setTimestampDate(timestamp.split(', '))
  }, [])

  return (
    <div>{timestampDate[0]}<br/>{timestampDate[1]}</div>
  )
}

export default Timestamp