require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// TODO: Add auth routes here

// Upload routes
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

// Users routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Roles routes
const roleRoutes = require('./routes/roles');
app.use('/api/roles', roleRoutes);

// Tasks routes
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

// Chat routes
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Meetings routes
const meetingRoutes = require('./routes/meetings');
app.use('/api/meetings', meetingRoutes);

// Notifications routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

const voiceChannelUsers = {};
const typingUsers = {};

io.on('connection', (socket) => {
  // Store user info in socket
  socket.user = null;
  socket.voiceChannel = null;

  // Handle user authentication
  socket.on('authenticate', (userData) => {
    socket.user = userData;
    
    // Join user to their personal notification room
    if (userData.id) {
      socket.join(`user_${userData.id}`);
      console.log(`👤 User ${userData.name} (${userData.id}) joined notification room`);
    }
  });

  // Handle joining chat channels
  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    socket.channelId = channelId;
  });

  // Handle leaving chat channels
  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    if (socket.channelId === channelId) {
      socket.channelId = null;
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.channelId).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
      channelId: data.channelId
    });
  });

  // Handle voice channel joining
  socket.on('join-voice-channel', (data) => {
    const { channelId, user } = data;
    
    // Leave previous voice channel if any
    if (socket.voiceChannel) {
      socket.leave(socket.voiceChannel);
      // Remove from previous channel's user list
      if (voiceChannelUsers[socket.voiceChannel]) {
        voiceChannelUsers[socket.voiceChannel] = voiceChannelUsers[socket.voiceChannel].filter(u => u.socketId !== socket.id);
      }
      io.to(socket.voiceChannel).emit('user-left-voice', {
        socketId: socket.id,
        channelId: socket.voiceChannel
      });
    }
    
    // Join new voice channel
    socket.join(channelId);
    socket.voiceChannel = channelId;
    
    // Add to new channel's user list
    if (!voiceChannelUsers[channelId]) {
      voiceChannelUsers[channelId] = [];
    }
    voiceChannelUsers[channelId].push({
      socketId: socket.id,
      user: user
    });
    
    // Notify others in the channel
    socket.to(channelId).emit('user-joined-voice', {
      socketId: socket.id,
      channelId: channelId,
      user: user
    });
    
    // Send current voice users to the joining user
    socket.emit('voice-users', {
      channelId: channelId,
      users: voiceChannelUsers[channelId].filter(u => u.socketId !== socket.id)
    });
  });

  // Handle voice channel leaving
  socket.on('leave-voice-channel', (channelId) => {
    if (socket.voiceChannel === channelId) {
    socket.leave(channelId);
      // Remove from channel's user list
    if (voiceChannelUsers[channelId]) {
      voiceChannelUsers[channelId] = voiceChannelUsers[channelId].filter(u => u.socketId !== socket.id);
      }
      socket.to(channelId).emit('user-left-voice', {
        socketId: socket.id,
        channelId: channelId
      });
      socket.voiceChannel = null;
    }
  });

  // Handle voice signaling
  socket.on('voice-signal', (data) => {
    const { channelId, targetSocketId, signal } = data;
    socket.to(targetSocketId).emit('voice-signal', {
      from: socket.id,
      data: signal
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Leave voice channel on disconnect
    if (socket.voiceChannel) {
      // Remove from channel's user list
      if (voiceChannelUsers[socket.voiceChannel]) {
        voiceChannelUsers[socket.voiceChannel] = voiceChannelUsers[socket.voiceChannel].filter(u => u.socketId !== socket.id);
      }
      socket.to(socket.voiceChannel).emit('user-left-voice', {
        socketId: socket.id,
        channelId: socket.voiceChannel
      });
    }
  });
});

// Clean up expired typing indicators every 5 seconds
setInterval(() => {
  const now = Date.now();
  for (const channelId in typingUsers) {
    typingUsers[channelId] = typingUsers[channelId].filter(u => now - u.last < 3000);
  }
}, 5000);

app.set('io', io);

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => {
      // Server started successfully
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 