const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 方案：用 Render.com 的 Deploy API
// 但更简单的方式是用 Railway 或直接用 IP 访问

// 最简方案：把论坛打包成单文件，用 node 直接运行
// 然后通过阿里云函数计算 FC 部署（免费额度）

console.log('📦 打包论坛文件...');

const files = ['index.html', 'i18n.js', 'app.js', 'server.js', 'package.json', 'default-topics.json'];
const outDir = path.join(__dirname, 'deploy');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

files.forEach(f => {
  const src = path.join(__dirname, f);
  const dst = path.join(outDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`  ✅ ${f}`);
  }
});

// 创建 .gitignore
fs.writeFileSync(path.join(outDir, '.gitignore'), 'node_modules/\ndata/\n');

console.log('\n📁 部署包已生成: ' + outDir);
console.log('\n下一步：');
console.log('1. 手动上传到 GitHub/Gitee');
console.log('2. 或部署到阿里云函数计算 FC');
console.log('3. 或部署到阿里云 ECS');
