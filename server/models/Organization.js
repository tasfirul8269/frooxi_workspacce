const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  domain: { type: String },
  logo: { type: String },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'suspended', 'trial'], default: 'trial' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settings: {
    allowEmployeeRegistration: { type: Boolean, default: true },
    maxUsers: { type: Number, default: 10 },
    features: [{ type: String }],
  },
  billing: {
    subscriptionId: { type: String },
    currentPeriodEnd: { type: Date },
    trialEnd: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Organization', organizationSchema); 