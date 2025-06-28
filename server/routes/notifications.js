const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendEmail } = require('../config/email');

// Create and send notification via WebSocket
router.post('/create', auth, async (req, res) => {
  try {
    const { type, title, body, targetUserId, userEmail, options } = req.body;
    const User = require('../models/User');
    
    console.log('📧 Creating notification:', {
      type,
      title,
      body,
      targetUserId,
      userEmail,
      emailEnabled: options?.emailEnabled
    });
    
    // Validate required fields
    if (!type || !title || !body || !targetUserId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields: type, title, body, targetUserId' 
      });
    }

    // Fetch target user's notification settings from DB
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }
    const targetSettings = targetUser.notificationSettings || {
      email: true,
      push: true,
      taskUpdates: true,
      mentions: true,
      meetings: true,
      chatMessages: true,
    };
    console.log('📧 Target user notification settings:', targetSettings);

    // Create notification object
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      body,
      timestamp: new Date(),
      read: false,
      userId: targetUserId,
      data: options?.data
    };

    // Check if push notifications are enabled for target user
    const typeEnabled = {
      task: targetSettings.taskUpdates,
      message: targetSettings.chatMessages,
      mention: targetSettings.mentions,
      meeting: targetSettings.meetings,
      reminder: targetSettings.meetings,
    }[type];
    const pushEnabled = targetSettings.push && typeEnabled;
    console.log('📧 Push notification enabled for target user:', pushEnabled);

    // Only emit WebSocket notification if push notifications are enabled for target user
    if (pushEnabled) {
      // Emit notification via WebSocket to target user
      const io = req.app.get('io');
      io.to(`user_${targetUserId}`).emit('notification:new', notification);
      console.log('✅ Notification sent via WebSocket to user:', targetUserId);
    } else {
      console.log('📧 WebSocket notification skipped - push disabled for target user');
    }

    // Only send email if receiver's settings allow it
    const emailEnabled = targetSettings.email && !!userEmail && typeEnabled;
    console.log('📧 Email enabled for this notification:', emailEnabled);

    if (emailEnabled && userEmail && options?.emailSubject && options?.emailBody) {
      try {
        console.log('📧 Sending email notification to:', userEmail);
        await sendEmail(userEmail, options.emailSubject, options.emailBody);
        console.log('📧 Email notification sent successfully');
      } catch (error) {
        console.error('📧 Email notification failed:', error);
        // Don't fail the request if email fails
      }
    } else {
      console.log('📧 Email notification skipped - disabled or missing data');
    }
    
    res.json({ 
      success: true, 
      message: 'Notification created and sent successfully',
      notification
    });

  } catch (error) {
    console.error('❌ Notification creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create notification',
      error: error.message 
    });
  }
});

// Email notification endpoint
router.post('/email', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    console.log('📧 Email request received:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', body);
    
    // Validate required fields
    if (!to || !subject || !body) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields: to, subject, body' 
      });
    }

    console.log('📧 Attempting to send email...');
    
    // Send the actual email
    const result = await sendEmail(to, subject, body);
    
    console.log('✅ Email sent successfully:', result.messageId);
    
    res.json({ 
      success: true, 
      message: 'Email notification sent successfully',
      data: { to, subject, body, messageId: result.messageId }
    });

  } catch (error) {
    console.error('❌ Email notification error:', error);
    res.status(500).json({ 
      message: 'Failed to send email notification',
      error: error.message 
    });
  }
});

// Get user notification settings
router.get('/settings', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const settings = user.notificationSettings || {
      email: true,
      push: true,
      taskUpdates: true,
      mentions: true,
      meetings: true,
      chatMessages: true,
    };
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch notification settings',
      error: error.message 
    });
  }
});

// Update user notification settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notificationSettings = { ...user.notificationSettings, ...settings };
    await user.save();
    console.log('📝 Notification settings updated for user:', req.userId);
    console.log('Settings:', user.notificationSettings);
    res.json({ 
      success: true, 
      message: 'Notification settings updated successfully',
      settings: user.notificationSettings
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update notification settings',
      error: error.message 
    });
  }
});

// Get notification settings for a specific user (for notification delivery)
router.get('/settings/:userId', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const settings = user.notificationSettings || {
      email: true,
      push: true,
      taskUpdates: true,
      mentions: true,
      meetings: true,
      chatMessages: true,
    };
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch user notification settings',
      error: error.message 
    });
  }
});

module.exports = router; 