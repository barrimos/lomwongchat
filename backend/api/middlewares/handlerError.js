const handlerError = (err, req, res, next) => {
  res.status(err.status || 500).json({
    valid: err.valid || false,
    error: err.message || 'Internal server error',
    issue: err.issue || '',
    issueStatus: err.issueStatus || false,
    banned: err.banned || false,
    remains: err.remains || 0
  })
}

module.exports = handlerError