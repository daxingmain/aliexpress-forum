const https = require('https');
const http = require('http');

// ===== Forum Server =====
const PORT = process.env.PORT || 3000;

const forumData = [
  {
    id: 1,
    title: "欢迎加入速卖通招商论坛",
    author: "管理员",
    content: "这里是速卖通招商交流平台，欢迎各供应商入驻。",
    date: "2026-04-01",
    replies: 0
  }
];

function renderHTML(path) {
  const isHome = path === '/' || path === '';
  
  let body = '';
  if (isHome) {
    body = `
      <h1>🏪 速卖通招商论坛</h1>
      <p>供应商交流与招商信息发布平台</p>
      <hr>
      ${forumData.map(post => `
        <div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;">
          <h3><a href="/post/${post.id}">${post.title}</a></h3>
          <p style="color:#666;">${post.author} · ${post.date} · ${post.replies} 回复</p>
        </div>
      `).join('')}
      <hr>
      <a href="/new" style="background:#ff6a00;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">发布新帖</a>
    `;
  } else if (path.startsWith('/post/')) {
    const id = parseInt(path.split('/')[2]);
    const post = forumData.find(p => p.id === id);
    if (post) {
      body = `
        <h1>${post.title}</h1>
        <p style="color:#666;">${post.author} · ${post.date}</p>
        <p>${post.content}</p>
        <a href="/">← 返回列表</a>
      `;
    } else {
      body = '<h1>帖子不存在</h1><a href="/">返回首页</a>';
    }
  } else if (path === '/new') {
    body = `
      <h1>发布新帖</h1>
      <form method="POST" action="/new">
        <input type="text" name="title" placeholder="标题" required style="width:100%;padding:10px;margin:5px 0;"><br>
        <textarea name="content" placeholder="内容" rows="6" required style="width:100%;padding:10px;margin:5px 0;"></textarea><br>
        <button type="submit" style="background:#ff6a00;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">发布</button>
      </form>
      <br><a href="/">← 返回列表</a>
    `;
  } else {
    body = '<h1>404 - 页面不存在</h1><a href="/">返回首页</a>';
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>速卖通招商论坛</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    a { color: #ff6a00; }
    input, textarea { border: 1px solid #ddd; border-radius: 5px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/new') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      forumData.unshift({
        id: forumData.length + 1,
        title: params.get('title'),
        author: '匿名用户',
        content: params.get('content'),
        date: new Date().toISOString().split('T')[0],
        replies: 0
      });
      res.writeHead(302, { Location: '/' });
      res.end();
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHTML(req.url));
  }
});

server.listen(PORT, () => {
  console.log(`Forum running on port ${PORT}`);
});
