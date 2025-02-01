import React from 'react'
import { TicketBubbleTypes } from '../../types'

interface Props {
  tickets: TicketBubbleTypes[]
  onClick: (e: React.MouseEvent | React.TouchEvent) => void
}

const ReportTicketItems = ({ tickets, onClick }: Props) => {
  return (
    <>
      {
        tickets && tickets.length > 0 ?
          tickets.map((data: TicketBubbleTypes, i: number) => {
            return (
              <div className='col-12 col-sm-6 col-lg-4' key={i} >
                <div className='ticketItem' data-ticket={data.code} onClick={(e: React.MouseEvent | React.TouchEvent) => onClick(e)}>
                  <div className='collapsibleSwitch'>
                    <h3 className='ticketSN'><span className={`reportStatus ${data.status}`}>{data.status}</span>{data.code}</h3>
                    <div>{data.reporter}</div>
                    <i className='fa fa-angle-down collapsibleBtn'></i>
                  </div>
                  <div className='contentTicket'>
                    <div className='contentData'><b>Report date:&nbsp;</b>{`${new Date(`${data.createdAt}`)}` || '-'}</div>
                    <div className='contentData'><b>Reporter:&nbsp;</b>{data.reporter || '-'}</div>
                    <div className='contentData'><b>Id message:&nbsp;</b>{data.idBubble || '-'}</div>
                    <div className='contentData'><b>Message:&nbsp;</b>{data.message || '-'}</div>
                    <div className='contentData'><b>Time message:&nbsp;</b>{`${new Date(`${data.timeMessage}`)}` || '-'}</div>
                    <div className='contentData'><b>Channel:&nbsp;</b>{data.channel || '-'}</div>
                    <div className='contentData'><b>Detail:&nbsp;</b>{data.details || '-'}</div>
                    <div className='contentData'><b>Replies to id message:&nbsp;</b>{data.replies[0] || '-'}</div>
                    <div className='contentData'><b>Replies to user:&nbsp;</b>{data.replies[1] || '-'}</div>
                  </div>
                </div>
              </div>
            )
          })
          :
          <div className='col-12'>
            <div className='empty'>No ticket report</div>
          </div>
      }
    </>
  )
}

export default ReportTicketItems