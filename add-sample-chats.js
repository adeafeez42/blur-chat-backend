const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

// Load existing data
let users = [];
let messages = [];

try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  }
  if (fs.existsSync(MESSAGES_FILE)) {
    messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  }
} catch (error) {
  console.log('Starting fresh');
}

// Find your user ID
const yourUser = users.find(u => u.email === 'shuttdavid9@gmail.com');
if (yourUser) {
  console.log(`✅ Found your account: ${yourUser.name} (ID: ${yourUser.id})`);
  
  // Add sample messages between you and demo users
  const demoUserIds = [1, 2, 3, 4]; // Alex, Sarah, Mike, Emma
  
  const sampleMessages = [
    { text: "Hey there! 👋", senderId: yourUser.id, receiverId: 1 },
    { text: "Hello! How's it going?", senderId: 1, receiverId: yourUser.id },
    { text: "Just working on this cool chat app! 🚀", senderId: yourUser.id, receiverId: 1 },
    { text: "That sounds awesome! Can't wait to try it out.", senderId: 1, receiverId: yourUser.id },
    
    { text: "Hi! Love your profile picture! 📸", senderId: 2, receiverId: yourUser.id },
    { text: "Thanks! Yours is great too! 😊", senderId: yourUser.id, receiverId: 2 },
    
    { text: "What are you up to today?", senderId: yourUser.id, receiverId: 3 },
    { text: "Just cooking some dinner 🍳", senderId: 3, receiverId: yourUser.id },
    { text: "Nice! What are you making?", senderId: yourUser.id, receiverId: 3 },
    
    { text: "Good morning! ☀️", senderId: 4, receiverId: yourUser.id },
    { text: "Morning! Ready for the day?", senderId: yourUser.id, receiverId: 4 }
  ];

  // Add timestamps to sample messages (spread out over last few days)
  sampleMessages.forEach((msg, index) => {
    const daysAgo = Math.floor(index / 3); // Spread messages over days
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(10 + (index % 8), 30 + (index % 30), 0);
    
    messages.push({
      id: Date.now() + index,
      ...msg,
      timestamp: timestamp.toISOString(),
      status: 'read',
      readBy: [msg.receiverId]
    });
  });

  // Save the updated messages
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  console.log(`✅ Added ${sampleMessages.length} sample messages to your chat history`);
  console.log(`💬 Total messages now: ${messages.length}`);
} else {
  console.log('❌ Your account not found yet. Please login first to create your account.');
}
