const http = require('http');

const data = JSON.stringify({
  name: 'Test Teacher',
  school: 'Test School',
  email: 'test@example.com',
  subjects: ['Math']
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/teacher-requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response: ${responseData}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
