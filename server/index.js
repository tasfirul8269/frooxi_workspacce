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
app.use('/api/auth', require('./routes/auth'));

// TODO: Add auth routes here

// Upload routes
app.use('/api/upload', require('./routes/upload'));

// Users routes
app.use('/api/users', require('./routes/users'));

// Roles routes
app.use('/api/roles', require('./routes/roles'));

// Tasks routes
app.use('/api/tasks', require('./routes/tasks'));

// Chat routes
app.use('/api/chat', require('./routes/chat'));

const meetingsRoute = require('./routes/meetings');
app.use('/api/meetings', meetingsRoute);

const voiceChannelUsers = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_voice', ({ channelId, user }) => {
    socket.join(channelId);
    if (!voiceChannelUsers[channelId]) voiceChannelUsers[channelId] = [];
    if (!voiceChannelUsers[channelId].some(u => u.socketId === socket.id)) {
      voiceChannelUsers[channelId].push({ socketId: socket.id, ...user });
    }
    io.to(channelId).emit('voice:users', voiceChannelUsers[channelId]);
  });

  socket.on('leave_voice', ({ channelId }) => {
    socket.leave(channelId);
    if (voiceChannelUsers[channelId]) {
      voiceChannelUsers[channelId] = voiceChannelUsers[channelId].filter(u => u.socketId !== socket.id);
      io.to(channelId).emit('voice:users', voiceChannelUsers[channelId]);
    }
  });

  // WebRTC signaling
  socket.on('voice:signal', ({ channelId, to, data }) => {
    socket.to(to).emit('voice:signal', { from: socket.id, data });
  });

  socket.on('disconnect', () => {
    for (const channelId in voiceChannelUsers) {
      const before = voiceChannelUsers[channelId].length;
      voiceChannelUsers[channelId] = voiceChannelUsers[channelId].filter(u => u.socketId !== socket.id);
      if (voiceChannelUsers[channelId].length !== before) {
        io.to(channelId).emit('voice:users', voiceChannelUsers[channelId]);
      }
    }
    console.log('Socket disconnected:', socket.id);
  });
});

app.set('io', io);

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 