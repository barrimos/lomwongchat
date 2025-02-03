const clearSession = (req, res, next) => {
	// Destroy session
	req.session.destroy(err => {
		if (err) {
			console.error(err)
			return res.status(500).json({ error: 'Failed to log out' })
		}
		next()
	})
}

module.exports = clearSession