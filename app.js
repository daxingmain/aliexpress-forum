let lang=localStorage.getItem('fl')||'zh';
let curCat=0,curTid=null;
let allTopics=[];
const API='/api';

function t(k){return(T[lang]&&T[lang][k])||T.zh[k]||k}

function applyLang(){
document.querySelectorAll('[data-k]').forEach(el=>{
const k=el.getAttribute('data-k');const v=t(k);if(v)el.textContent=v;
});
document.getElementById('hT').textContent=t('hTitle');
document.getElementById('hS').textContent=t('hSub');
document.getElementById('sC').textContent=t('sCat');
document.getElementById('rAu').placeholder=t('phAuthor');
document.getElementById('rCo').placeholder=t('phReply');
document.getElementById('mTi').placeholder=t('phTitle');
document.getElementById('mAu').placeholder=t('phAuthor');
document.getElementById('mCo').placeholder=t('phContent');
document.getElementById('searchInput').placeholder=t('phSearch')||'搜索帖子...';
document.querySelectorAll('.lb').forEach(b=>{
const l=b.getAttribute('onclick').match(/'(\w+)'/)[1];
b.classList.toggle('on',l===lang);
});
render();
}

function setL(l){lang=l;localStorage.setItem('fl',l);document.documentElement.lang=l;applyLang();}

async function api(path){
const r=await fetch(API+path);return r.json();
}
async function apiPost(path,data){
const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return r.json();
}

async function render(){
// Stats
const stats=await api('/stats');
document.getElementById('aT').textContent=stats.topics;
document.getElementById('aR').textContent=stats.replies;
document.getElementById('aV').textContent=stats.views;
document.getElementById('aM').textContent=stats.merchants;

// 获取所有帖子（不过滤）用于计数
allTopics=await api('/topics');

// 更新各板块计数（始终显示总数）
for(let i=1;i<=8;i++){
const c=allTopics.filter(t=>t.cat===i).length;
document.getElementById('x'+i).textContent=c;
}
document.getElementById('x0').textContent=allTopics.length;

// 当前分类过滤
let filtered=curCat===0?allTopics:allTopics.filter(t=>t.cat===curCat);

// 搜索过滤
const searchVal=document.getElementById('searchInput').value.trim().toLowerCase();
if(searchVal){
filtered=filtered.filter(t=>{
const title=(t.title[lang]||t.title.zh||t.title.en||'').toLowerCase();
const content=(t.content[lang]||t.content.zh||t.content.en||'').toLowerCase();
const author=(t.author||'').toLowerCase();
return title.includes(searchVal)||content.includes(searchVal)||author.includes(searchVal);
});
}

// 排序
filtered.sort((a,b)=>{
if(a.pin&&!b.pin)return-1;
if(!a.pin&&b.pin)return 1;
return new Date(b.ts)-new Date(a.ts);
});

// 分类高亮
document.querySelectorAll('.ci').forEach(el=>{
el.classList.toggle('on',parseInt(el.getAttribute('data-c'))===curCat);
});

// 渲染列表
const list=document.getElementById('tL');
if(!filtered.length){
list.innerHTML='<div class="em">'+(searchVal?'未找到匹配的帖子':'暂无帖子')+'</div>';
return;
}
list.innerHTML=filtered.map(topic=>{
const title=topic.title[lang]||topic.title.zh||topic.title.en||'';
const badges=[];
if(topic.pin)badges.push('<span class="b bp">'+t('pinned')+'</span>');
if(topic.res)badges.push('<span class="b bg">'+t('resolved')+'</span>');
const roleCls=topic.role==='admin'?'ba':'bm';
const roleLbl=topic.role==='admin'?t('admin'):t('merchant');
return '<li class="ti" onclick="openT('+topic.id+')"><div class="tt">'+badges.join(' ')+' '+esc(title)+'</div><div class="tm"><span class="b '+roleCls+'">'+roleLbl+' '+esc(topic.author)+'</span><span>👁 '+topic.views+'</span><span>💬 '+topic.rp+'</span><span>'+topic.ts+'</span></div></li>';
}).join('');
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

async function openT(id){
const data=await api('/topics/'+id);
if(!data.topic)return;
curTid=id;
const topic=data.topic;
const title=topic.title[lang]||topic.title.zh||topic.title.en||'';
const content=topic.content[lang]||topic.content.zh||topic.content.en||'';
document.getElementById('dTi').textContent=title;
const roleCls=topic.role==='admin'?'ba':'bm';
const roleLbl=topic.role==='admin'?t('admin'):t('merchant');
document.getElementById('dMe').innerHTML='<span class="b '+roleCls+'">'+roleLbl+' '+esc(topic.author)+'</span><span>👁 '+topic.views+'</span><span>💬 '+topic.rp+'</span><span>'+topic.ts+'</span>';
document.getElementById('dCo').textContent=content;
const tr=data.replies||[];
document.getElementById('rLi').innerHTML=tr.map(r=>{
const rc=r.content[lang]||r.content.zh||r.content.en||'';
const isAd=r.role==='admin';
return '<div class="rp'+(isAd?' ad':'')+'"><div class="rh"><span class="b '+(isAd?'ba':'bm')+'">'+(isAd?t('admin'):t('merchant'))+' '+esc(r.author)+'</span><span>'+r.ts+'</span></div><div class="rc">'+esc(rc)+'</div></div>';
}).join('');
document.getElementById('tL').style.display='none';
document.getElementById('tD').style.display='block';
}

function back(){curTid=null;document.getElementById('tL').style.display='';document.getElementById('tD').style.display='none';render();}

async function doR(){
const author=document.getElementById('rAu').value.trim();
const content=document.getElementById('rCo').value.trim();
if(!author||!content)return;
await apiPost('/topics/'+curTid+'/replies',{author,lang,content});
openT(curTid);
document.getElementById('rCo').value='';
}

function showM(){
if(curCat>=2)document.getElementById('mCa').value=curCat;
document.getElementById('mN').style.display='block'}
function hideM(){document.getElementById('mN').style.display='none'}

async function doP(){
const cat=parseInt(document.getElementById('mCa').value);
const title=document.getElementById('mTi').value.trim();
const author=document.getElementById('mAu').value.trim();
const pl=document.getElementById('mLa').value;
const content=document.getElementById('mCo').value.trim();
if(!title||!author||!content){alert('请填写完整信息');return}
try{
await apiPost('/topics',{cat,title,author,lang:pl,content});
hideM();
document.getElementById('mTi').value='';document.getElementById('mAu').value='';document.getElementById('mCo').value='';
render();
}catch(e){alert('发帖失败: '+e.message)}
}

// 搜索功能
function doSearch(){render();}

// 分类点击
document.querySelectorAll('.ci').forEach(el=>{
el.addEventListener('click',()=>{
curCat=parseInt(el.getAttribute('data-c'));
document.querySelectorAll('.ci').forEach(e=>e.classList.remove('on'));
el.classList.add('on');
render();
});
});

applyLang();
