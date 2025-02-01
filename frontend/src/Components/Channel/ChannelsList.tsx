import { Dispatch, SetStateAction } from 'react'
import Input from '../Input/Input'
import { getInputValue } from '../../utils/getInputValue'
import Button from '../Button/Button'
import ClearSearchBtn from '../ClearSearchBtn/ClearSearchBtn'
import gifBonfire from '../../img/loadingFire7fps.gif'

interface Props {
  currChannel: string | null
  channelsList: string[]
  joinChannel: (e: string) => void
  setInpSearch: Dispatch<SetStateAction<string>>
  inpSearch: string
  handleSearching: (data: string) => void
  resultSearchChannel: string[]
  clearSearchChannel: () => void
}

const ChannelsList = ({ currChannel, channelsList, joinChannel, setInpSearch, inpSearch, handleSearching, resultSearchChannel, clearSearchChannel }: Props): JSX.Element => {

  const handlerClickChannel = (e: React.MouseEvent | React.TouchEvent): void => {
    if ((e.type === 'click' || e.type === 'touchstart') && (e.target as HTMLElement).dataset.channelName === currChannel) return
    joinChannel((e.currentTarget as HTMLElement).dataset.channelName!)
  }

  return (
    <>
      <div className='d-flex justify-content-between align-items-center' style={{ 'height': '30px' }}>
        <Input type='text' name='searchChannel' id='searchChannel' className='inpValueSearch' onChange={e => getInputValue(e, setInpSearch)} value={inpSearch} placeHolder='Search channel' />
        <Button type='button' name='submitSearch' id='submitSearch' className='submitInp' innerText='Search' onClick={handleSearching} value={inpSearch} />
      </div>
      {
        channelsList && channelsList.length > 0 ?
          channelsList.map((nameObj: string, i: number): JSX.Element => {
            return (
              <div key={i}>
                <li className='listsChannel' data-channel-name={nameObj} onClick={(e: React.MouseEvent | React.TouchEvent) => handlerClickChannel(e)}>
                  <span className={`channel ${currChannel === nameObj ? 'active' : ''}`}>
                    {
                      currChannel === nameObj ?
                        <img src={gifBonfire} alt='global' className='bonfireIcon' />
                        :
                        <></>
                    }
                    #{nameObj}
                  </span>
                  {currChannel && currChannel === nameObj ?
                    <span className='joined'>joined</span>
                    :
                    <></>
                  }
                </li>
                {
                  resultSearchChannel.length > 0 ?
                    <ClearSearchBtn clearSearchChannel={clearSearchChannel} />
                    :
                    <></>
                }
              </div>
            )
          })
          :
          <span className='empty'>No any channel</span>
      }
    </>
  )
}

export default ChannelsList