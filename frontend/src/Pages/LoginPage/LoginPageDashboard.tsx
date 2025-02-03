import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Switch from '../../Components/Switch/Switch'
import Form from '../../Components/Form/Form'
import Input from '../../Components/Input/Input'
import Button from '../../Components/Button/Button'
import { getInputValue } from '../../utils/getInputValue'
import axios, { AxiosResponse } from 'axios'
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'
import './dist/LoginPageDashboard.css'

const isProduction = process.env.REACT_APP_NODE_ENV === 'production'
const protocol = isProduction ? 'https://api.' : 'http://'
const port = isProduction ? '' : ':8080'
const server = `${protocol}${window.location.hostname}${port}`

const LoginPageDashboard = () => {
	const navigate = useNavigate()
	const initialRef = useRef(false)

	const [inpSysUsername, setInpSysUsername] = useState<string>('')
	const [inpSysPassword, setInpSysPassword] = useState<string>('')
	const [themeSwitch, setThemeSwitch] = useState<string>('light')

	const [attempRemains, setAttempRemains] = useState<number>(0)

	const reset = (): void => {
		setInpSysUsername('')
		setInpSysPassword('')
		sessionStorage.clear()
		initialRef.current = false
	}

	const handlerVerifyAccess = async (): Promise<void> => {
		try {
			if (attempRemains! <= 0) {
				reset()
				setAttempRemains(0)
				throw Error('Session locked')
			}

			if (inpSysUsername.length < 3 || inpSysPassword.length < 3) {
				reset()
				throw Error('Username or Password invalid')
			}

			// authenticate login
			await axios.get(`${server}/user/login`,
				{
					headers: {
						username: inpSysUsername,
						password: inpSysPassword,
						access: 'adsysop'
					},
					withCredentials: true
				}
			)
				.then((res: AxiosResponse) => {
					if (res.data.valid) {
						// then setting config
						sessionStorage.setItem('username', inpSysUsername)
						// all passes wait 1 sec to re-link to dashboard page
						setTimeout(() => {
							navigate(`/adsysop/${inpSysUsername}`)
						}, 1000)
					} else {

					}
				})
				.catch(err => {
					reset()
					console.error(err)
					withReactContent(Swal).fire({
						title: err.response.data.error
					})
					setAttempRemains(err.response.data.remains)
				})
		} catch (err: any) {
			withReactContent(Swal).fire({
				title: err.message ?? err.name ?? err.response.data.error ?? err
			})
		}
	}

	const loadRemain = async (): Promise<void> => {
		try {
			const response: { data: { remains: number } } = await axios.get(`${server}/general/getRemainsAttempts`,
				{
					headers: {
						username: inpSysUsername,
						access: 'adsysop'
					},
					withCredentials: true
				}
			)
			setAttempRemains(response.data.remains)
		} catch (err: any) {
			setAttempRemains(err.response.data.remains)
		}
	}

	useEffect(() => {
		loadRemain()
		return () => {
			console.log('Reamining loaded')
		}
	}, [])

	useEffect(() => {
		document.body.style.transition = 'background-color ease .3s'
		if (themeSwitch === '') {
			document.body.style.background = '#333'
		} else if (themeSwitch === 'light') {
			document.body.style.background = '#ddd'
		}
	}, [themeSwitch])

	return (
		<div className='container'>
			<div className='row justify-content-center align-items-center h-svh-100'>
				<div className='col-12 col-md-6 col-lg-5'>
					<Switch name='themeDarkLight' id='themeDarkLight' className='themeDarkLight' offValue='light' onValue='dark' setThemeSwitch={setThemeSwitch} />
					<div id='formAccess' className={themeSwitch}>
						<Form action='#' method='POST' className='loginFormAso p-15 p-md-20' id='loginFormAso' head='ASO' headClass='titleHead' subHead='Administrator system operation' subHeadClass='subHead' target='_self' autoComplete='off'>
							<Input type='text' name='sysUsername' id='sysUsername' className='sysInput' onChange={e => getInputValue(e, setInpSysUsername)} placeHolder='Username' value={inpSysUsername} />
							<div className='inpPassAso'>
								<Input type='password' name='sysPassword' id='sysPassword' className='sysInput' onChange={e => getInputValue(e, setInpSysPassword)} placeHolder='Password' value={inpSysPassword} />
							</div>
							<div className='d-flex justify-content-between align-items-center'>
								<Button
									type='button'
									name='submitAso'
									id='submitAso'
									className='submitAso'
									innerText='Login'
									disabled={inpSysUsername.length < 3 || inpSysPassword.length < 3}
									onClick={handlerVerifyAccess}
								/>
								<div id='attempRemains'>
									<span data-remain={attempRemains}>{attempRemains}</span>
									<span>/3</span>
								</div>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default LoginPageDashboard