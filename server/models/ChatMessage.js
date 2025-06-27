const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false },
  replyTo: { type: String, default: null },
  attachment: {
    url: String,
    name: String,
    size: Number,
    type: String,
  },
  reactions: [{
    emoji: String,
    userIds: [String],
  }],
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 