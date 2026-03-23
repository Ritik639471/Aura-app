import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'aura-avatars', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], transformation: [{ width: 200, height: 200, crop: 'fill' }] }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const router = express.Router();

// GET public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -resetPasswordOtp -resetPasswordExpires -email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE own profile
router.put('/', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const updates = {};
      if (req.body.bio !== undefined) updates.bio = req.body.bio;
      if (req.body.status !== undefined) updates.status = req.body.status;
      if (req.file) updates.avatar = req.file.path;

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password -resetPasswordOtp -resetPasswordExpires');
      res.json(user);
    } catch (saveErr) {
      res.status(500).json({ error: 'Update failed' });
    }
  });
});

export default router;
