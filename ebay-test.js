const https = require('https');

// eBay API 配置
const CLIENT_ID = ''; // 需要用户提供
const CLIENT_SECRET = ''; // 需要用户提供

// 先用用户名密码测试 eBay 登录
function testEbayLogin() {
  return new Promise((resolve, reject) => {
    const postData = 'grant_type=password' +
      '&username=daxing' +
      '&password=daxing99%24' +
      '&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope';
    
    const options = {
      hostname: 'api.ebay.com',
      path: '/identity/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Node.js'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data.substring(0, 1000));
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔍 测试 eBay API...\n');
  
  // eBay 需要 Client ID 和 Client Secret 才能调用 API
  // 用户名密码方式已不再支持
  console.log('⚠️ eBay API 需要 Developer Account 的 Client ID 和 Client Secret');
  console.log('\n获取方式：');
  console.log('1. 登录 https://developer.ebay.com');
  console.log('2. 进入 My Account → API Keys');
  console.log('3. 创建 Application Key');
  console.log('4. 获取 Client ID 和 Client Secret');
  console.log('\n拿到后发给我，我就能调用 eBay API 获取热销商品和卖家信息！');
}

main();
