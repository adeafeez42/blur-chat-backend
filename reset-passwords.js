const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

console.log('🔍 Checking current users and passwords...');

try {
  if (fs.existsSync(USERS_FILE)) {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    console.log('📋 Current users:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
      console.log(`     Password: "${user.password}"`);
      console.log(`     Username: ${user.username}`);
      console.log(`     ID: ${user.id}`);
      console.log(`     ---`);
    });
    
    // Ask if you want to reset passwords
    console.log('\\n🔄 Do you want to reset all passwords to "password123"?');
    console.log('   This will allow you to login with your existing emails.');
    
    // For now, let's just show the current state
    console.log('\\n🎯 To fix login issues:');
    console.log('   1. Use the exact password shown above for each account');
    console.log('   2. OR delete the users file and create new accounts');
    console.log('   3. OR run: node fix-passwords.js to reset all passwords');
    
  } else {
    console.log('❌ No users file found');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
