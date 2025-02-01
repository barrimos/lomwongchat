import React from 'react'

interface Props {
  yourName: string | undefined
  usersOnline: string[]
  openDM: (e: React.MouseEvent | React.TouchEvent) => void
}

const UsersList = ({ yourName, usersOnline, openDM }: Props): JSX.Element => {
  return (
    <>
      <li className='listsUsers you'>{yourName} (You)</li>
      {
        usersOnline && usersOnline.length > 0 ?
          usersOnline.map((user: string, i: number): JSX.Element => {
            return (
              <li
                key={i}
                className='listsUsers'
                data-receiver={user}
                data-is-open={false}
                onClick={openDM}
              >
                <span>{user}</span>
                {
                  yourName !== user ?
                    <i className='fa fa-circle-o' data-is-online={true}></i>
                    :
                    <></>
                }
              </li>
            )
          })
          :
          <span className='empty'>No one else</span>
      }
    </>
  )
}

export default UsersList