const crypto = require('crypto')

// Generate a random 32-byte key and a random 16-byte IV (Initialization Vector)
// const key = crypto.randomBytes(32) // 256-bit key
// const iv = crypto.randomBytes(16)  // 128-bit IV

// Encrypt function
const encrypt = (text) => {
	const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256')
		.update(process.env.ISSUE_KEY)
		.digest('base64')
		.substr(0, 32), Buffer.from(process.env.ISSUE_IV)) // AES algorithm
	let encrypted = cipher.update(text, 'utf8', 'hex') // Encrypt the text
	encrypted += cipher.final('hex') // Finalize encryption
	return encrypted // Return encrypted data and IV
}

// // Decrypt function
// const decrypt = (encryptedData) => {
// 	const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(process.env.ISSUE_KEY).digest('base64').substr(0, 32), Buffer.from(iv, 'hex'))
// 	let decrypted = decipher.update(encryptedData, 'hex', 'utf8') // Decrypt the data
// 	decrypted += decipher.final('utf8') // Finalize decryption
// 	return decrypted // Return the plaintext
// }


const decrypt = async (req, res, next) => {
	try {
		// Extract the encrypted data and IV from the request (e.g., query parameters)
		const { code } = req.params ?? req.headers // Adjust the source as needed
		const len = code.length - 64
		const [encryptedData, salt] = [code.substr(0, len), code.slice(len)]

		if (!encryptedData || !salt) {
			console.error('Missing encrypted data or IV')
			return res.status(400).json({ error: 'Missing encrypted data or IV' })
		}

		// verify salt
		const saltSignature = crypto.createHash('sha256', process.env.SALT_KEY)
			.update(process.env.GHOST_KEY)
			.digest('hex')

		if (salt !== saltSignature) {
			console.error('Salt verify error')
			return res.status(401).json({ error: 'Unauthorized' })
		}

		// Create the decipher instance
		const key = crypto.createHash('sha256')
			.update(process.env.ISSUE_KEY)
			.digest('base64')
			.substr(0, 32)

		const iv = Buffer.from(process.env.ISSUE_IV)

		const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

		// Decrypt the data
		let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
		decrypted += decipher.final('utf8')

		// Attach the decrypted data to the request object
		req.verified = { valid: encrypt(decrypted) === encryptedData }

		next() // Proceed to the next middleware/route handler
	} catch (err) {
		console.error('Decryption error:', err)
		res.status(500).json({ error: 'Failed to decrypt data' })
	}
}

module.exports = { encrypt, decrypt }