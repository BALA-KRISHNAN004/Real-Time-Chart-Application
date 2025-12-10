const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message');


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/uploads', express.static('uploads'));


const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"]
    }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
    });

    socket.on('user_online', (username) => {
        onlineUsers.set(socket.id, username);
        io.emit('get_users', Array.from(onlineUsers.values()));
    });

    socket.on('send_message', async (data) => {
        // Save to Database
        try {
            const newMessage = new Message({
                room: data.room,
                author: data.author,
                message: data.message,
                time: data.time,
                fileUrl: data.fileUrl,
                fileType: data.fileType
            });
            await newMessage.save();
        } catch (err) {
            console.error("Error saving message:", err);
        }

        socket.to(data.room).emit('receive_message', data);
        // Optional: Send system notification if user is not in focus (Handled on frontend mostly)
    });

    socket.on('typing', (data) => {
        socket.to(data.room).emit('display_typing', data);
    });

    socket.on('stop_typing', (data) => {
        socket.to(data.room).emit('hide_typing', data);
    });


    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        io.emit('get_users', Array.from(onlineUsers.values()));
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
