import { ChangeEvent, Dispatch, ReactElement, SetStateAction } from "react"

export interface ButtonTypes {
  type: 'button' | 'submit' | 'reset'
  name: string
  value?: string | number
  id?: string
  className?: string
  innerText: string
  useIconFA?: boolean
  onClick?: (e: MouseEvent<HTMLButtonElement>, refSetState?: Dispatch<SetStateAction<boolean>>) => void
  disabled?: boolean
  children?: React.ReactNode
  attr?: { [key: string] }[]
}

export interface UsersWhereAreYouTypes {
  targetUsername: string
  deviceId: string
  leaveChannel: string
  targetChannel: string
  currJoinChannel: { [key: string]: string }
  isLogOut: boolean
}

export interface VerifiedTypes {
  valid: boolean
  error: string
  issue: string
  status: string
  banned: boolean
}

export interface FeelingsTypes {
  currFeels: number[]
  handleSelectFeels: (e: ChangeEventHandler<HTMLSelectElement>) => void
}


export interface InputTypes {
  type: string
  name: string
  id: string
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEventHandler<HTMLInputElement>) => void
  className?: string
  placeHolder?: string
  required?: boolean
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  value?: string | number
  useLabel?: boolean
  labelText?: string
  labelId?: string
  labelClass?: string
  min?: string | number
  max?: string | number
  useShowHide?: [boolean, Dispatch<SetStateAction<boolean>>]
  attr?: { [key: string] }[]
  checked?: boolean | undefined
}

export interface CaptchaTypes {
  captcha: string
  setStatusVerified: Dispatch<SetStateAction<string>>
  value: string
  useLabel?: boolean
  reNewCaptcha: boolean
  inputCaptcha: string
  setIsCanvas: Dispatch<SetStateAction<HTMLCanvasElement | null>>
  setInputCaptcha: Dispatch<SetStateAction<string>>
  setReNewCaptcha: Dispatch<SetStateAction<boolean>>
  reCaptcha: (e: MouseEvent<HTMLDivElement>) => void
  readCaptcha: (e: MouseEvent<HTMLDivElement>) => void
  setStayLoggedIn: Dispatch<SetStateAction<[string, boolean]>>
}

export interface FormTypes {
  head: string
  headClass: string
  subHead: string
  subHeadClass: string
  method: string
  action: string
  className: string
  id: string
  target: '_blank' | '_self' | '_parent' | '_top' | undefined
  autoComplete: 'on' | 'off' | undefined
  children: React.ReactNode
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'
}

export interface DashboardUsers {
  username: string
  role: string
  token: {
    accessToken: string
    refreshToken: string
  }
  status: string
  session: {
    [key: string]: string
  }
  issue: {
    code: string
    status: boolean
    requestClose: boolean
    comment: Array
  }
  createdAt: string
  lastActive: string
  updatedAt: string
  __v: number
}

export interface SessionsDataTypes {
  sessionId: string
  ip: string
  username: string
  deviceId: string
  isLoggedIn: boolean
  agent: string
  checked?: boolean
}

export interface BubbleTypes {
  bubble: {
    bid: string
    rid: string
    username: string
    message: string
    unixTime: number
    timestamp: string
    reply: { username: string, idBubble: string, message: string } | undefined
  }
  yourName: string | undefined
  setIsContextOpen?: Dispatch<SetStateAction<boolean>>
  isContextOpen?: boolean
  setCurrIdContext?: Dispatch<SetStateAction<string>>
  currIdContext?: string
  replyBubble?: { username: string, idBubble: string, message: string }
  contextClick: boolean
  copyMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string) => void
  replyMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string) => void
  reportMessage: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, message: string, ...replies: string[]) => void
  setContextClick: Dispatch<SetStateAction<boolean>>
  scrollToReplyRef: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  isSameSender: boolean
  closeContext: boolean
  setCloseContext: Dispatch<SetStateAction<boolean>>
}

export interface BoundingTypes {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
  x: number
  y: number
}

export interface TicketBubbleTypes {
  code: string | null
  status: string
  reporter: string | undefined
  channel: string | undefined
  username: string
  idBubble: string
  message: string
  replies: string[]
  details: string | null
  timeMessage: string
  createdAt?: String
}

export interface ModalConfig {
  isOpen: boolean
  Component: React.ComponentType<any> // Use `any` for dynamic props or define a union type for stricter checks.
  props: Record<string, any> // Adjust the type based on shared or specific props.
  setState: React.Dispatch<React.SetStateAction<boolean>>
}

export interface DmBubbleTypes {
  [key: string]: {
    [key: string]: bubbleTypes['bubble'][]
  }
}