const mongoose = require('mongoose')

const commentingSchema = new mongoose.Schema({
    comment: {
        sender: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        }
    }
}, {
    timestamps: true
})

module.exports = commentingSchema