import express from 'express';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a specific room
router.get('/:roomName', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomName })
      .sort({ createdAt: 1 }) // oldest first
      .limit(100); // Only load last 100 messages for now
      
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

export default router;
