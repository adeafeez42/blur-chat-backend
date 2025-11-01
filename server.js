const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Data storage
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Error loading data:', error);
  }
  return { users: [], messages: [], typingUsers: {} };
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error saving data:', error);
  }
}

let appData = loadData();

// Store online users and their socket IDs
const onlineUsers = new Map();
const typingUsers = new Map();

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blur Chat Backend', 
    users: appData.users.length,
    messages: appData.messages.length,
    online: onlineUsers.size
  });
});

// Get all users except current user with last message info
app.get('/api/users', (req, res) => {
  const exceptId = req.query.except;
  
  const usersWithLastMessage = appData.users
    .filter(user => user.id != exceptId)
    .map(user => {
      // Find last message between current user and this contact
      const lastMessage = appData.messages
        .filter(msg => {
          const participants = [msg.senderId, msg.receiverId];
          return participants.includes(exceptId) && participants.includes(user.id);
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      return {
        ...user,
        isOnline: onlineUsers.has(user.id),
        lastSeen: user.lastSeen || 'Recently',
        lastMessage: lastMessage ? {
          text: lastMessage.text,
          timestamp: lastMessage.timestamp,
          senderId: lastMessage.senderId
        } : null
      };
    })
    // Sort by last message timestamp (most recent first), then by online status
    .sort((a, b) => {
      // Both have last messages
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      }
      // Only A has last message
      if (a.lastMessage && !b.lastMessage) return -1;
      // Only B has last message
      if (!a.lastMessage && b.lastMessage) return 1;
      // Neither has last messages, sort by online status
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      // Both offline, sort by name
      return a.name.localeCompare(b.name);
    });

  res.json({ users: usersWithLastMessage });
});

// Authentication routes
app.post('/api/auth/signup', (req, res) => {
  const { name, username, email, password } = req.body;
  
  // Check if user already exists
  const existingUser = appData.users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    return res.json({ 
      success: false, 
      message: 'User already exists with this email or username' 
    });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    username,
    email,
    password, // In real app, hash this!
    avatar: '👤',
    createdAt: new Date().toISOString(),
    lastSeen: 'Online'
  };

  appData.users.push(newUser);
  saveData(appData);

  res.json({ 
    success: true, 
    user: { 
      id: newUser.id, 
      name: newUser.name, 
      username: newUser.username, 
      email: newUser.email,
      avatar: newUser.avatar
    } 
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = appData.users.find(u => u.email === email && u.password === password);
  if (user) {
    // Update last seen
    user.lastSeen = 'Online';
    saveData(appData);

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        username: user.username, 
        email: user.email,
        avatar: user.avatar
      } 
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }
});

// Get chat history between two users
app.get('/api/messages/:userId1/:userId2', (req, res) => {
  const { userId1, userId2 } = req.params;
  const chatKey = [userId1, userId2].sort().join('_');
  
  const messages = appData.messages.filter(msg => {
    const msgChatKey = [msg.senderId, msg.receiverId].sort().join('_');
    return msgChatKey === chatKey;
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json({ messages });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('✅✅✅ User connected:', socket.id);

  socket.on('user_joined', (userData) => {
    console.log('👤 User joined:', userData.name);
    
    // Store user connection
    onlineUsers.set(userData.id, {
      socketId: socket.id,
      user: userData,
      lastSeen: 'Online'
    });

    // Update user status in database
    const user = appData.users.find(u => u.id === userData.id);
    if (user) {
      user.lastSeen = 'Online';
      saveData(appData);
    }

    // Broadcast online status to all clients
    io.emit('user_online', {
      userId: userData.id,
      userName: userData.name,
      isOnline: true
    });

    // Send current online users to the connected user
    const onlineUsersList = Array.from(onlineUsers.values()).map(u => ({
      id: u.user.id,
      name: u.user.name,
      isOnline: true
    }));
    
    socket.emit('online_users', onlineUsersList);
    console.log('📊 Online users:', onlineUsersList.length);
  });

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    console.log('📤 Message received:', messageData);
    
    // Generate unique ID for message
    const message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'sent',
      read: false
    };

    // Save message to database
    appData.messages.push(message);
    saveData(appData);

    // Find receiver's socket ID
    const receiverSocket = onlineUsers.get(message.receiverId);
    const senderSocket = onlineUsers.get(message.senderId);

    // Send to receiver if online
    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit('new_message', {
        ...message,
        status: 'delivered'
      });
      console.log('📨 Message delivered to receiver');
    }

    // Send confirmation to sender
    if (senderSocket) {
      io.to(senderSocket.socketId).emit('message_sent', {
        ...message,
        status: receiverSocket ? 'delivered' : 'sent'
      });
    }

    // Update message status in database
    const savedMessage = appData.messages.find(m => m.id === message.id);
    if (savedMessage) {
      savedMessage.status = receiverSocket ? 'delivered' : 'sent';
      saveData(appData);
    }

    // Notify both users to update their chat lists
    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit('chat_updated', {
        contactId: message.senderId,
        lastMessage: message
      });
    }
    if (senderSocket) {
      io.to(senderSocket.socketId).emit('chat_updated', {
        contactId: message.receiverId,
        lastMessage: message
      });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { userId, contactId, userName } = data;
    console.log('⌨️ User typing:', userName);
    
    // Store typing state
    typingUsers.set(userId, { contactId, userName });
    
    // Notify the contact
    const contactSocket = onlineUsers.get(contactId);
    if (contactSocket) {
      io.to(contactSocket.socketId).emit('user_typing', {
        userId,
        userName,
        contactId
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const { userId, contactId } = data;
    console.log('⌨️ User stopped typing:', userId);
    
    // Remove typing state
    typingUsers.delete(userId);
    
    // Notify the contact
    const contactSocket = onlineUsers.get(contactId);
    if (contactSocket) {
      io.to(contactSocket.socketId).emit('user_stopped_typing', {
        userId,
        contactId
      });
    }
  });

  // Handle message read receipts
  socket.on('mark_messages_read', (data) => {
    const { userId, contactId } = data;
    console.log('📖 Marking messages as read:', { userId, contactId });

    // Update messages in database
    appData.messages.forEach(msg => {
      if (msg.senderId === contactId && msg.receiverId === userId && !msg.read) {
        msg.read = true;
        msg.readAt = new Date().toISOString();
      }
    });
    saveData(appData);

    // Notify the sender that messages were read
    const senderSocket = onlineUsers.get(contactId);
    if (senderSocket) {
      io.to(senderSocket.socketId).emit('messages_read', {
        readerId: userId,
        contactId: contactId
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Find and remove disconnected user
    let disconnectedUser = null;
    for (let [userId, userData] of onlineUsers.entries()) {
      if (userData.socketId === socket.id) {
        disconnectedUser = { userId, userData };
        onlineUsers.delete(userId);
        break;
      }
    }

    // Update user status in database
    if (disconnectedUser) {
      const user = appData.users.find(u => u.id === disconnectedUser.userId);
      if (user) {
        user.lastSeen = new Date().toLocaleTimeString();
        saveData(appData);
      }

      // Broadcast offline status
      io.emit('user_offline', {
        userId: disconnectedUser.userId,
        userName: disconnectedUser.userData.user.name,
        isOnline: false,
        lastSeen: user?.lastSeen || 'Recently'
      });
    }

    // Remove typing states for disconnected user
    for (let [userId, typingData] of typingUsers.entries()) {
      if (typingData.socketId === socket.id) {
        typingUsers.delete(userId);
      }
    }

    console.log('📊 Online users after disconnect:', onlineUsers.size);
  });

  // Test endpoint
  socket.on('test_ping', (data) => {
    console.log('🏓 Test ping received:', data);
    socket.emit('test_pong', { message: 'Pong from server!', data });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('📁 Loaded existing users:', appData.users.length);
  console.log('🚀 Server running on port', PORT);
  console.log('🔐 REAL AUTHENTICATION - No demo accounts');
  console.log('👥 Registered users:', appData.users.length);
  console.log('💾 Permanent storage: Enabled');
  console.log('🌐 CORS enabled for: http://localhost:3000');
});
