// 用 Vercel API 直接部署（支持 ZIP 上传，无需 Git）
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 部署配置
const TEAM_ID = ''; // 需要用户提供
const TOKEN = '';    // 需要用户提供

function api(method, apiPath, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: apiPath,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js'
      }
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  ${res.statusCode} ${method} ${apiPath}`);
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function deploy() {
  console.log('🚀 开始部署到 Vercel...\n');
  
  // 1. 获取用户信息
  const user = await api('GET', '/v2/user', null, TOKEN);
  if (user.error) {
    console.error('❌ 认证失败:', user.error.message);
    return;
  }
  console.log('✅ 用户:', user.user.username);
  
  // 2. 创建部署
  const deploy = await api('POST', '/v13/deployments?teamId=' + TEAM_ID,
    JSON.stringify({
      name: 'aliexpress-forum',
      project: 'aliexpress-forum',
      target: 'production',
      files: [
        { file: 'index.html', data: fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8') },
        { file: 'i18n.js', data: fs.readFileSync(path.join(__dirname, 'i18n.js'), 'utf8') },
        { file: 'app.js', data: fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8') },
        { file: 'api/topics.js', data: `
          const fs = require('fs');
          const path = require('path');
          const DATA_DIR = path.join(__dirname, '..', 'data');
          const TOPICS_FILE = path.join(DATA_DIR, 'topics.json');
          const REPLIES_FILE = path.join(DATA_DIR, 'replies.json');
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          function readJSON(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }
          function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)); }
          if (!fs.existsSync(TOPICS_FILE)) {
            writeJSON(TOPICS_FILE, []);
            writeJSON(REPLIES_FILE, []);
          }
          module.exports = async (req, res) => {
            if (req.method === 'GET') {
              const topics = readJSON(TOPICS_FILE, []);
              const cat = req.query.cat;
              const filtered = cat ? topics.filter(t => t.cat === parseInt(cat)) : topics;
              filtered.sort((a, b) => { if (a.pin && !b.pin) return -1; if (!a.pin && b.pin) return 1; return new Date(b.ts) - new Date(a.ts); });
              res.json(filtered);
            } else if (req.method === 'POST') {
              const { cat, title, author, lang, content } = req.body;
              const topics = readJSON(TOPICS_FILE, []);
              const id = topics.length ? Math.max(...topics.map(t => t.id)) + 1 : 1;
              topics.push({ id, cat: parseInt(cat), pin: 0, res: 0, views: 0, rp: 0, author, role: 'merchant', ts: new Date().toISOString().slice(0, 16).replace('T', ' '), title: { [lang]: title }, content: { [lang]: content } });
              writeJSON(TOPICS_FILE, topics);
              res.json({ id, message: 'OK' });
            }
          };
        ` },
      ]
    }),
    TOKEN
  );
  
  console.log('\n✅ 部署已创建！');
  console.log('URL:', deploy.url || deploy.alias || '等待部署完成...');
}

deploy().catch(e => console.error('Error:', e.message));
