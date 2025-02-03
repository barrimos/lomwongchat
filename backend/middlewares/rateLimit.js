const setRateLimit = require('express-rate-limit')
const resetTime = 1000 * 60 * 15 // 15 mins

// Rate limit middleware
const rateLimiter = setRateLimit({
  windowMs: resetTime,
  max: 3,
  headers: true,
  handler: (req, res) => {
    if (!req.session.reset) {
      req.session.reset = new Date().getTime() + resetTime
    }
    // Send a custom response and stop further middleware
    res.status(429).json({
      valid: false,
      error: `Maximum request limit. Try again at ${new Date(req.session.reset).toLocaleTimeString()}`,
    })
  },
})

module.exports = rateLimiter
