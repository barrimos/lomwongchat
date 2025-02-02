import React, { useEffect } from 'react'
import Button from '../Button/Button'
import Input from '../Input/Input'
import { CaptchaTypes } from '../../types'
import { getInputValue } from '../../utils/getInputValue'
import axios, { AxiosResponse } from 'axios'

const protocol = process.env.REACT_APP_NODE_ENV === 'production' ? 'https://' : 'http://'
const port = process.env.REACT_APP_NODE_ENV === 'production' ? '' : ':8080'
const server = `${protocol}${window.location.hostname}${port}`

const Captcha = ({
  value,
  useLabel,
  reNewCaptcha,
  inputCaptcha,
  setIsCanvas,
  setInputCaptcha,
  setReNewCaptcha,
  reCaptcha,
  readCaptcha,
  setStatusVerified,
  setStayLoggedIn
}: CaptchaTypes): JSX.Element => {

  const handleStatusOnFocus = (e: any) => {
    setStatusVerified('')
  }

  const drawCaptcha = (text: string, canvas: HTMLCanvasElement) => {
    let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#f3f3f3'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      addNoise(canvas, ctx)
      ctx.fillStyle = '#fff'
      ctx.font = '35px Arial'

      // Calculate the width of text and start position
      const textWidth: number = ctx.measureText(text).width
      const startX: number = (canvas.width - textWidth) / 5

      // Adding rotation and distortion
      for (let i: number = 0; i < text.length; i++) {
        ctx.save()
        // Addjust startX for each char
        ctx.translate(startX + i * 30, 30)
        ctx.rotate((Math.random() - 0.5) * 0.4)
        ctx.fillText(text[i], 0, 0)
        ctx.restore()
      }

      canvas.setAttribute('alt', text)
    }
  }

  const addNoise = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imageData: ImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    for (let i: number = 0; i < pixels.length; i += 1) {
      // Random noise color
      let color: number = (Math.random() > 0.3) ? 220 : 0
      pixels[i] = pixels[i + 1] = pixels[i + 5] = color
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const genCaptcha = async (canvas: HTMLCanvasElement): Promise<void> => {
    try {
      const response: AxiosResponse = await axios.get(`${server}/general/gen`,
        { withCredentials: true }
      )
      if (response.data.state.isLoggedIn) {
        setStayLoggedIn([response.data.state.username, response.data.state.isLoggedIn])
      }

      const captcha = await response.data.captcha

      drawCaptcha(captcha, canvas)
      setIsCanvas(canvas)
    } catch (err: any) {
      console.error(err)
      throw Error(err)
    }
  }

  useEffect(() => {
    genCaptcha(document.getElementById('captchaText') as HTMLCanvasElement)
  }, [])

  useEffect(() => {
    if (reNewCaptcha) {
      genCaptcha(document.getElementById('captchaText') as HTMLCanvasElement)
      setReNewCaptcha(false)
    }
  }, [reNewCaptcha])


  return (
    <>
      {useLabel ?
        <label htmlFor='captcha'>Enter CAPTCHA</label>
        :
        ''
      }
      <div className='captchaWrapper'>
        <canvas id='captchaText' height='40'></canvas>
        <div className='accessibilityWrapper'>
          <Button
            onClick={reCaptcha}
            type='button'
            className='accessibility'
            name='recaptcha'
            id='recaptcha'
            useIconFA={true}
            innerText='fa fa-refresh'
          />
          <Button
            onClick={readCaptcha}
            type='button'
            className='accessibility'
            name='readcaptcha'
            id='readcaptcha'
            useIconFA={true}
            innerText='fa fa-audio-description'
          />
        </div>
      </div>
      <div className='inputWrapper'>
        <Input
          onChange={e => getInputValue(e, setInputCaptcha)}
          onFocus={handleStatusOnFocus}
          type='text'
          name='captcha'
          id='captcha'
          value={inputCaptcha ?? value}
          className='inp'
          placeHolder='Enter Captcha'
          required={true} />
      </div>
    </>
  )
}


export default Captcha