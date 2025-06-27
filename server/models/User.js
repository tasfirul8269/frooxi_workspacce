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
});

module.exports = mongoose.model('User', userSchema); 