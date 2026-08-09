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
  deletedAt: { type: Date, default: null },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  replyMessage: {
    author: String,
    message: String,
    image: String
  }
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
