const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: false, // Can be empty if file only
    },
    time: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String, // URL to uploaded file
        required: false,
    },
    fileType: {
        type: String, // 'image', 'video', 'file'
        required: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Message', messageSchema);
