import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react'
import Modal from '../../Components/Modal/Modal'
import { TicketBubbleTypes } from '../../types'
import Input from '../../Components/Input/Input'
import { getInputValue } from '../../utils/getInputValue'
import Button from '../../Components/Button/Button'
import topLayer from '../../utils/topLayer'

interface Props {
  ticketsItems: TicketBubbleTypes[]
  onClick: (e: React.MouseEvent | React.TouchEvent, refSetState?: Dispatch<SetStateAction<boolean>>) => void
  updateReports: (e: MouseEvent | TouchEvent, status: string) => void
  deleteTicket: (e: MouseEvent | TouchEvent) => void
  className: string
  title: string
  subtitle: string
  draggable: boolean
}

const TicketManage = ({ ticketsItems, onClick, updateReports, deleteTicket, className, title, subtitle, draggable }: Props) => {

  const [showTickets, setShowTickets] = useState<TicketBubbleTypes[]>(ticketsItems)
  const [currFilter, setCurrFilter] = useState<string | null>(null)
  const [inpSearchTicket, setInpSearchTicket] = useState<string>('')

  const searchTicket = (data: string) => {
    if (data.length <= 0) {
      setShowTickets(ticketsItems)
    } else {
      const result: TicketBubbleTypes[] = showTickets.filter(item => (item.code?.toLowerCase())?.includes(data))
      setShowTickets(result)
    }
  }

  const filterOpenClosedTickets = (e: ChangeEvent) => {
    const targetRadio = (e.target as HTMLInputElement).value

    if (currFilter && (targetRadio === currFilter)) {
      return
    }

    let result: TicketBubbleTypes[] = []

    document.querySelector(`.labelForRadioFilterTickets.active`)?.classList.remove('active')

    if (targetRadio === 'openTickets') {
      result = ticketsItems.filter(report => (report.status === 'open'))
    } else if (targetRadio === 'closedTickets') {
      result = ticketsItems.filter(report => (report.status === 'closed'))
    } else if (targetRadio === 'queueTickets') {
      result = ticketsItems.filter(report => (report.status === 'queue'))
    }
    ((e.target as HTMLInputElement).nextElementSibling as HTMLElement).classList.add('active')

    setShowTickets(result)
    setCurrFilter(targetRadio)
  }

  const clearFilterTickets = () => {
    setShowTickets(ticketsItems)
    setCurrFilter(null)
    if (document.querySelector('.labelForRadioFilterTickets.active')) {
      (document.getElementById(currFilter!) as HTMLInputElement)!.checked = false
      document.querySelector('.labelForRadioFilterTickets.active')?.classList.remove('active')
    }
  }

  const handlerTerminateOpenTicket = (e: MouseEvent | TouchEvent): void => {
    const ticketStatus = (e.currentTarget as HTMLButtonElement).dataset.currStatus

    if (ticketStatus === 'open') {
      const confirm: boolean = window.confirm('Are you sure for terminate this ticket ?')
      if (confirm) {
        updateReports(e, 'closed')
      } else {
        return
      }
    }
  }

  const handlerOpenTicket = (e: MouseEvent | TouchEvent): void => {
    updateReports(e, 'open')
  }

  useEffect(() => {
    searchTicket(inpSearchTicket)
    return () => {
      searchTicket('')
    }
  }, [inpSearchTicket])

  return (
    <div className='modalManageWrapper'>
      <Modal title={title} className={className} subtitle={subtitle} handlerCloseModal={onClick} topLayer={topLayer}>
        <Input type='text' name='searchTicket' id='searchTicket' className='searchModalManage' value={inpSearchTicket} placeHolder='Search ticket' onChange={e => getInputValue(e, setInpSearchTicket)} />
        <div className='d-flex justify-content-start align-items-center'>
          <div className='radioFilterTicketsWrapper'>
            <Input type='radio' name='radioFilterTickets' id='queueTickets' className='radioFilterTickets' value='queueTickets' useLabel={true} labelText='Queue' labelClass='labelForRadioFilterTickets' onChange={filterOpenClosedTickets} />
          </div>
          <div className='radioFilterTicketsWrapper'>
            <Input type='radio' name='radioFilterTickets' id='openTickets' className='radioFilterTickets' value='openTickets' useLabel={true} labelText='Open' labelClass='labelForRadioFilterTickets' onChange={filterOpenClosedTickets} />
          </div>
          <div className='radioFilterTicketsWrapper'>
            <Input type='radio' name='radioFilterTickets' id='closedTickets' className='radioFilterTickets' value='closedTickets' useLabel={true} labelText='Closed' labelClass='labelForRadioFilterTickets' onChange={filterOpenClosedTickets} />
          </div>
          <Button type='button' name='clearFilterTickets' id='clearFilterTickets' innerText='Clear' onClick={clearFilterTickets} />
        </div>
        {
          showTickets && showTickets.length > 0 ?
            showTickets.map((data: TicketBubbleTypes, i: number) => {
              return (
                <div key={i} className='ticketItem' data-ticket={data.code}>
                  <div className='d-flex justify-content-between align-items-center'>
                    <h3 className='ticketSN'><span className={`ticketStatus ${data.status}`} data-status={data.status}>{data.status}</span>{data.code}</h3>
                    <div>
                      <Button type='button' name='openTicketBtn' id='openTicketBtn' className='openTicketBtn manageTicket' innerText='open' onClick={handlerOpenTicket} attr={[{ 'data-idx': i }, { 'data-curr-status': data.status }, { 'data-ticket': data.code }]} disabled={data.status === 'queue' ? false : true} />
                      <Button type='button' name='closeTicketBtn' id='closeTicketBtn' className='closeTicketBtn manageTicket' innerText='close' onClick={handlerTerminateOpenTicket} attr={[{ 'data-idx': i }, { 'data-curr-status': data.status }, { 'data-ticket': data.code }]} disabled={data.status === 'open' ? false : true} />
                      {
                        data.status === 'closed' ?
                          <Button type='button' name='deleteTicketBtn' id='deleteTicketBtn' className='deleteTicketBtn manageTicket' attr={[{ 'data-ticket': data.code }, { 'data-curr-status': data.status }]} innerText='Delete' onClick={deleteTicket} />
                          :
                          <></>
                      }
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <td>Report date</td>
                        <td>Reporter</td>
                        <td>Defendant</td>
                        <td>Id message</td>
                        <td>Message</td>
                        <td>Time message</td>
                        <td>Channel</td>
                        <td>Detail</td>
                        <td>Replies to id message</td>
                        <td>Replies to user</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{`${new Date(`${data.createdAt}`)}` || '-'}</td>
                        <td>{data.reporter || '-'}</td>
                        <td>{data.username || '-'}</td>
                        <td>{data.idBubble || '-'}</td>
                        <td>{data.message || '-'}</td>
                        <td>{`${new Date(`${data.timeMessage}`)}` || '-'}</td>
                        <td>{data.channel || '-'}</td>
                        <td>{data.details || '-'}</td>
                        <td>{data.replies[0] || '-'}</td>
                        <td>{data.replies[1] || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            })
            :
            <div className='empty'>
              No ticket found
            </div>
        }
      </Modal>
    </div>
  )
}

export default TicketManage