const genNonce = num => {
  const max = 8
  const str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&-+_=?'
  const len = str.length
  let result = ''
  let i
  let count = num

  if (num > max || num < 0) {
    count = max
  }

  while (count) {
    i = Math.floor(Math.random() * len)
    result += str[i]
    count--
  }

  return result
}

module.exports = genNonce