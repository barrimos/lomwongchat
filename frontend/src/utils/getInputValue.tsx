import { ChangeEvent, Dispatch, SetStateAction } from 'react'

export const getInputValue = <T extends string | number>(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setState: Dispatch<SetStateAction<T>>, limit?: number): void => {
  const value: T = e.target.value as T
  if (limit && typeof value === 'string' && value.length > limit) {
    return // Enforce the limit if provided
  }
  if (setState) setState(value)
}