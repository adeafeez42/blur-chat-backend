const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

console.log('🔄 Starting fresh - removing all users...');

try {
  if (fs.existsSync(USERS_FILE)) {
    // Create empty users array
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    console.log('✅ All users removed - fresh start!');
    console.log('🎯 You can now sign up with any email');
  } else {
    console.log('✅ Already fresh - no users file found');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
