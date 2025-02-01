import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react'

interface Props {
  currFeels: string
  setCurrFeels: Dispatch<SetStateAction<string>>
}

const Feelings = ({ currFeels, setCurrFeels }: Props) => {
  const [emojiDatas, setEmojiDatas] = useState<string[]>([])


  // fetch emoji feels
  const handleFetchEmojiDatas = async (): Promise<void> => {
    try {
      const response = await fetch('/emoji/emojis.json')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const emoji = await response.json()
      setEmojiDatas(emoji) // hex
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectFeels = (e: ChangeEvent<HTMLSelectElement>): void => {
    e.preventDefault()
    sessionStorage.setItem('emoji', e.target.value) // hex 0x
    setCurrFeels(e.target.value)
  }

  useEffect(() => {
    handleFetchEmojiDatas()
    const cacheCurrFeelsHex: string = sessionStorage.getItem('emoji')!
    if (cacheCurrFeelsHex) {
      setCurrFeels(cacheCurrFeelsHex)
    }
  }, [])

  return (
    <select name='selectFeelings' value={currFeels} className='selectFeelings' onChange={handleSelectFeels}>
      {
        emojiDatas.map((emoji: string, i: number) => {
          return (
            <option key={i} value={emoji[1]}>{String.fromCodePoint(parseInt(emoji[1]))}</option>
          )
        })
      }
    </select>
  )
}

export default Feelings