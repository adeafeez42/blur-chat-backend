// Fix the avatar emojis in your server.js
const fixedUsers = [
  { 
    id: 1, 
    name: 'Alex Johnson', 
    username: 'alexj', 
    email: 'alex@demo.com', 
    password: 'demo123',
    avatar: '👨‍💻',
    chatPreferences: {
      layout: 'bubble',
      showAvatars: true,
      timestamps: true
    }
  },
  { 
    id: 2, 
    name: 'Sarah Miller', 
    username: 'sarahm', 
    email: 'sarah@demo.com', 
    password: 'demo123',
    avatar: '👩‍🎨',
    chatPreferences: {
      layout: 'bubble',
      showAvatars: true,
      timestamps: true
    }
  },
  { 
    id: 3, 
    name: 'Mike Chen', 
    username: 'mikec', 
    email: 'mike@demo.com', 
    password: 'demo123',
    avatar: '👨‍🍳',
    chatPreferences: {
      layout: 'bubble',
      showAvatars: true,
      timestamps: true
    }
  },
  { 
    id: 4, 
    name: 'Emma Davis', 
    username: 'emmad', 
    email: 'emma@demo.com', 
    password: 'demo123',
    avatar: '👩‍💼',
    chatPreferences: {
      layout: 'bubble',
      showAvatars: true,
      timestamps: true
    }
  }
];

const fixedContacts = [
  { id: 2, name: 'Sarah Miller', username: 'sarahm', avatar: '👩‍🎨', lastSeen: '2 min ago' },
  { id: 3, name: 'Mike Chen', username: 'mikec', avatar: '👨‍🍳', lastSeen: 'Online' },
  { id: 4, name: 'Emma Davis', username: 'emmad', avatar: '👩‍💼', lastSeen: '1 hour ago' },
  { id: 1, name: 'Alex Johnson', username: 'alexj', avatar: '👨‍💻', lastSeen: '5 min ago' }
];
