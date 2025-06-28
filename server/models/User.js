const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ['super_admin', 'admin', 'employee'], default: 'employee' },
  position: { type: String },
  permissions: [{ type: String }],
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  createdAt: { type: Date, default: Date.now },
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    taskUpdates: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    meetings: { type: Boolean, default: true },
    chatMessages: { type: Boolean, default: true },
  },
  // 2FA fields
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorBackupCodes: [{ type: String }],
});

module.exports = mongoose.model('User', userSchema); 