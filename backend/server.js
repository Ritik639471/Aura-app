import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/room.js';
import messageRoutes from './routes/message.js';
import uploadRoutes from './routes/upload.js';
import profileRoutes from './routes/profile.js';
import linkPreviewRoutes from './routes/linkpreview.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aura-chat')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.use('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chat API is running' });
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/linkpreview', linkPreviewRoutes);

// Serve Frontend Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Store active users per room
const activeUsers = {};

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Basic join room
  socket.on('join_room', ({ room, username }) => {
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    if (!activeUsers[room]) {
      activeUsers[room] = new Set();
    }
    activeUsers[room].add(username);

    // Broadcast updated user list to everyone in the room
    io.to(room).emit('room_users', Array.from(activeUsers[room]));
    console.log(`User ${username} joined room ${room}`);
  });

  // Basic message handling
  socket.on('send_message', async (data) => {
    try {
      // Save to database
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time
      });
      await newMessage.save();

      // Broadcast to everyone in the room except the sender
      socket.to(data.room).emit('receive_message', data);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Broadcast an already-saved image message (uploaded via REST API)
  socket.on('broadcast_image', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  // Typing indicators
  socket.on('typing', (data) => {
    socket.to(data.room).emit('display_typing', data);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.room).emit('hide_typing', data);
  });

  // Message reactions
  socket.on('toggle_reaction', async ({ messageId, emoji, username }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const existing = msg.reactions.find(r => r.emoji === emoji);
      if (existing) {
        const idx = existing.users.indexOf(username);
        if (idx > -1) existing.users.splice(idx, 1);
        else existing.users.push(username);
        if (existing.users.length === 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
      } else {
        msg.reactions.push({ emoji, users: [username] });
      }
      await msg.save();
      io.to(msg.room).emit('reaction_updated', { messageId, reactions: msg.reactions });
    } catch (err) { console.error(err); }
  });

  // Message edit (broadcast to room)
  socket.on('message_edited', (data) => {
    socket.to(data.room).emit('message_edited', data);
  });

  // Message delete (broadcast to room)
  socket.on('message_deleted', (data) => {
    io.to(data.room).emit('message_deleted', { messageId: data.messageId });
  });

  // Message pinned (broadcast to room)
  socket.on('message_pinned', (data) => {
    io.to(data.room).emit('message_pinned', data);
  });

  // Room cleared (broadcast to room)
  socket.on('room_cleared', (data) => {
    io.to(data.room).emit('room_cleared');
  });

  // Read receipts
  socket.on('mark_read', async ({ room, username }) => {
    try {
      await Message.updateMany(
        { room, readBy: { $ne: username } },
        { $push: { readBy: username } }
      );
      socket.to(room).emit('messages_read', { username, room });
    } catch (err) { console.error(err); }
  });

  socket.on('leave_room', ({ room, username }) => {
    socket.leave(room);
    if (activeUsers[room]) {
      activeUsers[room].delete(username);
      io.to(room).emit('room_users', Array.from(activeUsers[room]));
    }
  });

  socket.on('disconnect', () => {
    const { room, username } = socket.data;
    if (room && activeUsers[room]) {
      activeUsers[room].delete(username);
      io.to(room).emit('room_users', Array.from(activeUsers[room]));
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
