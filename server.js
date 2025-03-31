require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Message Schema
const messageSchema = new mongoose.Schema({
    user: String,
    msg: String,
    timestamp: { type: String, default: new Date().toLocaleTimeString() }
});

const Message = mongoose.model('Message', messageSchema);

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Online users tracking
let onlineUsers = {};

// WebSocket Connection
io.on('connection', async (socket) => {
    console.log('🔵 A user connected');

    // Send previous messages from DB
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    socket.emit('load messages', messages);

    // User joins
    socket.on('join', (username) => {
        socket.username = username;
        onlineUsers[socket.id] = username;
        io.emit('update users', Object.values(onlineUsers));
    });

    // Handle chat messages
    socket.on('chat message', async (data) => {
        const newMessage = new Message(data);
        await newMessage.save();
        io.emit('chat message', data);
    });

    // Typing Indicator
    socket.on('typing', () => {
        socket.broadcast.emit('typing', socket.username);
    });

    // Private Messaging
    socket.on('private message', ({ recipient, msg }) => {
        const recipientSocket = Object.keys(onlineUsers).find(key => onlineUsers[key] === recipient);
        if (recipientSocket) {
            io.to(recipientSocket).emit('private message', { user: socket.username, msg });
        }
    });

    // Handle User Disconnect
    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('update users', Object.values(onlineUsers));
        console.log('🔴 User disconnected');
    });
});

server.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
