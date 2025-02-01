import React from 'react'
import './dist/Comment.css'
import LikeDisLikeBtn from '../LikeDisLikeBtn/LikeDisLikeBtn'
import DOMPurify from 'dompurify'
import { Link } from 'react-router-dom'

interface props {
	children: string
	sender: string
	timestamp: string
	style?: { [key: string]: number | string }
	image?: string | null
	server: string
}

const Comment = ({ children, sender, timestamp, style, image, server }: props) => {

	const HtmlRenderer = ({ children }: { children: string }) => {
		const sanitizedHtml = DOMPurify.sanitize(children)
		return <pre style={{ whiteSpace: 'break-spaces' }} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
	}

	return (
		<div className='commentWrapper'>
			<div
				className='message'
				style={style ? { fontSize: style!.fontSize + 'em', lineHeight: style!.lineHeight + 'px' } : {}}
			>
				<HtmlRenderer children={children.replace('"', '')} />
			</div>
			{
				image && image ?
					<div className='attachImageWrapper'>
						<img src={`http://localhost:8080/${image}`} className='d-block attachImage' alt='attachImage'></img>
						<Link to={`http://localhost:8080/${image}`} target='_blank' className='clickActualSizeBtn'>click to open actual size</Link>
					</div>
					:
					<></>
			}
			<div className='sender'>
				<LikeDisLikeBtn />
				<div className='senderTimestamp'>
					<div className='senderName'>{sender}</div>
					<div className='senderTime'>{new Date(timestamp).toLocaleString()}</div>
				</div>
			</div>
		</div>
	)
}

export default Comment