import Button from '../Button/Button'

interface Props {
  replyBubble: { username: string, idBubble: string, message: string } | undefined
  closereplyForm: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
}

const ReplyForm = ({ replyBubble, closereplyForm }: Props) => {
  return (
    <div id='replyForm' data-reply-to={replyBubble?.idBubble}>
      <span className='replyFormItem username'>{replyBubble?.username}</span>
      <span className='replyFormItem message'>{replyBubble?.message.slice(0, 25) + '...'}</span>
      <Button type='button' name='closeReplyFormBtn' id='closeReplyFormBtn' className='closeReplyFormBtn' innerText='fa fa-close' useIconFA={true} onClick={closereplyForm} />
    </div>
  )
}

export default ReplyForm