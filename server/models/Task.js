const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  id: String,
  name: String,
  url: String,
  size: Number,
  type: String,
  uploadedBy: String,
  uploadedAt: Date,
}, { _id: false });

const SubtaskSchema = new mongoose.Schema({
  id: String,
  title: String,
  completed: Boolean,
  createdAt: Date,
}, { _id: false });

const CommentSchema = new mongoose.Schema({
  id: String,
  content: String,
  authorId: String,
  createdAt: Date,
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
  id: String,
  type: String,
  description: String,
  userId: String,
  createdAt: Date,
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  assigneeId: { type: String },
  createdById: { type: String, required: true },
  organizationId: { type: String, required: true },
  startDate: { type: Date },
  dueDate: { type: Date },
  tags: [String],
  attachments: [AttachmentSchema],
  subtasks: [SubtaskSchema],
  comments: [CommentSchema],
  activities: [ActivitySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', TaskSchema); 