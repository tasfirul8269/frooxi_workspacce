const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const Organization = require('../models/Organization');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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
    let roleName = accountType;
    let permissions = [];
    if (accountType === 'employee' && roleId) {
      const role = await Role.findById(roleId);
      if (role) {
        roleName = role.name;
        permissions = role.permissions;
      }
    } else if (accountType === 'admin') {
      permissions = ['create_tasks', 'manage_team', 'create_channels'];
    }
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar,
      role: roleName,
      organizationId: user.organizationId,
      permissions,
      createdAt: new Date(),
    });
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
    const { name, email, avatar, role, roleId, permissions, position } = req.body;
    const target = await User.findOne({ _id: req.params.id, organizationId: user.organizationId });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (name) target.name = name;
    if (email) target.email = email;
    if ('avatar' in req.body) target.avatar = avatar;
    if (roleId) {
      const roleDoc = await Role.findById(roleId);
      if (roleDoc) target.role = roleDoc.name;
    } else if (role) {
      target.role = role;
    }
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

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
});

// Setup 2FA - Generate secret and QR code
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Frooxi Workspace (${user.email})`,
      issuer: 'Frooxi Workspace',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Save secret and backup codes (but don't enable yet)
    user.twoFactorSecret = secret.base32;
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
      message: '2FA setup initiated. Please verify with a code to enable.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to setup 2FA', error: err.message });
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up. Please setup first.' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps tolerance
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({ 
      message: '2FA enabled successfully',
      backupCodes: user.twoFactorBackupCodes
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify 2FA', error: err.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable 2FA', error: err.message });
  }
});

// Get 2FA status
router.get('/2fa/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      enabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret,
      hasBackupCodes: user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get 2FA status', error: err.message });
  }
});

// Verify 2FA token (for login)
router.post('/2fa/verify-login', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      return res.status(400).json({ message: 'Email and token are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }

    // Check if it's a backup code
    if (user.twoFactorBackupCodes.includes(token)) {
      // Remove used backup code
      user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(code => code !== token);
      await user.save();
      
      // Get organization data if user has one
      let organization = null;
      if (user.organizationId) {
        organization = await Organization.findById(user.organizationId);
      }
      
      // Generate JWT token
      const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ 
        token: jwtToken, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          organizationId: user.organizationId 
        },
        organization: organization ? {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          status: organization.status
        } : null,
        message: 'Login successful with backup code'
      });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Get organization data if user has one
    let organization = null;
    if (user.organizationId) {
      organization = await Organization.findById(user.organizationId);
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token: jwtToken, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        organizationId: user.organizationId 
      },
      organization: organization ? {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        status: organization.status
      } : null,
      message: 'Login successful'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify 2FA', error: err.message });
  }
});

module.exports = router;
module.exports.auth = auth; 