import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react'
import Modal from '../../Components/Modal/Modal'
import Input from '../../Components/Input/Input'
import { getInputValue } from '../../utils/getInputValue'
import { SessionsDataTypes } from '../../types'
import Button from '../../Components/Button/Button'
import sortTable from '../../utils/sortTable'
import handlerListsItemPerPage from '../../utils/handlerListsItemPerPage'
import Pagination from '../../Components/Pagination/Pagination'
import axios from 'axios'
import { Params, useParams } from 'react-router-dom'
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'

interface SessionManageTypes {
  sessionsList: SessionsDataTypes[]
  className: string
  onClick: (e: React.MouseEvent | React.TouchEvent) => void
  title: string
  subtitle: string
  draggable: boolean
  setSessionsList: Dispatch<SetStateAction<SessionsDataTypes[]>>
  setIsDeleteSession: Dispatch<SetStateAction<[boolean, SessionsDataTypes['sessionId'][] | string[] | []]>>
}

const SessionManage = (props: SessionManageTypes): JSX.Element => {
  const { username }: Readonly<Params<string>> = useParams()

  const [sessionsListsSearch, setSessionsListsSearch] = useState<SessionsDataTypes[] | []>([])
  const [sessionsListsPerPage, setSessionsListsPerPage] = useState<SessionsDataTypes[] | []>([])
  const [sessionsPerPage, setSessionsPerPage] = useState<number>(5)
  const [inpSearchSession, setInpSearchSession] = useState<string>('')
  const [selectedSessionItems, setSelectedSessionItems] = useState<{ [key: string]: string[] | number }>({ length: 0 })

  const [currPage, setCurrPage] = useState<number>(1)
  const [sortedAsc, setSortedAsc] = useState<boolean>(true)

  const isProduction = process.env.REACT_APP_NODE_ENV === 'production'
  const protocol = isProduction ? 'https://' : 'http://'
  const port = isProduction ? '' : ':8080'
  const url = isProduction ? process.env.REACT_APP_NODE_API : 'localhost'
  const server = `${protocol}${url}${port}`

  const isMobileSupported: boolean = /android|iphone|kindle|ipad/i.test(navigator.userAgent)

  const handlerSearchSession = (str: string): void => {
    if (str.length > 0) {
      const result = props.sessionsList.filter(item => item.username.includes(str))
      if (result.length > 0) {
        setSessionsListsSearch(result)
      } else {
        setSessionsListsSearch([])
      }
    } else {
      setSessionsListsSearch([])
    }
  }

  const handlerCheckAllSessionsOnPage = (isChecked: boolean) => {
    // add select item
    const newDataSelectChecked: { [key: string]: string[] | number } = {}
    sessionsListsPerPage.forEach(item => {
      item.checked = isChecked
      newDataSelectChecked[item.uuid] = [item.sessionId, item.username]
    })

    setSelectedSessionItems((prev: { [key: string]: string[] | number }) => {
      const updatedData = { ...prev }
      if (isChecked) {
        // Merge new data if checked
        Object.assign(updatedData, newDataSelectChecked)
      } else {
        // Remove items if not checked
        sessionsListsPerPage.forEach(item => {
          delete updatedData[item.uuid]
        })
      }

      updatedData.length = Object.keys(updatedData).length - 1
      return updatedData
    })
  }

  const hanlderSelectIndividualSessionItem = (e: ChangeEvent<HTMLInputElement>, sid: string, username: string, uuid: string, isChecked: boolean): void => {
    // add select items
    const newDataSelectChecked: { [key: string]: string[] } = {}
    sessionsListsPerPage.forEach(item => {
      if (item.uuid === uuid && item.sessionId === sid && item.username === username) {
        item.checked = isChecked
        newDataSelectChecked[item.uuid] = [item.sessionId, item.username]
      }
    })

    setSelectedSessionItems((prev: { [key: string]: string[] | number }) => {
      const updatedData = { ...prev }
      if (isChecked) {
        // Merge new data if checked
        Object.assign(updatedData, newDataSelectChecked)
      } else {
        // Remove items if not checked
        sessionsListsPerPage.forEach(item => {
          if (item.uuid === uuid && item.sessionId === sid && item.username === username) {
            delete updatedData[item.uuid]
          }
        })
      }
      updatedData.length = Object.keys(updatedData).length - 1
      return updatedData
    })
  }

  // delete it can use it again just delete (other word logout)
  const handlerDeleteSession = async (): Promise<void> => {
    if ((selectedSessionItems.length as number) < 1) return

    const ssidListsToDelete: string[] = []
    const usernameListsToDelete: string[] = []
    Object.values(selectedSessionItems).forEach((item: string[] | number) => {
      if (typeof item !== 'number') {
        ssidListsToDelete.push(item[0])
        usernameListsToDelete.push(item[1])
      }
    })
    const uuidListsToDelete = Object.keys(selectedSessionItems).filter(key => key !== 'length')

    try {
      const isSuccess: { data: { valid: boolean, message: string } } = await axios.post(`${server}/data/ssid/delete`,
        {
          data: ssidListsToDelete,
          uuid: uuidListsToDelete
        },
        {
          headers: {
            username,
            access: 'adsysop'
          },
          withCredentials: true
        }
      )
      withReactContent(Swal).fire({
        // log success delete
        title: isSuccess.data.message
      })

      if (isSuccess.data.valid) {
        // update dataset then it will re-slice data per page
        props.setSessionsList(props.sessionsList.filter((prev: SessionsDataTypes) => !(ssidListsToDelete as string[]).includes(prev.sessionId)))

        props.setIsDeleteSession([true, usernameListsToDelete as string[]])

        // clear select data
        setSelectedSessionItems({ length: 0 })
      }
    } catch (err: any) {
      console.error(err.response.data.error)
      withReactContent(Swal).fire({
        title: err.response.data.error
      })
    }
  }

  useEffect(() => {
    handlerListsItemPerPage(props.sessionsList, sessionsPerPage, currPage, setSessionsListsPerPage)
  }, [props.sessionsList])


  useEffect(() => {
    if (inpSearchSession.length > 0) {
      handlerSearchSession(inpSearchSession)
      return () => {
        handlerSearchSession('')
      }
    }
  }, [inpSearchSession])

  return (
    <div className='modalManageWrapper'>
      <Modal
        handlerCloseModal={props.onClick}
        className={props.className}
        title={props.title}
        subtitle={props.subtitle}
        isMobileSupported={isMobileSupported}
        draggable={true}
      >
        <Input
          type='text'
          name='searchSession'
          id='searchSession'
          className='searchModalManage'
          value={inpSearchSession}
          placeHolder='Search uuid or username'
          onChange={e => getInputValue(e, setInpSearchSession)}
        />
        <div className='menuTabWrapper'>
          <Button
            type='button'
            name='deleteSession'
            className='sessionCmdBtn'
            onClick={handlerDeleteSession}
            innerText=''
          >
            <i className='fa fa-trash-o'></i>
            <span className='d-none d-sm-block labelSessionCmdBtn'>Delete</span>
          </Button>
        </div>
        {
          props.sessionsList && props.sessionsList.length > 0 ?
            <>
              <Pagination
                allDatas={props.sessionsList}
                currPage={currPage}
                setCurrPage={setCurrPage}
                itemsPerPage={sessionsPerPage}
                handlerListsItemPerPage={handlerListsItemPerPage}
                setListsItemPerPage={setSessionsListsPerPage}
              />
              <table className='d-block d-lg-table sessionTableItemsWrapper' id='tbOp'>
                <thead>
                  <tr>
                    <th colSpan={2} scope='col'>
                      Username
                      <Button
                        type='button'
                        name='username'
                        className='sortSessionBtn'
                        onClick={(e: MouseEvent | TouchEvent) => sortTable(e, 1, sortedAsc, setSortedAsc)}
                        innerText=''
                      >
                        <i className='fa fa-sort'></i>
                      </Button>
                    </th>
                    <th colSpan={2} scope='col'>
                      UUID
                      <Button
                        type='button'
                        name='uuid'
                        className='sortSessionBtn'
                        onClick={(e: MouseEvent | TouchEvent) => sortTable(e, 2, sortedAsc, setSortedAsc)}
                        innerText=''
                      >
                        <i className='fa fa-sort'></i>
                      </Button>
                    </th>
                    <th colSpan={2} scope='col'>
                      Sesion ID
                      <Button
                        type='button'
                        name='ssid'
                        className='sortSessionBtn'
                        onClick={(e: MouseEvent | TouchEvent) => sortTable(e, 3, sortedAsc, setSortedAsc)}
                        innerText=''
                      >
                        <i className='fa fa-sort'></i>
                      </Button>
                    </th>
                    <th colSpan={2} scope='col'>Agent</th>
                    <th colSpan={2} scope='col'>IP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3}>
                      <div className='d-flex align-items-center'>
                        <Input
                          type='checkbox'
                          name='checkAllItems'
                          id='checkAllItems'
                          className='checkAllItems'
                          checked={sessionsListsPerPage.filter(item => item.checked).length > 0}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handlerCheckAllSessionsOnPage(e.target.checked)}
                        />
                        <label htmlFor='checkAllItems' style={{ marginBottom: '-1px', marginLeft: '3px' }}>Selected: {selectedSessionItems.length}</label>
                      </div>
                    </td>
                    <td colSpan={1}>
                      <div className='listsPerPage d-flex justify-content-between align-items-center' id='listsPerPage'>
                        <select value={sessionsPerPage} style={{ 'padding': '5px' }} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSessionsPerPage(Number(e.target.value))}>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="15">15</option>
                          <option value="20">20</option>
                        </select>
                        <span>per page</span>
                      </div>
                    </td>
                  </tr>
                  <>
                    {
                      (sessionsListsSearch && sessionsListsSearch.length > 0
                        ? sessionsListsSearch : sessionsListsPerPage).map((item: SessionsDataTypes, i: number) => {
                          return (
                            <tr key={i} className='itemSession'>
                              <td colSpan={1} className='checkSid'>
                                <Input
                                  type='checkbox'
                                  name='checkItem'
                                  id={item.sessionId}
                                  className='checkItem'
                                  checked={item.checked}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => hanlderSelectIndividualSessionItem(e, item.sessionId, item.username, item.uuid, e.target.checked)}
                                />
                              </td>
                              <td colSpan={1} className='sidUsername'>
                                <i className={`fa ${item.isLoggedIn ? 'fa-circle loggedin' : 'fa-circle-o loggedoff'}`}></i>
                                <span>{item.username}</span>
                              </td>
                              <td colSpan={2} className='sidUuid'>{item.uuid}</td>
                              <td colSpan={2} className='sidId'>{item.sessionId}</td>
                              <td colSpan={2} className='sidAgent'>{item.agent}</td>
                              <td colSpan={2} className='sidIp'>{item.ip}</td>
                            </tr>
                          )
                        })

                    }
                  </>
                </tbody>
              </table>
              <Pagination
                allDatas={props.sessionsList}
                currPage={currPage}
                setCurrPage={setCurrPage}
                itemsPerPage={sessionsPerPage}
                handlerListsItemPerPage={handlerListsItemPerPage}
                setListsItemPerPage={setSessionsListsPerPage}
              />
            </>
            :
            <div className='empty'>
              No Session found
            </div>
        }
      </Modal>
    </div>
  )
}

export default SessionManage