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
    required: true
  },
  time: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
