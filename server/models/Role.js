const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: [{ type: String }],
  color: { type: String, default: '#3B82F6' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
});

module.exports = mongoose.model('Role', roleSchema); 