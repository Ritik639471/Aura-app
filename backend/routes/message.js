import express from 'express';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper: check if user has power in a room (creator or admin)
const isPowerUser = (room, userId) =>
  room.creator.toString() === userId || room.admins.some(a => a.toString() === userId);

// Get messages for a specific room (members only)
router.get('/:roomName', requireAuth, async (req, res) => {
  try {
    const room = await Room.findOne({ name: req.params.roomName });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'You must join the room first' });
    }
    const messages = await Message.find({ room: req.params.roomName, deletedAt: null })
      .sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Get pinned messages for a room
router.get('/:roomName/pinned', requireAuth, async (req, res) => {
  try {
    const room = await Room.findOne({ name: req.params.roomName });
    if (!room || !room.members.includes(req.user.id)) return res.status(403).json({ error: 'Access denied' });
    const pinned = await Message.find({ room: req.params.roomName, pinned: true, deletedAt: null });
    res.json(pinned);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit a message (own messages only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.author !== req.user.username) return res.status(403).json({ error: 'Not your message' });
    msg.message = req.body.message;
    msg.edited = true;
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Edit failed' });
  }
});

// Delete a message (own message OR admin/creator)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const room = await Room.findOne({ name: msg.room });
    const canDelete = msg.author === req.user.username || (room && isPowerUser(room, req.user.id));
    if (!canDelete) return res.status(403).json({ error: 'Not authorized' });
    msg.deletedAt = new Date();
    await msg.save();
    res.json({ success: true, messageId: msg._id });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Pin/Unpin a message (admin/creator only)
router.post('/:id/pin', requireAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const room = await Room.findOne({ name: msg.room });
    if (!room || !isPowerUser(room, req.user.id)) return res.status(403).json({ error: 'Admins only' });
    msg.pinned = !msg.pinned;
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Pin failed' });
  }
});

// Clear all messages in room (admin/creator only)
router.delete('/room/:roomName/clear', requireAuth, async (req, res) => {
  try {
    const room = await Room.findOne({ name: req.params.roomName });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!isPowerUser(room, req.user.id)) return res.status(403).json({ error: 'Admins only' });
    await Message.updateMany({ room: req.params.roomName }, { deletedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Clear failed' });
  }
});

export default router;
