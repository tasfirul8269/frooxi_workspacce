const express = require('express');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { auth } = require('./users');

const router = express.Router();

// Get all meetings for the user's organization
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const meetings = await Meeting.find({ organizationId: user.organizationId }).sort({ startTime: 1 });
    res.json({ meetings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch meetings', error: err.message });
  }
});

// Create a new meeting
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const { title, description, startTime, endTime, attendees, meetLink, location, status } = req.body;
    const meeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      attendees,
      meetLink,
      location,
      status: status || 'scheduled',
      organizationId: user.organizationId,
      createdBy: user._id,
    });
    await meeting.save();
    res.status(201).json({ meeting });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create meeting', error: err.message });
  }
});

// Edit a meeting
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.organizationId.toString() !== user.organizationId.toString()) return res.status(403).json({ message: 'Not authorized' });
    const updates = req.body;
    Object.assign(meeting, updates, { updatedAt: new Date() });
    await meeting.save();
    res.json({ meeting });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update meeting', error: err.message });
  }
});

// Delete a meeting
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.organizationId.toString() !== user.organizationId.toString()) return res.status(403).json({ message: 'Not authorized' });
    await meeting.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete meeting', error: err.message });
  }
});

module.exports = router; 