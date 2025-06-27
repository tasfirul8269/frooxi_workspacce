const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const router = express.Router();

// Auth middleware (reuse from users.js)
const { auth } = require('./users');

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    console.log('TASK CREATE PAYLOAD', req.body);
    console.log('TASK CREATE PAYLOAD (stringified)', JSON.stringify(req.body));
    const { title, description, status, priority, assigneeId, createdById, organizationId, startDate, dueDate, tags, attachments, subtasks, comments, activities } = req.body;
    // Always add a 'created' activity
    const createdActivity = {
      id: Date.now().toString(),
      type: 'created',
      description: 'Task created',
      userId: req.userId, // from auth middleware
      createdAt: new Date(),
    };
    // Filter out any duplicate 'created' activities (by type and userId)
    let finalActivities = Array.isArray(activities) ? activities.filter(a => !(a.type === 'created' && a.userId === req.userId)) : [];
    finalActivities.unshift(createdActivity); // always put at the start
    const task = new Task({
      title,
      description,
      status,
      priority,
      assigneeId,
      createdById,
      organizationId,
      startDate,
      dueDate,
      tags,
      attachments,
      subtasks,
      comments,
      activities: finalActivities,
    });
    await task.save();
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
});

// List all tasks for the user's organization
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organizationId) return res.status(403).json({ message: 'Not authorized' });
    const tasks = await Task.find({ organizationId: user.organizationId });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
});

// Get a single task by id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = new Date();
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    let activities = task.activities || [];
    const userId = req.userId;
    // 1. Status change to in_progress
    if (updates.status && updates.status !== task.status && updates.status === 'in_progress') {
      activities.push({
        id: Date.now().toString(),
        type: 'status',
        description: 'Task started',
        userId,
        createdAt: new Date(),
      });
    }
    // 2. Status change to review
    if (updates.status && updates.status !== task.status && updates.status === 'review') {
      activities.push({
        id: Date.now().toString(),
        type: 'status',
        description: 'Task sent for review',
        userId,
        createdAt: new Date(),
      });
    }
    // 3. Status change to completed (approved)
    if (updates.status && updates.status !== task.status && updates.status === 'completed') {
      activities.push({
        id: Date.now().toString(),
        type: 'status',
        description: 'Task approved',
        userId,
        createdAt: new Date(),
      });
    }
    // 4. Status change to todo (rejected)
    if (updates.status && updates.status !== task.status && updates.status === 'todo' && task.status === 'review') {
      activities.push({
        id: Date.now().toString(),
        type: 'status',
        description: 'Task rejected',
        userId,
        createdAt: new Date(),
      });
    }
    // 5. Subtask completion
    if (updates.subtasks) {
      const prevSubtasks = task.subtasks || [];
      const newSubtasks = updates.subtasks;
      newSubtasks.forEach((st) => {
        const prev = prevSubtasks.find(pst => pst.id === st.id);
        if (prev && !prev.completed && st.completed) {
          activities.push({
            id: Date.now().toString(),
            type: 'subtask',
            description: `Subtask "${st.title}" completed`,
            userId,
            createdAt: new Date(),
          });
        }
      });
    }
    // 6. New attachments
    if (updates.attachments) {
      const prevAttachments = task.attachments || [];
      const newAttachments = updates.attachments;
      newAttachments.forEach((att) => {
        if (!prevAttachments.find(pa => pa.id === att.id)) {
          activities.push({
            id: Date.now().toString(),
            type: 'attachment',
            description: `Attachment "${att.name}" added`,
            userId,
            createdAt: new Date(),
          });
        }
      });
    }
    // Save activities
    updates.activities = activities;
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ task: updatedTask });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
});

// Add a comment to a task
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(403).json({ message: 'Not authorized' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const comment = {
      id: Date.now().toString(),
      content,
      authorId: user._id.toString(),
      createdAt: new Date(),
    };
    task.comments.push(comment);
    // Add activity for comment
    task.activities.push({
      id: Date.now().toString(),
      type: 'comment',
      description: 'Comment added',
      userId: req.userId,
      createdAt: new Date(),
    });
    await task.save();
    res.json({ comment, task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
});

// Delete a comment from a task
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(403).json({ message: 'Not authorized' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const commentIndex = task.comments.findIndex(c => c.id === req.params.commentId);
    if (commentIndex === -1) return res.status(404).json({ message: 'Comment not found' });
    // Only author or admin can delete
    if (task.comments[commentIndex].authorId !== user._id.toString() && user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    task.comments.splice(commentIndex, 1);
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment', error: err.message });
  }
});

// Remove custom activity addition
router.post('/:id/activities', auth, async (req, res) => {
  res.status(403).json({ message: 'Custom activities are not allowed.' });
});

module.exports = router; 