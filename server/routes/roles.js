const express = require('express');
const jwt = require('jsonwebtoken');
const Role = require('../models/Role');
const User = require('../models/User');

const router = express.Router();

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

// Create a new role
router.post('/', auth, async (req, res) => {
  try {
    const { name, color, permissions } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const role = new Role({
      name,
      color,
      permissions,
      organizationId: user.organizationId,
    });
    await role.save();
    res.status(201).json({ role });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create role', error: err.message });
  }
});

// List all roles in the current organization
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const roles = await Role.find({ organizationId: user.organizationId });
    res.json({ roles });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch roles', error: err.message });
  }
});

// Edit a role
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const { name, color, permissions } = req.body;
    const role = await Role.findOne({ _id: req.params.id, organizationId: user.organizationId });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (name) role.name = name;
    if (color) role.color = color;
    if (permissions) role.permissions = permissions;
    await role.save();
    res.json({ role });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

// Delete a role
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const role = await Role.findOneAndDelete({ _id: req.params.id, organizationId: user.organizationId });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete role', error: err.message });
  }
});

module.exports = router; 