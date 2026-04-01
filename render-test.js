const https = require('https');

const API_KEY = 'rnd_ngRQmaQm683F1DGPQxAnROmQeASN';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js'
      }
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data.substring(0, 500));
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  console.log('测试 Render API 端点...\n');
  
  // 尝试不同的端点
  const endpoints = [
    '/v1/owner',
    '/v1/services',
    '/v1/user',
    '/v1/account',
    '/v1/blueprints',
  ];
  
  for (const ep of endpoints) {
    console.log(`\n📡 GET ${ep}`);
    await api('GET', ep);
  }
}

test().catch(e => console.error('Error:', e.message));
