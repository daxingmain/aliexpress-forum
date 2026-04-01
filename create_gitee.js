const https = require('https');

const auth = Buffer.from('daxingmain:daxing99$').toString('base64');

const data = JSON.stringify({
  name: 'aliexpress-forum',
  auto_init: true,
  private: false,
  description: 'AliExpress Overseas Hosting Merchant Forum'
});

const options = {
  hostname: 'gitee.com',
  path: '/api/v5/user/repos',
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + auth,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'User-Agent': 'Node.js'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
