import { Dispatch, SetStateAction } from "react"
import ContextItem from "./ContextItem"

interface Props {
  message: string
  username: string | undefined
  idBubble: string
  unixTime: number
  setContextClick: Dispatch<SetStateAction<boolean>>
  copyMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string) => void
  replyMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string) => void
  reportMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string, ...replies: string[]) => void
  replyIdBubble: string | undefined
  replyTo: string | undefined
}

const ContextMenu = ({ message, username, idBubble, unixTime, setContextClick, copyMessage, replyMessage, reportMessage, replyIdBubble, replyTo }: Props): JSX.Element => {

  const handleMenuContext = (e: any): void => {

    const contextName: string | undefined = (e.target as HTMLDivElement).dataset.menuContext
    if (contextName) {
      setContextClick(true)
    }

    if (contextName === 'copy') {
      copyMessage(e, message)
    } else if (contextName === 'reply') {
      replyMessage(e, message)
    } else if (contextName === 'report') {
      reportMessage(e, message, replyIdBubble!, replyTo!)
    }
  }

  return (
    <div id='contextMenuWrapper' data-time={unixTime}>
      {
        ['copy', 'reply', 'report'].map((name: string, i: number) => {
          return (
            <ContextItem key={i} username={username!} idBubble={idBubble} contextName={name} handleMenuContext={handleMenuContext} />
          )
        })
      }
    </div>
  )
}

export default ContextMenu
