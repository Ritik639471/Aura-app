import express from 'express';
import Room from '../models/Room.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms
router.get('/', requireAuth, async (req, res) => {
  try {
    const rooms = await Room.find().populate('creator', 'username');
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
      creator: req.user.id
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

export default router;
