const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, organizationName } = req.body;
    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Generate base slug
    let baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    // Find existing orgs with this base slug or slug#number
    let existingOrg = await Organization.findOne({ slug });
    while (existingOrg) {
      // Find the highest #number used for this base slug
      const regex = new RegExp(`^${baseSlug}(#(\\d+))?$`);
      const orgs = await Organization.find({ slug: { $regex: regex } });
      let maxNum = 0;
      orgs.forEach(org => {
        const match = org.slug.match(/#(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      counter = maxNum + 1;
      slug = `${baseSlug}#${counter}`;
      existingOrg = await Organization.findOne({ slug });
    }

    // Create org
    const newOrg = new Organization({
      name: organizationName,
      slug,
      plan: 'free',
      status: 'trial',
      settings: { allowEmployeeRegistration: true, maxUsers: 10, features: ['tasks', 'chat'] },
      billing: { trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    });
    await newOrg.save();

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=400',
      role: 'admin',
      position: 'Administrator',
      organizationId: newOrg._id,
      permissions: ['create_tasks', 'manage_team', 'create_channels'],
    });
    await newUser.save();
    newOrg.adminId = newUser._id;
    await newOrg.save();

    // JWT
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: newUser, organization: newOrg });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });
    const org = user.organizationId ? await Organization.findById(user.organizationId) : null;
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user, organization: org });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 