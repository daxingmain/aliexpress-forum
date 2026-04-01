const https = require('https');

// 方案：用 GitHub API 创建仓库 + 推送文件（不需要 git clone）
// 通过 GitHub Contents API 逐个上传文件

const USER = 'daxingmain';
const PASS = 'daxing99$';
const REPO = 'aliexpress-forum';
const AUTH = Buffer.from(`${USER}:${PASS}`).toString('base64');

const fs = require('fs');
const path = require('path');

function api(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: method,
      headers: {
        'Authorization': 'Basic ' + AUTH,
        'Accept': 'application/vnd.github.v3+json',
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
  console.log('🚀 部署到 GitHub + Render...\n');
  
  // 1. 检查仓库是否存在
  console.log('📋 检查仓库...');
  const check = await api('GET', `/repos/${USER}/${REPO}`);
  
  if (check.message === 'Not Found') {
    // 创建仓库
    console.log('📦 创建仓库...');
    const create = await api('POST', '/user/repos', JSON.stringify({
      name: REPO,
      private: false,
      auto_init: false
    }));
    if (create.errors) {
      console.error('❌ 创建仓库失败:', JSON.stringify(create.errors));
      return;
    }
    console.log('✅ 仓库已创建');
  } else if (check.id) {
    console.log('✅ 仓库已存在');
  } else {
    console.log('⚠️ 检查响应:', JSON.stringify(check).substring(0, 100));
  }
  
  // 2. 创建初始提交（包含所有文件）
  console.log('\n📤 上传文件...');
  
  const files = [
    'index.html', 'i18n.js', 'app.js', 'server.js', 
    'package.json', 'default-topics.json', '.gitignore'
  ];
  
  // 创建 tree
  const tree = [];
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      tree.push({
        path: file,
        mode: '100644',
        type: 'blob',
        content: content
      });
      console.log(`  ✅ ${file}`);
    }
  }
  
  // 创建 tree
  const createTree = await api('POST', `/repos/${USER}/${REPO}/git/trees`, JSON.stringify({
    tree: tree
  }));
  
  if (createTree.sha) {
    console.log('\n✅ Tree 创建成功:', createTree.sha);
    
    // 创建 commit
    const createCommit = await api('POST', `/repos/${USER}/${REPO}/git/commits`, JSON.stringify({
      message: 'Initial commit - AliExpress Forum',
      tree: createTree.sha,
      parents: []
    }));
    
    if (createCommit.sha) {
      console.log('✅ Commit 创建成功:', createCommit.sha);
      
      // 更新 master 分支
      const updateRef = await api('PATCH', `/repos/${USER}/${REPO}/git/refs/heads/master`, JSON.stringify({
        sha: createCommit.sha,
        force: true
      }));
      
      if (updateRef.ref || updateRef.object) {
        console.log('✅ 分支更新成功！');
        console.log('\n🎉 代码已推送到 GitHub！');
        console.log(`https://github.com/${USER}/${REPO}`);
        console.log('\n现在可以去 Render 连接这个仓库了');
      } else {
        console.log('⚠️ 更新分支响应:', JSON.stringify(updateRef).substring(0, 200));
      }
    } else {
      console.log('⚠️ Commit 响应:', JSON.stringify(createCommit).substring(0, 200));
    }
  } else {
    console.log('⚠️ Tree 响应:', JSON.stringify(createTree).substring(0, 200));
  }
}

deploy().catch(e => console.error('Error:', e.message));
