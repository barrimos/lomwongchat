import { useState, useEffect, ChangeEvent } from 'react'
import axios, { AxiosResponse } from 'axios'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import Input from '../../Components/Input/Input'
import Button from '../../Components/Button/Button'
import Form from '../../Components/Form/Form'
import Loader from '../../Components/Loader/Loader'
import './dist/LoginPage.css'

import { getInputValue } from '../../utils/getInputValue'
import { VerifiedTypes } from '../../types'

const isProduction = process.env.REACT_APP_NODE_ENV === 'production'
const protocol = isProduction ? 'https://' : 'http://'
const port = isProduction ? '' : ':8080'
const url = isProduction ? process.env.REACT_APP_NODE_API : 'localhost'
const server = `${protocol}${url}${port}`

const LoginPage = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(false)
  const [toggleShowHide, setToggleShowHide] = useState<boolean>(false)

  const [inputUsername, setInputUsername] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')

  const [usernameValidatedChecked, setUsernameValidatedChecked] = useState<boolean>(false)
  const [passwordValidatedChecked, setPasswordValidatedChecked] = useState<boolean>(false)

  const navigate = useNavigate()

  const pattern = new RegExp(/\s+|\b^(?:.{1,2})$\b|(?:.{16,})|(?:\W{2,})|\b(\W.*?\W)\b|\b(true|false|null|undefined)\b/gi)

  const resetState = () => {
    setInputUsername('')
    setInputPassword('')
    setChecking(false)
  }

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>): Promise<void> => {
    // disable multiple click button login
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement;
    button.disabled = true // disable the button to prevent multiple clicks

    try {
      if (inputUsername.length < 3 || inputPassword.length < 3) {
        resetState()
        throw Error('Username and Password should be at least 3 characters')
      }

      // middleware trackSession > isMatch
      const verified: { data: VerifiedTypes } = await axios.get(`${server}/user/login`,
        {
          headers: {
            username: inputUsername,
            password: inputPassword,
            access: 'lomwong'
          },
          withCredentials: true
        }
      )

      if (verified.data.valid) {
        const checkStatus = await axios.post(`${server}/user/status/check`, {},
          {
            headers: {
              username: inputUsername,
              access: 'lomwong'
            },
            withCredentials: true
          }
        )

        if (checkStatus.data.valid) {
          window.history.pushState(null, '')

          // normal status
          sessionStorage.setItem('username', inputUsername)

          setTimeout(() => {
            setIsLoading(true)
            navigate(`lomwong/${inputUsername}/lobby`)
          }, 1000)
        }
      }
    } catch (err: any) {
      // if you was banned
      if (err.response && err.response.data.banned) {
        withReactContent(Swal).fire({
          icon: 'warning',
          title: err.response.data.error,
          showConfirmButton: true,
          confirmButtonText: 'Open to Admin',
          showCloseButton: true,
          footer: `<a href="#">Why do I have this issue?</a>`,
          showLoaderOnConfirm: true,
        }).then(async result => {
          if (result.isConfirmed) {
            // if issue was opened
            if (err.response.data.issueStatus) {
              resetState()
              setIsLoading(true)
              setTimeout(() => {
                navigate(`/disputeresolution/${err.response.data.issue}/${inputUsername}`)
              }, 100)
            } else {
              withReactContent(Swal).fire({
                title: 'Create topic',
                html: `
                  <input type="text" class="swalInput" id="swalTitle" placeholder="Title 25 characters">
                  <textarea class="swalInput" id="swalDetail" value='' placeholder="Short details 60 characters"></textarea>
                `,
                showCancelButton: true,
                preConfirm: () => {
                  const title: string = (document.getElementById('swalTitle') as HTMLInputElement).value
                  const detail: string = (document.getElementById('swalDetail') as HTMLTextAreaElement).value
                  if (!title || !detail) {
                    Swal.showValidationMessage('Both fields are required')
                  }
                  if (title.length > 25) {
                    Swal.showValidationMessage('Ttile cannot exceed 25 characters!')
                  }
                  if (detail.length > 60) {
                    Swal.showValidationMessage('Detail cannot exceed 60 characters!')
                  }
                  return { title, detail }
                },
              }).then(async res => {
                if (res.isConfirmed) {
                  try {
                    // send request to open issue
                    const result: AxiosResponse = await axios.post(`${server}/disputeResolution/open`,
                      {
                        title: res.value.title,
                        detail: res.value.detail
                      },
                      {
                        headers: {
                          username: inputUsername,
                          code: err.response.data.issue
                        },
                        withCredentials: true
                      }
                    )

                    if (result.data.valid) {
                      navigate(`/disputeresolution/${err.response.data.issue}/${inputUsername}`)
                    }
                  } catch (err: any) {
                    console.error(err.response.data.error)
                  }
                }
              })
            }
          }
          button.disabled = false
        })
      } else {
        withReactContent(Swal).fire({
          icon: 'error',
          title: err.response ? err.response.data.error : err.message ?? 'Authentication is error',
          showCloseButton: true
        })
      }
      // reset all state
      setIsLoading(false)
      resetState()
      button.disabled = false
    }
  }

  const handleRegistration = async (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>): Promise<void> => {
    // disable multiple click button registration
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement;
    button.disabled = true // disable the button to prevent multiple clicks

    if (pattern.test(inputUsername) || /\s+/g.test(inputPassword)) {
      withReactContent(Swal).fire('Username or Password is wrong condition')
      resetState()
      pattern.lastIndex = 0
    } else {
      withReactContent(Swal).fire({
        title: <i>Need to join ?</i>,
        showConfirmButton: true,
        showCancelButton: true
      })
        .then(async result => {
          if (result.isConfirmed) {
            try {
              await axios.post(`${server}/user/regisUsers`, { username: inputUsername, password: inputPassword }, { withCredentials: true })
                .then(res => {
                  withReactContent(Swal).fire({
                    title: 'Registration completed',
                    text: `log-in again with username ${res.data.user}`,
                    timerProgressBar: true,
                    timer: 2000,
                    showConfirmButton: true,
                  })
                  resetState()
                })
                .catch(err => {
                  withReactContent(Swal).fire({
                    title: 'Registration Error try again',
                    text: err.messagge ?? err.response.data.error
                  })
                  resetState()
                })
            } catch (error) {
              console.error('Error:', error)
            }
          } else {
            resetState()
          }
        })
    }
    button.disabled = false
  }

  useEffect(() => {
    const getSession = async () => {
      await axios.get(`${server}/general/session`, { withCredentials: true })
    }
    getSession()
    return () => {
      console.log('Session had set')
    }
  }, [])

  useEffect(() => {
    if (inputUsername.length >= 3) {
      setUsernameValidatedChecked(true)
    } else {
      setUsernameValidatedChecked(false)
    }
    if (inputPassword.length >= 3) {
      setPasswordValidatedChecked(true)
    } else {
      setPasswordValidatedChecked(false)
    }
  }, [inputUsername, inputPassword])

  return (
    <>
      {
        isLoading ?
          <Loader />
          :
          <div id='loginPageBody' className='d-flex justify-content-center align-items-center w-100'>
            {
              <Form action='#' method='POST' className='form p-15 p-md-20' id='loginForm' head='LomWongChat' headClass='titleHead' subHead='Keep the chat on fire!' subHeadClass='subHead' target='_self' autoComplete='on'>
                <div className='inputWrapper'>
                  <Input
                    onChange={(e: ChangeEvent<HTMLInputElement>) => getInputValue(e, setInputUsername, 15)}
                    type='text'
                    name='inpUsername'
                    value={inputUsername || ''} min='3' max='15'
                    id='inpUsername'
                    className='inp inpUsername posRe'
                    placeHolder=''
                    useLabel={true}
                    labelText='Username'
                    labelId='labelUsername'
                    labelClass='labelUsername'
                    required={true}
                  />
                  {
                    usernameValidatedChecked ?
                      <i className='fa fa-check-circle validatedChecked'></i>
                      :
                      <></>
                  }
                </div>
                <div className='inputWrapper'>
                  <Input
                    onChange={(e: ChangeEvent<HTMLInputElement>) => getInputValue(e, setInputPassword, 20)}
                    type={toggleShowHide ? 'text' : 'password'}
                    name='inpPassword'
                    value={inputPassword || ''}
                    id='inpPassword'
                    className='inp inpPassword'
                    placeHolder=''
                    useLabel={true}
                    labelText='Password'
                    labelId='labelPassword'
                    labelClass='labelPassword'
                    useShowHide={[true, setToggleShowHide]}
                    required={true}
                  />
                  {
                    passwordValidatedChecked ?
                      <i className='fa fa-check-circle passValidatedChecked'></i>
                      :
                      <></>
                  }
                </div>
                <div className='buttonWrapper d-block'>
                  {
                    <>
                      {
                        checking ?
                          <Button type='button' name='checking' id='checkingBtn' className='btn checkingBtn formBtn mb-10 mb-md-0' innerText='checking' disabled={true} />
                          :
                          <>
                            <Button
                              onClick={handleLogin}
                              type='submit'
                              name='login'
                              id='loginBtn'
                              className='btn loginBtn formBtn mb-10 mb-md-0'
                              innerText='Login'
                            />
                            <Button
                              onClick={handleRegistration}
                              type='submit'
                              name='regis'
                              id='regisBtn'
                              className='btn regisBtn formBtn mb-10 mb-md-0'
                              innerText='Not a member ? Register Now'
                            />
                          </>
                      }
                    </>
                  }
                </div>
              </Form>
            }
          </div>
      }
    </>
  )
}

export default LoginPage