const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

console.log('🧹 Clearing any demo data...');

try {
  if (fs.existsSync(USERS_FILE)) {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    // Filter out any demo accounts
    const realUsers = users.filter(user => 
      !user.email.includes('demo.com') && 
      !user.email.includes('example.com')
    );
    
    if (realUsers.length < users.length) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(realUsers, null, 2));
      console.log('✅ Removed demo accounts. Real users:', realUsers.length);
      realUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    } else {
      console.log('✅ No demo accounts found. Real users:', realUsers.length);
    }
  } else {
    console.log('✅ No users file found - starting fresh with real signups only');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
