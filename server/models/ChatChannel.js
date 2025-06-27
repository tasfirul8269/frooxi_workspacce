const mongoose = require('mongoose');

const chatChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], default: 'text' },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  categoryId: { type: String, default: null },
  allowedRoles: [{ type: String }],
  members: [{ type: String }],
  organizationId: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastReadBy: [{
    userId: String,
    lastReadMessageId: String,
  }],
});

const chatCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: String, required: true },
  order: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  ChatChannel: mongoose.model('ChatChannel', chatChannelSchema),
  ChatCategory: mongoose.model('ChatCategory', chatCategorySchema),
}; 