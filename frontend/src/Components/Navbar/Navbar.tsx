import React, { Dispatch, SetStateAction } from 'react'
import Button from '../Button/Button'
import Menu from '../Menu/Menu'
import './dist/Navbar.css'
import { ExitRoomIcon } from '../Icons/ExitRoomIcon'
import { Socket } from 'socket.io-client'

type Props = {
  yourName: string | undefined
  isToggleMenuOpen: boolean
  toggleMenu: () => void
  setCurrTab: Dispatch<SetStateAction<string[]>>
  currTab: string[]
  ch: string[]
  currChannel: string | null
  setInpNewChannelName: Dispatch<SetStateAction<string>>
  inpNewChannelName: string
  createNewChannel: (e: React.MouseEvent | React.TouchEvent | KeyboardEvent) => void
  errorBox: string[]
  usersOnline: string[]
  inpSearchUser: string
  setInpSearchUser: Dispatch<SetStateAction<string>>
  joinChannel: (e: string) => void
  handlerLogoutBtn: (e: React.MouseEvent | React.TouchEvent) => void
  inpSearchChannel: string
  setInpSearchChannel: Dispatch<SetStateAction<string>>
  resultSearchChannel: string[]
  clearSearchChannel: () => void
  handleSearching: (e: string) => void
  openDM: (e: React.MouseEvent | React.TouchEvent) => void
  topLayer: (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => void
  noti: string[]
  isOpenDM: boolean
}

const Navbar = ({ yourName, isToggleMenuOpen, toggleMenu, setCurrTab, currTab, ch, currChannel, setInpNewChannelName, inpNewChannelName, createNewChannel, errorBox, usersOnline, inpSearchUser, setInpSearchUser, joinChannel, handlerLogoutBtn, inpSearchChannel, setInpSearchChannel, resultSearchChannel, clearSearchChannel, handleSearching, openDM, topLayer, noti, isOpenDM }: Props) => {
  return (
    <nav id='navbar' className='d-md-none'>
      <div className="row no-gutters d-flex justify-content-between align-items-center">

        <div className='col-auto'>
          <Button type='button' name='exitBtn' className='btn exitBtn' innerText='' onClick={handlerLogoutBtn} >
            <ExitRoomIcon />
          </Button>
        </div>

        <div className='col-6 d-md-none'>
          {
            currChannel && currChannel ?
              <select name="channelSelect" id="channelSelect" className='channelSelect' value={currChannel && currChannel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => joinChannel(e.target.value)} >
                {
                  ch && ch.length > 0 ?
                    ch.map((name: string, i: number) => {
                      return (
                        <option value={name} className='optionRoom' key={i}>#{name}</option>
                      )
                    })
                    :
                    <></>
                }
              </select>
              :
              <span style={{ fontSize: '.7em', textAlign: 'center', width: '100%', display: 'block' }}>Loading ...</span>
          }
        </div>
        <div className='col-auto'>
          <Button type='button' name='menuBtn' className='btn menuBtn' innerText='fa fa-bars' useIconFA={true} onClick={toggleMenu} attr={[{ 'data-noti': noti.length > 0 }]} />
          <Menu
            setCurrTab={setCurrTab}
            currTab={currTab}
            usersOnline={usersOnline}
            inpSearchUser={inpSearchUser}
            setInpSearchUser={setInpSearchUser}
            errorBox={errorBox}
            isToggleMenuOpen={isToggleMenuOpen}
            setInpNewChannelName={setInpNewChannelName}
            inpNewChannelName={inpNewChannelName}
            createNewChannel={createNewChannel}
            inpSearchChannel={inpSearchChannel}
            setInpSearchChannel={setInpSearchChannel}
            resultSearchChannel={resultSearchChannel}
            clearSearchChannel={clearSearchChannel}
            handleSearching={handleSearching}
            openDM={openDM}
            topLayer={topLayer}
            yourName={yourName}
            noti={noti}
            isOpenDM={isOpenDM}
          />
        </div>
      </div>
      {/* {
        isToggleMenuOpen ?
          <div id='overlay'></div>
          :
          <></>
      } */}
    </nav>
  )
}

export default Navbar