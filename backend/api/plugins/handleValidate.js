const handleValidate = {
  role: {
    admin: '100',
    user: '301'
  },
  access: {
    lomwong: 'lomwong',
    adsysop: 'adsysop'
  },
  error: {
    badReq: {
      message: 'Bad request',
      status: 400,
      valid: false
    },
    unauthorized: {
      message: 'Unauthorized',
      status: 401,
      valid: false,
    },
    forbidden: {
      message: 'Forbidden',
      status: 403,
      valid: false
    },
    notFound: {
      message: 'Not found',
      status: 404,
      valid: false
    },
    tooMuch: {
      message: 'Too much request',
      status: 429,
      valid: false
    },
    internal: {
      message: 'Internal server error',
      status: 500,
      valid: false
    }
  }
}

module.exports = handleValidate