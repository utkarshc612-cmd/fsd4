const crypto = require('crypto');

// Simulate password hashing
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test what the admin password should hash to
const adminPassword = 'admin';
const adminHash = hashPassword(adminPassword);
console.log('Hash of "admin":', adminHash);

// Test with the known hash from the database
const knownHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
console.log('Known hash from DB:', knownHash);
console.log('Match:', adminHash === knownHash);

// Test a login request
const http = require('http');

const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length,
    'Origin': 'http://127.0.0.1:5500'
  }
};

console.log('\nTesting login endpoint...');
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(loginData);
req.end();
