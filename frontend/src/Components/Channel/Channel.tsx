import { Dispatch, SetStateAction } from 'react'
import ChannelsList from './ChannelsList'

type Props = {
  currChannel: string | null
  ch: string[]
  joinChannel: (e: string) => void
  setInpSearch: Dispatch<SetStateAction<string>>
  inpSearch: string
  handleSearching: (data: string) => void
  resultSearchChannel: string[]
  clearSearchChannel: () => void
}

const Channel = ({ currChannel, ch, joinChannel, setInpSearch, inpSearch, handleSearching, resultSearchChannel, clearSearchChannel }: Props): JSX.Element => {
  return (
    <ChannelsList currChannel={currChannel} resultSearchChannel={resultSearchChannel} clearSearchChannel={clearSearchChannel} channelsList={ch} joinChannel={joinChannel} setInpSearch={setInpSearch} handleSearching={handleSearching} inpSearch={inpSearch} />
  )
}

export default Channel