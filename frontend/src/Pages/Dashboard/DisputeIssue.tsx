import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Modal from '../../Components/Modal/Modal'
import Input from '../../Components/Input/Input'
import { getInputValue } from '../../utils/getInputValue'
import { Link } from 'react-router-dom'
import Button from '../../Components/Button/Button'

interface props {
	issueData: { [key: string]: string }[]
	onClick: (e: React.MouseEvent | React.TouchEvent, refSetState?: Dispatch<SetStateAction<boolean>>) => void
	yourName: string | undefined
	server: string
	handlerCloseDispute: (e: React.MouseEvent | React.TouchEvent) => void
	className: string
	title: string
	subtitle: string
	draggable: boolean
	isMobileSupported: boolean
}

const DisputeIssue = (props: props) => {
	const [searchUser, setSearchUser] = useState<string>('')
	const [disputeIssueData, setDisputeIssueData] = useState<{ [key: string]: string | { [key: string]: string } }[]>(props.issueData)

	const handleSearchUsernameIssue = (uname: string): void => {
		if (uname.length > 0) {
			const result = disputeIssueData.filter(item => (item.username as string) === (uname))
			if (result.length > 0) {
				setDisputeIssueData(result)
			} else {
				setDisputeIssueData([])
			}
		} else {
			setDisputeIssueData(props.issueData)
		}
	}

	useEffect(() => {
		handleSearchUsernameIssue(searchUser)
		return () => {
			handleSearchUsernameIssue(searchUser)
		}
	}, [searchUser])

	useEffect(() => {
		setDisputeIssueData(props.issueData)
	}, [props.issueData])

	return (
		<div className='modalManageWrapper'>
			<Modal handlerCloseModal={props.onClick} className={props.className} title={props.title} subtitle={props.subtitle}>
				<Input type='text' name='searchReports' id='searchReports' className='searchModalManage' value={searchUser} placeHolder='Search username' onChange={e => getInputValue(e, setSearchUser)} />
				{
					disputeIssueData && disputeIssueData.length > 0 ?
						disputeIssueData.map((item: { [key: string]: string | { [key: string]: string } }, i: number) => {
							const username: string = typeof item.username === 'string' ? item.username : ''
							const { code, status, requestClose }: { [key: string]: string | boolean } = typeof item.issue === 'object' ? item.issue : {}
							return (
								<div className='issueWrapper col-6 col-md-4 col-lg-3' key={i} data-issue={i}>
									<div className='requestClose'>{requestClose ? 'Request close' : 'On going'}</div>
									<Link target='_blank' to={`/disputeresolution/${code}/${props.yourName}/${username}`} className='linkDispute'>
										<div className='issueName'>{username}</div>
									</Link>
									<Button
										type='button'
										name='closeIssueBtn'
										value={i}
										onClick={props.handlerCloseDispute}
										className={`closeIssueBtn ${props.isMobileSupported ? 'mobileSupport' : ''}`}
										useIconFA={true}
										innerText='fa fa-close'
										attr={[{ 'data-status': status, 'data-user': username, 'data-code': code }]}
									/>
								</div>
							)
						})
						:
						<div className='empty'>
							No issue found
						</div>
				}
			</Modal>
		</div>
	)
}

export default DisputeIssue