require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function createSuperAdmin() {
  await mongoose.connect(MONGO_URI);
  const email = 'super@frooxi.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists.');
    process.exit(0);
  }
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = new User({
    name: 'Super Admin',
    email,
    password: hashedPassword,
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    role: 'super_admin',
    position: 'System Administrator',
    permissions: ['all'],
    createdAt: new Date(),
  });
  await user.save();
  console.log('Super admin created:', email, '/ password: admin123');
  process.exit(0);
}

createSuperAdmin(); 