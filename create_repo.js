const https = require('https');

const auth = Buffer.from('daxingmain:daxing99$').toString('base64');

const data = JSON.stringify({ name: 'aliexpress-forum', private: false });

const options = {
  hostname: 'api.github.com',
  path: '/user/repos',
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + auth,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
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
