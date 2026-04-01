const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'rnd_ngRQmaQm683F1DGPQxAnROmQeASN';

function api(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      hostname: 'api.render.com',
      path: apiPath,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        console.log(`  ${res.statusCode} ${method} ${apiPath}`);
        try { resolve(JSON.parse(responseData)); }
        catch(e) { resolve({ raw: responseData }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function deploy() {
  console.log('🚀 部署到 Render...\n');
  
  // 创建 Web Service
  console.log('🔧 创建服务...');
  
  const result = await api('POST', '/v1/services', {
    type: 'web_service',
    name: 'aliexpress-forum',
    env: 'node',
    region: 'frankfurt',
    plan: 'free',
    branch: 'master',
    repo: 'https://gitee.com/daxingmain/aliexpress-forum.git',
    autoDeploy: true,
    buildCommand: 'npm install',
    startCommand: 'node server.js',
    envVars: []
  });
  
  if (result.service) {
    console.log('\n✅ 服务创建成功！');
    console.log('  服务 ID:', result.service.id);
    console.log('  名称:', result.service.name);
    console.log('  URL:', result.service.serviceDetails?.url || '部署中...');
    console.log('  状态:', result.service.status);
  } else if (result.message) {
    console.log('\n❌ 创建失败:', result.message);
    console.log('  详情:', JSON.stringify(result).substring(0, 300));
  } else {
    console.log('\n⚠️ 响应:', JSON.stringify(result).substring(0, 300));
  }
}

deploy().catch(e => console.error('Error:', e.message));
