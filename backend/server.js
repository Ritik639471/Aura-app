import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/room.js';
import messageRoutes from './routes/message.js';
import uploadRoutes from './routes/upload.js';
import profileRoutes from './routes/profile.js';
import linkPreviewRoutes from './routes/linkpreview.js';
import Message from './models/Message.js';

dotenv.config();

// Startup Validation
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment variables!');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.warn('WARNING: MONGO_URI not set. Using local MongoDB fallback.');
}

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const server = http.createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://aura-app-in-chat.vercel.app',
  'https://aura-app.vercel.app',
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
].filter(Boolean);

const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    allowedOrigins.includes('*') ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.netlify.app')
  ) {
    return callback(null, true);
  }
  return callback(new Error('Not allowed by CORS'));
};

const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: corsOriginHandler,
  credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aura-chat')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// HTTP Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chat API is running',
    uptime: Math.floor(process.uptime()),
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/linkpreview', linkPreviewRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Aura Chat API Server is active' });
});

// 404 for unmatched API routes (Express 5 compatible)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'NotFound', message: `Route ${req.method} ${req.originalUrl} not found` });
  }
  next();
});

// Socket.IO Authentication Middleware
// Every socket connection MUST present a valid JWT — anonymous connections are rejected.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

// Active Users Tracking
// Map<roomName, Set<username>> — tracks who is online in each room.
const activeUsers = new Map();

// Clean up empty rooms from the map to prevent memory accumulation.
const cleanupRoom = (room) => {
  if (activeUsers.has(room) && activeUsers.get(room).size === 0) {
    activeUsers.delete(room);
  }
};

// Helper: remove a user from a room and broadcast the updated user list.
const leaveRoom = (socket, room) => {
  const username = socket.data.username;
  socket.leave(room);
  if (activeUsers.has(room)) {
    activeUsers.get(room).delete(username);
    io.to(room).emit('room_users', Array.from(activeUsers.get(room)));
    cleanupRoom(room);
  }
};

// Socket.IO Events
io.on('connection', (socket) => {
  // username is guaranteed by the auth middleware above
  const username = socket.data.username;
  console.log(`[Socket] Connected: ${username} (${socket.id})`);

  // Track all rooms this socket has joined
  socket.data.rooms = new Set();

  // Join Room
  socket.on('join_room', (room) => {
    if (!room || typeof room !== 'string') return;

    socket.join(room);
    socket.data.rooms.add(room);

    if (!activeUsers.has(room)) {
      activeUsers.set(room, new Set());
    }
    activeUsers.get(room).add(username);

    io.to(room).emit('room_users', Array.from(activeUsers.get(room)));
    console.log(`[Socket] ${username} joined room: ${room}`);
  });

  // Send Message
  socket.on('send_message', async (data) => {
    // Validate required fields — reject malformed/spoofed messages
    if (!data?.room || !data?.message || typeof data.message !== 'string') return;
    if (data.message.trim().length === 0 || data.message.length > 4000) return;

    // Enforce that the author matches the authenticated user — prevents spoofing
    const verifiedData = {
      ...data,
      author: username, // always use the verified username from JWT, not client-provided
      authorAvatar: data.authorAvatar || null,
    };

    try {
      const newMessage = new Message({
        room: verifiedData.room,
        author: verifiedData.author,
        authorAvatar: verifiedData.authorAvatar,
        message: verifiedData.message.trim(),
        time: new Date().toISOString(),
        replyTo: verifiedData.replyTo || null,
        replyMessage: verifiedData.replyMessage || null
      });
      const saved = await newMessage.save();

      // Broadcast to room including the DB-assigned _id so clients can reference it
      const messageToSend = { ...verifiedData, _id: saved._id, time: saved.time };
      io.to(verifiedData.room).emit('receive_message', messageToSend);
    } catch (error) {
      console.error('[Socket] Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message. Please try again.' });
    }
  });

  // Broadcast Image (uploaded via REST, already saved)
  socket.on('broadcast_image', (data) => {
    if (!data?.room) return;
    socket.to(data.room).emit('receive_message', data);
  });

  // Typing Indicators
  socket.on('typing', (data) => {
    if (!data?.room) return;
    socket.to(data.room).emit('display_typing', { ...data, username });
  });

  socket.on('stop_typing', (data) => {
    if (!data?.room) return;
    socket.to(data.room).emit('hide_typing', { ...data, username });
  });

  // Message Reactions
  socket.on('toggle_reaction', async ({ messageId, emoji }) => {
    if (!messageId || !emoji) return;
    // Sanitize emoji — allow only reasonable lengths
    if (typeof emoji !== 'string' || emoji.length > 10) return;

    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      const existing = msg.reactions.find(r => r.emoji === emoji);
      if (existing) {
        const idx = existing.users.indexOf(username);
        if (idx > -1) existing.users.splice(idx, 1);
        else existing.users.push(username);
        if (existing.users.length === 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        msg.reactions.push({ emoji, users: [username] });
      }

      await msg.save();
      io.to(msg.room).emit('reaction_updated', { messageId, reactions: msg.reactions });
    } catch (err) {
      console.error('[Socket] toggle_reaction error:', err);
    }
  });

  // Message Edit
  socket.on('message_edited', (data) => {
    if (!data?.room || !data?.messageId) return;
    socket.to(data.room).emit('message_edited', data);
  });

  // Message Delete
  socket.on('message_deleted', (data) => {
    if (!data?.room || !data?.messageId) return;
    io.to(data.room).emit('message_deleted', { messageId: data.messageId });
  });

  // Message Pinned
  socket.on('message_pinned', (data) => {
    if (!data?.room) return;
    io.to(data.room).emit('message_pinned', data);
  });

  // Room Cleared
  socket.on('room_cleared', (data) => {
    if (!data?.room) return;
    io.to(data.room).emit('room_cleared');
  });

  // Read Receipts
  socket.on('mark_read', async ({ room }) => {
    if (!room) return;
    try {
      await Message.updateMany(
        { room, readBy: { $ne: username } },
        { $push: { readBy: username } }
      );
      socket.to(room).emit('messages_read', { username, room });
    } catch (err) {
      console.error('[Socket] mark_read error:', err);
    }
  });

  // Leave Room
  socket.on('leave_room', (room) => {
    if (!room) return;
    leaveRoom(socket, room);
    socket.data.rooms.delete(room);
  });

  // Disconnect — clean up ALL rooms this socket was in
  socket.on('disconnect', () => {
    // Remove user from every room they had joined (not just socket.data.room)
    for (const room of socket.data.rooms || []) {
      if (activeUsers.has(room)) {
        activeUsers.get(room).delete(username);
        io.to(room).emit('room_users', Array.from(activeUsers.get(room)));
        cleanupRoom(room);
      }
    }
    console.log(`[Socket] Disconnected: ${username} (${socket.id})`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Aura Chat Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — closing server gracefully...');
  server.close(() => {
    mongoose.connection.close();
    console.log('Server closed.');
    process.exit(0);
  });
});
