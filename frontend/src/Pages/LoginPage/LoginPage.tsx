import { useState, useEffect, ChangeEvent } from 'react'
import axios, { AxiosResponse } from 'axios'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import Input from '../../Components/Input/Input'
import Button from '../../Components/Button/Button'
import Form from '../../Components/Form/Form'
import Captcha from '../../Components/Captcha/Captcha'
import CaptchaStatus from '../../Components/Captcha/CaptchaStatus'
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
  const [resultCaptcha, setResultCaptcha] = useState<boolean>(false)
  const [event, setEvent] = useState<React.MouseEvent | React.TouchEvent | null>(null)

  const [captcha, setCaptcha] = useState<string>('')
  const [reNewCaptcha, setReNewCaptcha] = useState<boolean>(false)
  const [statusVerfied, setStatusVerified] = useState<string>('')
  const [inputUsername, setInputUsername] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')
  const [inputCaptcha, setInputCaptcha] = useState<string>('')
  const [isCanvas, setIsCanvas] = useState<HTMLCanvasElement | null>(null)

  const [usernameValidatedChecked, setUsernameValidatedChecked] = useState<boolean>(false)
  const [passwordValidatedChecked, setPasswordValidatedChecked] = useState<boolean>(false)

  const [stayLoggedIn, setStayLoggedIn] = useState<[string, boolean]>(['', false])

  const navigate = useNavigate()

  const pattern = new RegExp(/\s+|\b^(?:.{1,2})$\b|(?:.{16,})|(?:\W{2,})|\b(\W.*?\W)\b|\b(true|false|null|undefined)\b/gi)

  const resetState = () => {
    setInputUsername('')
    setInputPassword('')
    setInputCaptcha('')
    setResultCaptcha(false)
    setStatusVerified('')
    setChecking(false)
  }

  const handleLogin = async (): Promise<void> => {
    if (resultCaptcha) {
      try {
        if (inputUsername.length < 3 || inputPassword.length < 3) {
          resetState()
          reCaptcha()
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
        reCaptcha()
      }
    }
  }

  const handleRegistration = async (): Promise<void> => {
    if (pattern.test(inputUsername) || /\s+/g.test(inputPassword)) {
      withReactContent(Swal).fire('Username or Password is wrong condition')
      resetState()
      reCaptcha()
      pattern.lastIndex = 0
    } else {
      if (resultCaptcha) {
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
                    reCaptcha()
                  })
                  .catch(err => {
                    withReactContent(Swal).fire({
                      title: 'Registration Error try again',
                      text: err.messagge ?? err.response.data.error
                    })
                    resetState()
                    reCaptcha()
                  })
              } catch (error) {
                console.error('Error:', error)
              }
            } else {
              resetState()
              reCaptcha()
            }
          })
      }
    }
  }


  const verifyCaptcha = async (e: React.MouseEvent | React.TouchEvent) => {
    setEvent(e)
    e.preventDefault()
    try {
      await axios.get(`${server}/general/verifyCaptcha`,
        {
          headers: {
            inputcaptcha: inputCaptcha
          },
          withCredentials: true
        }
      )
        .then(res => {
          if (res.data.verified) {
            setStatusVerified('correct')
            setChecking(true)
            setResultCaptcha(true)
          }
        })
    } catch (err: any) {
      console.error(err)
      setStatusVerified('incorrect')
      reCaptcha()
    }
  }

  const reCaptcha = (): void => {
    // Add event listener for reload button
    speechSynthesis.cancel()
    setInputCaptcha('')
    setReNewCaptcha(true)
  }

  const readCaptcha = (): void => {
    if (isCanvas) {
      const altText: string | null = isCanvas.getAttribute('alt')
      const text: Array<string> = altText ? altText.split('') : []

      // initials
      let caseType: string = 'lowercase'
      let isUnicode: boolean = false

      text.forEach(c => {
        isUnicode = false || /[-&+_=?]/g.test(c)

        if (!isUnicode && c.toUpperCase().match(c) && isNaN(Number(c))) {
          caseType = 'uppercase'
        }

        // unicode
        if (isUnicode) {
          switch (c) {
            case '&': c = 'ampersand'
              break
            case '+': c = 'plus sign'
              break
            case '-': c = 'minus sign'
              break
            case '_': c = 'underscore'
              break
            case '=': c = 'equal sign'
              break
            case '?': c = 'question sign'
              break
          }
        }

        // Create a new SpeechSynthesisUtterance object with the text
        const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance(`${c} ${isNaN(Number(c)) && !isUnicode ? caseType : ''}`)
        // utterance.rate = 0.7

        // Use the speech synthesis API to speak the text
        speechSynthesis.speak(utterance)

        caseType = 'lowercase'
        isUnicode = false
      })
    }
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

    const genCaptcha = async (): Promise<void> => {
      try {
        const response: AxiosResponse = await axios.get(`${server}/general/gen`,
          { withCredentials: true }
        )
        if (response.data.state.isLoggedIn && response.data.state.username === inputUsername) {
          setStayLoggedIn([response.data.state.username, response.data.state.isLoggedIn])
        } else { 
          setCaptcha(await response.data.captcha)
        }
      } catch (err: any) {
        console.log(err.response.data.error)
        withReactContent(Swal).fire({
          title: err.response.data.error
        })
      }
    }
    genCaptcha()

    if (reNewCaptcha) {
      setReNewCaptcha(false)
    }

  }, [reNewCaptcha])

  useEffect(() => {
    window.history.pushState(null, '')
    if (event) {
      setEvent(null)

      if (inputUsername.length < 3 || inputPassword.length < 3) {
        withReactContent(Swal).fire('Username and Password should be at least 3 characters')
        resetState()
        reCaptcha()
        return
      }

      const eventName: string = (event.target as HTMLButtonElement).name
      if (eventName === 'login') {
        handleLogin()
      } else if (eventName === 'regis') {
        handleRegistration()
      }
    }
  }, [resultCaptcha])

  useEffect(() => {
    if (stayLoggedIn[1]) {
      navigate(`/lomwong/${stayLoggedIn[0]}/lobby`)
    }
  }, [stayLoggedIn])

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
              <Form action='#' method='POST' className='form p-15 p-md-20' id='loginForm' head='LomWongChat' headClass='titleHead' subHead='Login' subHeadClass='subHead' target='_self' autoComplete='on'>
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
                <Captcha
                  captcha={captcha}
                  setIsCanvas={setIsCanvas}
                  setStatusVerified={setStatusVerified}
                  value={inputCaptcha}
                  reNewCaptcha={reNewCaptcha}
                  setReNewCaptcha={setReNewCaptcha}
                  setInputCaptcha={setInputCaptcha}
                  inputCaptcha={inputCaptcha}
                  reCaptcha={reCaptcha}
                  readCaptcha={readCaptcha}
                  setStayLoggedIn={setStayLoggedIn}
                />
                <CaptchaStatus resultVerified={statusVerfied} />
                <div className='buttonWrapper d-block d-md-flex'>
                  {
                    <>
                      {
                        checking ?
                          <Button type='button' name='checking' id='checkingBtn' className='btn checkingBtn formBtn mb-10 mb-md-0' innerText='checking' disabled={true} />
                          :
                          <>
                            <Button onClick={(e: React.MouseEvent | React.TouchEvent) => verifyCaptcha(e)} type='submit' value={inputCaptcha} name='login' id='loginBtn' className='btn loginBtn formBtn mb-10 mb-md-0' innerText='Login' />
                            <Button onClick={(e: React.MouseEvent | React.TouchEvent) => verifyCaptcha(e)} type='submit' value={inputCaptcha} name='regis' id='regisBtn' className='btn regisBtn formBtn mb-10 mb-md-0 ml-md-10' innerText='Register' />
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