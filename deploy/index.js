const express = require('express');
const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const TOPICS_FILE = path.join(DATA_DIR, 'topics.json');
const REPLIES_FILE = path.join(DATA_DIR, 'replies.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Init default data
if (!fs.existsSync(TOPICS_FILE)) {
  const defaults = readJSON(path.join(__dirname, 'default-topics.json'), []);
  writeJSON(TOPICS_FILE, defaults);
  writeJSON(REPLIES_FILE, [
    {"id":1,"tid":3,"author":"扫地僧","role":"admin","ts":"2026-03-31 09:30",
     "content":{"zh":"可以的！中国主体入驻海外托管：\n\n1. **主体要求**：企业入驻\n2. **保证金**：10,000 元人民币\n3. **备货地**：美国 FBA 完全符合要求\n4. **VAT**：需要校验发货国的税务资质","en":"Yes! Chinese entities can join:\n\n1. **Entity**: Enterprise\n2. **Deposit**: 10,000 RMB\n3. **Warehouse**: US FBA qualifies\n4. **VAT**: Tax qualification required","es":"¡Sí! Empresas chinas pueden unirse:\n\n1. **Entidad**: Empresa\n2. **Depósito**: 10,000 RMB\n3. **Almacén**: FBA en EE.UU. califica","fr":"Oui ! Les entreprises chinoises peuvent rejoindre :\n\n1. **Entité** : Entreprise\n2. **Dépôt** : 10 000 RMB\n3. **Entrepôt** : FBA aux États-Unis qualifie","de":"Ja! Chinesische Unternehmen können beitreten:\n\n1. **Einheit**: Unternehmen\n2. **Kaution**: 10.000 RMB\n3. **Lager**: US FBA qualifiziert","pl":"Tak! Chińskie firmy mogą dołączyć:\n\n1. **Podmiot**: Przedsiębiorstwo\n2. **Kaucja**: 10 000 RMB\n3. **Magazyn**: US FBA kwalifikuje się"}}
  ]);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API: Get topics
app.get('/api/topics', (req, res) => {
  const topics = readJSON(TOPICS_FILE, []);
  const cat = req.query.cat;
  const filtered = cat ? topics.filter(t => t.cat === parseInt(cat)) : topics;
  const sorted = filtered.sort((a, b) => {
    if (a.pin && !b.pin) return -1;
    if (!a.pin && b.pin) return 1;
    return new Date(b.ts) - new Date(a.ts);
  });
  res.json(sorted);
});

// API: Get topic detail
app.get('/api/topics/:id', (req, res) => {
  const topics = readJSON(TOPICS_FILE, []);
  const topic = topics.find(t => t.id === parseInt(req.params.id));
  if (!topic) return res.status(404).json({ error: 'Not found' });
  topic.views++;
  writeJSON(TOPICS_FILE, topics);
  const replies = readJSON(REPLIES_FILE, []).filter(r => r.tid === topic.id);
  res.json({ topic, replies });
});

// API: Create topic
app.post('/api/topics', (req, res) => {
  const { cat, title, author, lang, content } = req.body;
  if (!cat || !title || !author || !content) return res.status(400).json({ error: 'Missing fields' });
  const topics = readJSON(TOPICS_FILE, []);
  const id = topics.length ? Math.max(...topics.map(t => t.id)) + 1 : 1;
  topics.push({ id, cat: parseInt(cat), pin: 0, res: 0, views: 0, rp: 0, author, role: 'merchant', ts: new Date().toISOString().slice(0, 16).replace('T', ' '), title: { [lang]: title }, content: { [lang]: content } });
  writeJSON(TOPICS_FILE, topics);
  res.json({ id, message: 'OK' });
});

// API: Reply to topic
app.post('/api/topics/:id/replies', (req, res) => {
  const { author, lang, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'Missing fields' });
  const replies = readJSON(REPLIES_FILE, []);
  const id = replies.length ? Math.max(...replies.map(r => r.id)) + 1 : 1;
  replies.push({ id, tid: parseInt(req.params.id), author, role: 'merchant', ts: new Date().toISOString().slice(0, 16).replace('T', ' '), content: { [lang]: content } });
  writeJSON(REPLIES_FILE, replies);
  const topics = readJSON(TOPICS_FILE, []);
  const topic = topics.find(t => t.id === parseInt(req.params.id));
  if (topic) topic.rp++;
  writeJSON(TOPICS_FILE, topics);
  res.json({ id, message: 'OK' });
});

// API: Stats
app.get('/api/stats', (req, res) => {
  const topics = readJSON(TOPICS_FILE, []);
  const replies = readJSON(REPLIES_FILE, []);
  const authors = new Set(topics.map(t => t.author));
  res.json({ topics: topics.length, replies: replies.length, views: topics.reduce((s, t) => s + t.views, 0), merchants: authors.size });
});

// FC 入口
module.exports.handler = serverless(app);
