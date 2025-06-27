const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], default: 'text' },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  members: [{ type: String }], // user IDs
  organizationId: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  joinRequests: [{ type: String }], // user IDs
  pinnedMessageId: { type: String, default: null },
});

module.exports = {
  Group: mongoose.model('Group', groupSchema),
}; 