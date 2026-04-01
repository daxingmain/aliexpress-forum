const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const deployDir = path.join(__dirname, 'deploy');
const zipPath = path.join(__dirname, 'forum-deploy.zip');

// 用 PowerShell 压缩
try {
  execSync(`powershell -Command "Compress-Archive -Path '${deployDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
  console.log('✅ 部署包已生成:', zipPath);
  console.log('文件大小:', fs.statSync(zipPath).size, 'bytes');
} catch(e) {
  console.error('压缩失败:', e.message);
}
