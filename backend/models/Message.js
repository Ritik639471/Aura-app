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
  authorAvatar: {
    type: String,
    default: null
  },
  // type: 'text' | 'image' | 'audio' | 'file' | 'poll' (for future expansion)
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'file', 'poll'],
    default: 'text'
  },
  message: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: null
  },
  // For audio messages (Phase 1 new feature)
  audioUrl: {
    type: String,
    default: null
  },
  audioDuration: {
    type: Number,
    default: null
  },
  // For file sharing (Phase 1 new feature)
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
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
  deletedAt: { type: Date, default: null },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  replyMessage: {
    author: String,
    message: String,
    image: String
  }
}, { timestamps: true });

// Full-text search index for message search feature
MessageSchema.index({ message: 'text', author: 'text' });

// Compound index for efficient room message history queries (most common query)
MessageSchema.index({ room: 1, createdAt: -1 });

// Index for pinned messages lookup
MessageSchema.index({ room: 1, pinned: 1 });

export default mongoose.model('Message', MessageSchema);

