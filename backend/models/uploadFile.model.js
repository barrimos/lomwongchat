const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    filename: {
        type: String // Original file name
    },
    path: {
        type: String // Path where the file is stored
    },
    mimetype: {
        type: String // MIME type of the file
    },
    size: {
        type: Number // File size in bytes
    },
    username: {
        type: String // user who uploaded the file
    },
    code: {
        type: String // issue code
    }
})

const uploadFileModel = mongoose.model('uploads', fileSchema, 'uploads')

module.exports = uploadFileModel