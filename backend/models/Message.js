import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: null
  },
  time: {
    type: String,
    required: true
  },
  reactions: [{
    emoji: String,
    users: [String]
  }],
  readBy: [{ type: String }],
  edited: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
