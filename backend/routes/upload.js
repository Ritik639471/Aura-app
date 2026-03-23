import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aura-chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Health check for the upload route
router.get('/', (req, res) => {
  res.json({ status: 'Upload route is active' });
});

// Upload image
router.post('/', requireAuth, (req, res) => {
  // Manually call multer to catch errors
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const { room } = req.body;
      if (!room) return res.status(400).json({ error: 'Room is required' });

      const imageUrl = req.file.path;

      const newMessage = new Message({
        room,
        author: req.user.username,
        message: '',
        imageUrl,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        readBy: [req.user.username],
        reactions: []
      });
      await newMessage.save();

      res.json({ message: 'Image uploaded successfully', data: newMessage });
    } catch (saveErr) {
      console.error('Save error:', saveErr);
      res.status(500).json({ error: 'Failed to save message' });
    }
  });
});

export default router;
