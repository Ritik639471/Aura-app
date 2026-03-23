import express from 'express';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms (Public + My DMs)
router.get('/', requireAuth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isDirectMessage: { $ne: true } },
        { isDirectMessage: true, members: req.user.id }
      ]
    }).populate('creator', 'username').populate('members', 'username');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching rooms' });
  }
});

// Create a new room
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room already exists' });
    }

    const newRoom = new Room({
      name,
      creator: req.user.id,
      members: [req.user.id],
      admins: [req.user.id]  // Creator is always an admin
    });
    
    await newRoom.save();
    
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating room' });
  }
});

// Delete a room
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is the creator
    if (room.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this room' });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting room' });
  }
});

// Join a room
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    room.members.push(req.user.id);
    await room.save();
    
    // Return dynamically populated room
    const updatedRoom = await Room.findById(req.params.id).populate('creator', 'username').populate('members', 'username');
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: 'Server error joining room' });
  }
});

// Start a Direct Message
router.post('/dm/:username', requireAuth, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot DM yourself' });
    }

    // Check if DM room already exists
    let dmRoom = await Room.findOne({
      isDirectMessage: true,
      members: { $all: [req.user.id, targetUser._id] }
    });

    if (!dmRoom) {
      const roomName = `DM-${Math.random().toString(36).substring(2, 10)}`;
      dmRoom = new Room({
        name: roomName,
        creator: req.user.id,
        members: [req.user.id, targetUser._id],
        isDirectMessage: true
      });
      await dmRoom.save();
    }

    const populatedRoom = await Room.findById(dmRoom._id).populate('members', 'username');
    res.json(populatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating DM' });
  }
});

// Make a member an admin (creator only)
router.post('/:id/make-admin', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.creator.toString() !== req.user.id) return res.status(403).json({ error: 'Creator only' });
    const { userId: targetUserId } = req.body;
    if (!room.members.includes(targetUserId)) return res.status(400).json({ error: 'User is not a member' });
    if (!room.admins.includes(targetUserId)) {
      room.admins.push(targetUserId);
      await room.save();
    }
    const updated = await Room.findById(req.params.id).populate('creator', 'username').populate('members', 'username').populate('admins', 'username');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove admin (creator only)
router.delete('/:id/remove-admin', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.creator.toString() !== req.user.id) return res.status(403).json({ error: 'Creator only' });
    const { userId: targetUserId } = req.body;
    room.admins = room.admins.filter(a => a.toString() !== targetUserId);
    await room.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
