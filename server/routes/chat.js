const express = require('express');
const { ChatChannel, ChatCategory, Group } = require('../models/ChatChannel');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const router = express.Router();

// Auth middleware (reuse from users.js)
const { auth } = require('./users');

// List all categories for the user's organization
router.get('/categories', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const categories = await ChatCategory.find({ organizationId: user.organizationId }).sort({ order: 1, name: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

// Create a new category
router.post('/categories', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const { name, order } = req.body;
    const category = new ChatCategory({
      name,
      organizationId: user.organizationId,
      order: order || 0,
      createdBy: user._id.toString(),
      createdAt: new Date(),
    });
    await category.save();
    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});

// List all channels for the user's organization, filtered by privacy/roles
router.get('/channels', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    let channels = await ChatChannel.find({ organizationId: user.organizationId });
    // Filter private channels by allowedRoles (case-insensitive)
    channels = channels.filter(channel => {
      if (channel.privacy === 'public') return true;
      if (!user.role) return false;
      return channel.allowedRoles.some(r => r.toLowerCase() === user.role.toLowerCase());
    });
    res.json({ channels });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch channels', error: err.message });
  }
});

// Create a new channel (with type, privacy, categoryId, allowedRoles)
router.post('/channels', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const { name, type, privacy, categoryId, allowedRoles, members } = req.body;
    const channel = new ChatChannel({
      name,
      type: type || 'text',
      privacy: privacy || 'public',
      categoryId: categoryId || null,
      allowedRoles: allowedRoles || [],
      members: members || [],
      organizationId: user.organizationId,
      createdBy: user._id.toString(),
      createdAt: new Date(),
    });
    await channel.save();
    res.status(201).json({ channel });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create channel', error: err.message });
  }
});

// List messages for a channel
router.get('/channels/:id/messages', auth, async (req, res) => {
  try {
    const channelId = req.params.id;
    const messages = await ChatMessage.find({ channelId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
});

// Send a message to a channel
router.post('/channels/:id/messages', auth, async (req, res) => {
  try {
    const channelId = req.params.id;
    const { content, attachment } = req.body;
    if (!content && !attachment) return res.status(400).json({ message: 'Content or attachment is required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(403).json({ message: 'Not authorized' });
    const message = new ChatMessage({
      channelId,
      content,
      authorId: user._id.toString(),
      createdAt: new Date(),
      edited: false,
      attachment: attachment || null,
    });
    await message.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(channelId).emit('chat:new_message', { ...message.toObject(), id: message._id });
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

// Edit a message
router.patch('/channels/:id/messages/:msgId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const message = await ChatMessage.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.authorId !== req.userId) return res.status(403).json({ message: 'Not authorized' });
    message.content = content;
    message.edited = true;
    await message.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(message.channelId).emit('chat:edit_message', { ...message.toObject(), id: message._id });
    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Failed to edit message', error: err.message });
  }
});

// Delete a message
router.delete('/channels/:id/messages/:msgId', auth, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.authorId !== req.userId) return res.status(403).json({ message: 'Not authorized' });
    await message.deleteOne();
    // Emit socket event
    const io = req.app.get('io');
    io.to(message.channelId).emit('chat:delete_message', { id: message._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete message', error: err.message });
  }
});

// Mark messages as read
router.patch('/channels/:id/read', auth, async (req, res) => {
  try {
    const channelId = req.params.id;
    const { lastReadMessageId } = req.body;
    const userId = req.userId;
    const channel = await ChatChannel.findById(channelId);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    let found = false;
    channel.lastReadBy = channel.lastReadBy || [];
    channel.lastReadBy = channel.lastReadBy.filter(r => r.userId !== userId);
    channel.lastReadBy.push({ userId, lastReadMessageId });
    await channel.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(channelId).emit('chat:read', { userId, lastReadMessageId });
    res.json({ lastReadBy: channel.lastReadBy });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update read receipt', error: err.message });
  }
});

// Add or remove a reaction to a message
router.post('/channels/:id/messages/:msgId/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji is required' });
    const message = await ChatMessage.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    let reactions = message.reactions || [];
    let reaction = reactions.find(r => r.emoji === emoji);
    const userId = req.userId;
    if (reaction) {
      if (reaction.userIds.includes(userId)) {
        // Remove reaction
        reaction.userIds = reaction.userIds.filter(id => id !== userId);
        if (reaction.userIds.length === 0) {
          reactions = reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to reaction
        reaction.userIds.push(userId);
      }
    } else {
      // Add new reaction
      reactions.push({ emoji, userIds: [userId] });
    }
    message.reactions = reactions;
    await message.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(message.channelId).emit('chat:reaction', { msgId: message._id, reactions });
    res.json({ reactions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to react to message', error: err.message });
  }
});

// Create a new group
router.post('/groups', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { name, type, privacy, members } = req.body;
    const group = new Group({
      name,
      type: type || 'text',
      privacy: privacy || 'public',
      members: members || [],
      organizationId: user.organizationId,
      createdBy: user._id.toString(),
      createdAt: new Date(),
    });
    await group.save();
    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create group', error: err.message });
  }
});

// List groups for the user
router.get('/groups', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    let groups = await Group.find({ organizationId: user.organizationId });
    groups = groups.filter(group => {
      if (group.privacy === 'public') return true;
      return group.members.includes(user._id.toString());
    });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
});

// Edit a group (admin only)
router.put('/groups/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { name, type, privacy, members } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (name) group.name = name;
    if (type) group.type = type;
    if (privacy) group.privacy = privacy;
    if (members) group.members = members;
    await group.save();
    res.json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update group', error: err.message });
  }
});

// Delete a group (admin only)
router.delete('/groups/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete group', error: err.message });
  }
});

// List messages for a group
router.get('/groups/:id/messages', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.privacy === 'private' && !group.members.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const messages = await ChatMessage.find({ channelId: groupId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
});

// Send a message to a group
router.post('/groups/:id/messages', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { content, attachment } = req.body;
    if (!content && !attachment) return res.status(400).json({ message: 'Content or attachment is required' });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.privacy === 'private' && !group.members.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(403).json({ message: 'Not authorized' });
    const message = new ChatMessage({
      channelId: groupId,
      content,
      authorId: user._id.toString(),
      createdAt: new Date(),
      edited: false,
      attachment: attachment || null,
    });
    await message.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('chat:new_message', { ...message.toObject(), id: message._id });
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

// Request to join a private group
router.post('/groups/:id/request-join', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const group = await Group.findById(req.params.id);
    if (!group || group.privacy !== 'private') return res.status(400).json({ message: 'Invalid group' });
    if (group.members.includes(user._id.toString())) return res.status(400).json({ message: 'Already a member' });
    if (group.joinRequests && group.joinRequests.includes(user._id.toString())) return res.status(400).json({ message: 'Already requested' });
    group.joinRequests = group.joinRequests || [];
    group.joinRequests.push(user._id.toString());
    await group.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to request join', error: err.message });
  }
});

// Approve join request (admin only)
router.post('/groups/:id/approve-join', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.joinRequests = (group.joinRequests || []).filter(id => id !== userId);
    if (!group.members.includes(userId)) group.members.push(userId);
    await group.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve join', error: err.message });
  }
});

// Deny join request (admin only)
router.post('/groups/:id/deny-join', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.joinRequests = (group.joinRequests || []).filter(id => id !== userId);
    await group.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to deny join', error: err.message });
  }
});

// Pin a message (admin only)
router.post('/groups/:id/pin-message', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { msgId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.pinnedMessageId = msgId;
    await group.save();
    // Emit socket event for real-time pin
    const io = req.app.get('io');
    io.to(group._id.toString()).emit('group:pin', { groupId: group._id.toString(), pinnedMessageId: group.pinnedMessageId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to pin message', error: err.message });
  }
});

// Unpin message (admin only)
router.post('/groups/:id/unpin-message', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.pinnedMessageId = null;
    await group.save();
    // Emit socket event for real-time unpin
    const io = req.app.get('io');
    io.to(group._id.toString()).emit('group:pin', { groupId: group._id.toString(), pinnedMessageId: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unpin message', error: err.message });
  }
});

// Leave a group
router.post('/groups/:id/leave', auth, async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(userId)) return res.status(400).json({ message: 'Not a member' });
    group.members = group.members.filter(id => id !== userId);
    await group.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to leave group', error: err.message });
  }
});

module.exports = router; 