import React, { ChangeEvent, useEffect, useState } from 'react'
import './dist/DisputeResolution.css'
import { ErrorResponse, Params, useNavigate, useParams } from 'react-router-dom'
import Loader from '../../Components/Loader/Loader'
import TextArea from '../../Components/TextArea/TextArea'
import Button from '../../Components/Button/Button'
import Comment from '../../Components/Comment/Comment'
import axios, { AxiosResponse } from 'axios'

import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'
import Input from '../../Components/Input/Input'

const isProduction = process.env.REACT_APP_NODE_ENV === 'production'
const protocol = isProduction ? 'https://api.' : 'http://'
const port = isProduction ? '' : ':8080'
const server = `${protocol}${window.location.hostname}${port}`

const patternUrl: RegExp = new RegExp(/https?:\/\/[a-z0-9A-Z]+\.[a-zA-Z]{2,}(\/[a-z0-9A-Z]+)*(\/)*((\?|\&)([a-z0-9A-Z]+(\={1,}\w+)?))*/g)

const DisputeResolution = () => {
  const { code, username, user }: Readonly<Params<string>> = useParams()
  const navigate = useNavigate()

  const [isVerified, setIsVerified] = useState<boolean>(false)

  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isAllowComment, setIsAllowComment] = useState<boolean>(false)
  const [topic, setTopic] = useState<string[] | []>([])
  const [fetchComments, setFetchComments] = useState<string[] | []>([])

  const [inputComment, setInputComment] = useState<string>('')
  const [inputCommentCount, setInputCommentCount] = useState<number>(0)

  const [isAttachOpen, setIsAttachOpen] = useState<boolean>(false)

  const [currTypeAttach, setCurrTypeAttach] = useState<'image' | 'neutral'>('neutral')
  const [image, setImage] = useState<{ file: File | null }>({ file: null })
  const [isUploadError, setIsUploadError] = useState<[boolean, string]>([false, ''])

  const [sizeText, setSizeText] = useState<number>(1) // em
  const [requested, setRequested] = useState<boolean>(false)

  const sizingTextStyle = {
    fontSize: sizeText,
    lineHeight: sizeText > 1 ? (sizeText * 23) + sizeText : 23,
  }

  const MAX_INPUT: number = 500
  const IMG: { [key: string]: string | number } = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    width: 2000,
    height: 1000,
    size: 2 * 1_048_576
  }

  const handlerFetchComment = async (): Promise<void> => {
    const verified = await axios.get(`${server}/disputeResolution/fetchComment/${code}/${username}/${user}`,
      {
        headers: {
          username: username
        },
        withCredentials: true
      }
    )
    try {
      if (verified.data.valid) {
        setRequested(verified.data.requestClose)
        setTopic(verified.data.comments[0])
        setFetchComments(verified.data.comments.splice(1,))
        setIsAllowComment(true)
      }
    } catch (err: any) {
      setTopic([err.response.data.topic])
      setIsAllowComment(false)
    }
  }

  const handleSizingText = (e: React.MouseEvent | React.TouchEvent): void => {
    setSizeText(prev => {
      const newSize: number = prev += (0.5 * Number((e.target as HTMLButtonElement).value))
      return newSize <= 1 ? 1 : newSize > 2 ? 2 : newSize
    })
  }

  const handlerInputComment = (e: ChangeEvent): void => {
    const inputValue: string = (e.target as HTMLInputElement).value
    if (inputValue.length > MAX_INPUT) return
    setInputComment(inputValue)
    setInputCommentCount(inputValue.length)
  }

  const handlerAttachLinkToggle = (e: React.MouseEvent | React.TouchEvent): void => {
    const newState: any = (e.currentTarget as HTMLButtonElement).value
    if (currTypeAttach === newState) {
      setIsAttachOpen(prev => !prev)
      setCurrTypeAttach('neutral')
    } else {
      setCurrTypeAttach(newState)
      setIsAttachOpen(true)
    }
  }

  const handlerInsertAttachImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    const reader = new FileReader()
    if (!file) return

    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        if (img.width > (IMG['width'] as number) || img.height > (IMG['height'] as number)) {
          resetUploadError(true, 'Limit (w) 2000 x (h) 1000 px')
        } else if (file?.size! > (IMG['size'] as number)) {
          resetUploadError(true, 'File is too large, Limit 2 MB')
        } else {
          const fileName: string | null = event.target.files ? event.target.files[0]?.name : 'Choose a file...'
          document.getElementById('labelUploadImage')!.textContent = fileName
          setImage({ file })
        }
      }
      img.src = reader.result as string
    }

    reader.readAsDataURL(file!)
  }

  const clearImageUpload = () => {
    // Clear the file input
    const fileInput = document.getElementById('attachmentInput') as HTMLInputElement
    if (fileInput) {
      fileInput.value = '' // Clear the file input
    }
    document.getElementById('labelUploadImage')!.textContent = 'Choose Image ...'
    setImage({ file: null }) // Clear the state
  }

  const resetUploadError = (err: boolean, errorMessage: string): void => {
    setIsUploadError([err, errorMessage])

    clearImageUpload()

    // reset
    setTimeout(() => {
      setIsUploadError([!err, ''])
    }, 4000)
  }

  const handlerSubmitMessage = async (e: React.MouseEvent | React.TouchEvent): Promise<void> => {
    e.preventDefault()

    const outputString: string = inputComment.replace(patternUrl, (url: string) => `<a href="${url}" class="urlComment" target="_blank">${url}</a>`)
    const unixTime: number = new Date().getTime()

    let formData: FormData = new FormData()
    if (image && image.file) {
      formData.append('file', image.file)

      if (image.file.size > 5 * 1_048_576) {
        resetUploadError(true, `File size ${Math.ceil((image.file.size / 1024) / 1024)}MB Expected less than 5MB`)
        return
      } else if (!IMG[image.file.type]) {
        resetUploadError(true, `File type ${image.file.type} not support`)
        return
      }
    }

    formData.append('comment', outputString)
    formData.append('username', username as string)
    formData.append('unixTime', `${unixTime}`)

    if (inputCommentCount < 1 && !formData) return

    // send to save into database
    await axios.post(`${server}/disputeResolution/postComment/${code}/${username}/${user}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          username: username
        },
        withCredentials: true
      }
    )
      .then(res => {
        if (res.data.valid) {
          // receive back from database
          setFetchComments((prev: string[]) => {
            const update: any = [...prev]
            if (res.data.path) {
              update.push([outputString, username!, unixTime, res.data.path])
            } else {
              update.push([outputString, username!, unixTime])
            }
            return update
          })
          setInputComment('')
          setInputCommentCount(0)
          clearImageUpload()
        }
      })
      .catch(err => {
        withReactContent(Swal).fire({
          title: err.response.data.error
        })
        if (err.response.data.requestClose) {
          setRequested(err.response.data.requestClose)
        }
      })
  }

  const handlerRequestClose = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!requested) {
      const elem: HTMLButtonElement = (e.currentTarget as HTMLButtonElement)
      withReactContent(Swal).fire({
        title: 'You need to close Issue ?',
        showCloseButton: true
      }).then(async res => {
        if (res.isConfirmed) {
          await axios.post(`${server}/disputeResolution/requestCloseIssue/${code}/${username}/${user}`, {},
            {
              headers: {
                username: username
              },
              withCredentials: true
            }
          )
            .then((res: AxiosResponse) => {
              withReactContent(Swal).fire({
                title: res.data.message,
                text: res.data.subTitle
              })
              setRequested((prev: boolean) => {
                elem.innerText = '✔'
                return !prev
              })
            })
            .catch((err: ErrorResponse) => {
              withReactContent(Swal).fire({
                title: err.data.error
              })
            })
        }
      })
    }
  }

  const handlerLogout = async (): Promise<void> => {
    await axios.delete(`${server}/user/logout`, {
      headers: {
        username: username,
      },
      withCredentials: true
    })
      .then(() => {
        navigate('/')
      })
  }

  useEffect(() => {
    // prevent to back this page after leave
    window.history.pushState(null, '')

    // check issue code is exist and verified
    // if not return to login page
    const checkVerify = async (): Promise<void> => {
      try {
        const verified: { data: { valid: boolean, message: string } } = await axios.get(`${server}/disputeResolution/${code}/${username}/${user}`,
          {
            headers: {
              username: username
            },
            withCredentials: true
          }
        )
        if (verified.data.valid && verified.data.message === 'Authorized') {
          setIsVerified(verified.data.valid)
          handlerLoad()
        }
      } catch (err: any) {
        withReactContent(Swal).fire({
          title: err.response.data.error,
          showConfirmButton: true,
          allowOutsideClick: true,
          preConfirm: () => {
            setIsVerified(false)
          }
        }).then(async res => {
          if (res.isConfirmed) {
            setTimeout(() => {
              navigate('/')
            }, 1000)
          }
        })
      }
    }

    const handlerLoad = () => {
      setIsLoading(false)
    }

    window.addEventListener('DOMContentLoaded', handlerLoad)
    checkVerify()

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener('load', handlerLoad)
    }
  }, [])

  useEffect(() => {
    if (isVerified) {
      handlerFetchComment()
    } else {
      // if not verified can't comment just fetch title and detail
      setIsAllowComment(false)
    }
  }, [isVerified])

  return (
    <>
      {
        isLoading && !isVerified ?
          <Loader />
          :
          <div className='container disputeResolution'>
            <div className='row'>
              <div className='col-12'>
                <div className='d-flex justify-content-between align-items-center'>
                  <h3 className='headDispute'>Dispute Resolution</h3>
                  <div className='headDisputeBtnWrapper'>
                    <Button
                      type='button'
                      name='incSizeTextBtn'
                      className='headDisputeBtn sizeTextBtn'
                      innerText='A+'
                      value={1}
                      onClick={handleSizingText}
                      attr={[{ 'aria-label': 'increase text' }]}
                    />
                    <Button
                      type='button'
                      name='dcsSizeTextBtn'
                      className='headDisputeBtn sizeTextBtn'
                      innerText='A-'
                      value={-1}
                      onClick={handleSizingText}
                      attr={[{ 'aria-label': 'decrease text' }]}
                    />
                    {
                      username === 'admin' ?
                        <></>
                        :
                        <Button
                          type='button'
                          name='homeBtn'
                          className='headDisputeBtn homeBtn'
                          useIconFA={true}
                          innerText='fa fa-power-off'
                          onClick={handlerLogout}
                        />
                    }
                  </div>
                </div>
              </div>
              <div className='col-12'>
                <div className='titleIssue'>
                  <h2 className='topic'>{topic[0]}</h2>
                  <div className='detailTopic'>{topic[1]}</div>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div className='sender'>Writter: {user ?? username}</div>
                    {
                      username === 'admin' ?
                        <></>
                        :
                        <>
                          {
                            !requested && !requested ?
                              <Button
                                type='button'
                                name='reqCloseBtn'
                                className={`reqCloseBtn ${requested ? 'requested' : ''}`}
                                innerText={requested ? '✔' : 'Request Close'}
                                onClick={handlerRequestClose}
                                attr={[{ 'data-request': requested }]}
                              />
                              :
                              <></>
                          }
                        </>
                    }
                  </div>
                </div>
              </div>
              <div className='col-12'>
                <div className='disputeComment'>
                  {
                    fetchComments && fetchComments.length > 0 ?
                      fetchComments.map((comment, i: number) => {
                        return (
                          <Comment
                            key={i}
                            sender={comment[1]}
                            timestamp={comment[2]}
                            style={sizingTextStyle}
                            image={comment[3]}
                            server={server}
                          >
                            {comment[0]}
                          </Comment>
                        )
                      })
                      :
                      <></>
                  }
                </div>
              </div>
              <div className='col-12'>
                <div id='commentingFormArea'>
                  {
                    isAllowComment && !requested ?
                      <>
                        <div className='inputCommentWrapper'>
                          <TextArea
                            resizer='vertical'
                            autoFocus={false}
                            id='inputCommentText'
                            className='inputCommentText'
                            onChange={handlerInputComment}
                            value={inputComment}
                            placeHolder='comment here'
                            style={sizingTextStyle}
                          />
                          <div className='inputCommentCount'>{inputCommentCount}/{MAX_INPUT}</div>
                        </div>
                        <div className={`attachmentWrapper ${isAttachOpen ? 'active' : ''} d-flex justify-content-start align-items-center`}>
                          {
                            isUploadError[0] ?
                              <div id='uploadError'>{isUploadError[1]}</div>
                              :
                              <></>
                          }
                          <Button
                            type='button'
                            name='attachImageBtn'
                            className='toggleAttachmentBtn'
                            useIconFA={true}
                            value='image'
                            innerText='fa fa-image'
                            onClick={handlerAttachLinkToggle}
                          />
                          <div className='uploadFileWrapper'>
                            <Input
                              type='file'
                              id='attachmentInput'
                              className={`attachmentInput ${currTypeAttach === 'image' ? 'p-6' : ''}`}
                              name='attachmentInput'
                              placeHolder=''
                              onChange={handlerInsertAttachImage}
                            />
                            <label htmlFor='attachmentInput' id='labelUploadImage'>Choose Image ...</label>
                          </div>
                          {
                            isUploadError[0] ?
                              <></>
                              :
                              <Button
                                type='button'
                                name='clearAttachFileBtn'
                                id='clearAttachFileBtn'
                                className={`clearAttachFileBtn ${isAttachOpen ? 'active' : ''}`}
                                innerText='Clear'
                                onClick={clearImageUpload}
                              />
                          }
                        </div>
                        <Button
                          type='button'
                          name='sendMessageBtn'
                          className='sendMessageBtn'
                          innerText=''
                          onClick={handlerSubmitMessage}
                        >
                          <i className='fa fa-plus-square'></i>
                          <span>Send message</span>
                        </Button>
                      </>
                      :
                      <></>
                  }
                </div>
              </div>
            </div>
          </div>
      }
    </>

  )
}

export default DisputeResolution