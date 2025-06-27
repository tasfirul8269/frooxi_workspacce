const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const Organization = require('../models/Organization');

const router = express.Router();

// Middleware to verify JWT and set req.userId
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Update current user's profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, avatar, position } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if ('avatar' in req.body) user.avatar = avatar;
    if ('position' in req.body) user.position = position;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

// Create a new user
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, password, avatar, accountType, roleId } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar,
      role: accountType,
      organizationId: user.organizationId,
      permissions: [],
      createdAt: new Date(),
    });
    // If employee, assign permissions from role
    if (accountType === 'employee' && roleId) {
      const role = await Role.findById(roleId);
      if (role) newUser.permissions = role.permissions;
    } else if (accountType === 'admin') {
      newUser.permissions = ['create_tasks', 'manage_team', 'create_channels'];
    }
    await newUser.save();
    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
});

// List all users in the current organization
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const users = await User.find({ organizationId: user.organizationId });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// Edit a user
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const { name, email, avatar, role, permissions, position } = req.body;
    const target = await User.findOne({ _id: req.params.id, organizationId: user.organizationId });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (name) target.name = name;
    if (email) target.email = email;
    if ('avatar' in req.body) target.avatar = avatar;
    if (role) target.role = role;
    if (permissions) target.permissions = permissions;
    if ('position' in req.body) target.position = position;
    await target.save();
    res.json({ user: target });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

// Delete a user
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const target = await User.findOneAndDelete({ _id: req.params.id, organizationId: user.organizationId });
    if (!target) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

module.exports = router;
module.exports.auth = auth; 