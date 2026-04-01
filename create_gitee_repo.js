// 用 Gitee API 创建仓库
const https = require('https');

const data = JSON.stringify({
  access_token: '',
  name: 'aliexpress-forum',
  auto_init: false,
  private: false
});

const options = {
  hostname: 'gitee.com',
  path: '/api/v5/user/repos',
  method: 'POST',
  headers: {
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
