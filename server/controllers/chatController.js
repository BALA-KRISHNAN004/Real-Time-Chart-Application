const Message = require('../models/Message');

// Get messages for a specific room
exports.getMessages = async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await Message.find({ room }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Handle File Upload
exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    // Return the URL to access the file
    // Assumes 'uploads' directory is served statically at '/uploads'
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        url: fileUrl,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
        filename: req.file.originalname
    });
};
