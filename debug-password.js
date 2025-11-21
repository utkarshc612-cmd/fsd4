const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test various common passwords to find what hashes to the admin password
const testPasswords = ['admin', 'password', '123456', 'Admin@123', 'test', 'teacher', ''];
const adminHashFromDB = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

console.log('Admin password hash from DB:', adminHashFromDB);
console.log('\nTesting common passwords:');

testPasswords.forEach(pwd => {
  const hash = hashPassword(pwd);
  const match = hash === adminHashFromDB ? ' ← MATCH!' : '';
  console.log(`  "${pwd}": ${hash}${match}`);
});

// Also show what "admin" hashes to
console.log('\nHash of "admin":', hashPassword('admin'));

// Try reading the backend database to find if there's a note about the password
try {
  const db = require('./package.json/models.js').db || require('fs').readFileSync('./backend-data.json', 'utf8');
  console.log('\nChecking backend-data.json for teacher records...');
  const data = JSON.parse(db);
  if (data.teachers) {
    data.teachers.forEach(t => {
      console.log(`Teacher: ${t.username} (name: ${t.name}, hash: ${t.passwordHash})`);
    });
  }
} catch (e) {
  console.log('Could not read backend data:', e.message);
}
