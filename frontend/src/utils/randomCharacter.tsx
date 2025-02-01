export const randomCharacter = (num: number = 8) => {
  let str: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&-+_=?'
  let len: number = str.length
  let result: string = ''
  let i: number
  let count: number = num

  if (count > 8 || count < 0) {
    count = 8
  }

  while (count) {
    i = Math.floor(Math.random() * len)
    result += str[i]
    str = str.replace(str[i], '')
    len--
    count--
  }

  return result
}