const fs = require('fs');
const path = require('path');
const config = require('../config');

function esc(v = '') {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function modeLabel(mode) {
  if (mode === 'audio') return 'Só áudio';
  if (mode === 'video') return 'Só vídeo';
  return 'Áudio + vídeo';
}

function nav(user) {
  return `<div class="topbar wrap">
    <div class="brand">
      <img src="/public/logo-gltec.png" alt="GL Tec">
      <div>
        <div class="title">Studio Link</div>
        <div class="sub">${esc(config.DOMAIN)}</div>
      </div>
    </div>
    <div class="nav">
      <span class="pill">${esc(user.username)} (${esc(user.role)})</span>
      <a class="pill" href="/dashboard">Dashboard</a>
      ${user.role === 'admin' ? '<a class="pill" href="/admin">Admin</a>' : ''}
      <a class="pill" href="/logout">Sair</a>
    </div>
  </div>`;
}

function getChannelRecordings(channel) {
  const dir = path.join(config.RECORDINGS_DIR, channel);
  if (!fs.existsSync(dir)) return [];
  
  return fs.readdirSync(dir).sort().reverse().map(f => ({
    file: f,
    url: `/recordings/${encodeURIComponent(channel)}/${encodeURIComponent(f)}`
  }));
}

function basePage(title, body) {
  return `<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#040916;
  --bg2:#0a1530;
  --card:#0e1b3d;
  --card2:#152654;
  --line:#2c478d;
  --txt:#eef4ff;
  --muted:#a6b4da;
  --pri:#4f7cff;
  --pri2:#79a0ff;
  --ok:#10b981;
  --danger:#ef4444;
  --warn:#f59e0b;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:
radial-gradient(circle at top,#0f2451 0%,#08142d 38%,#030813 100%);color:var(--txt)}
a{color:#dbe6ff;text-decoration:none}
.wrap{max-width:1280px;margin:0 auto;padding:18px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}
.brand{display:flex;align-items:center;gap:14px}
.brand img{height:56px;width:auto;display:block;filter:drop-shadow(0 8px 20px rgba(0,0,0,.35))}
.brand .title{font-size:28px;font-weight:800;line-height:1}
.brand .sub{font-size:12px;color:var(--muted);margin-top:4px}
.nav{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.pill{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;background:rgba(91,121,212,.14);border:1px solid rgba(130,160,255,.20);font-size:13px;color:#dbe6ff}
.card{background:linear-gradient(180deg,rgba(17,29,66,.93),rgba(14,24,53,.95));border:1px solid rgba(76,104,176,.42);border-radius:24px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.28)}
.grid{display:grid;gap:18px}
.grid-2{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.grid-3{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.grid-main{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
h1,h2,h3{margin:0 0 12px}
p{margin:0 0 12px;color:var(--muted);line-height:1.55}
input,select,button,textarea{width:100%;border-radius:15px;border:1px solid rgba(102,129,201,.45);padding:13px 15px;background:#0b1634;color:var(--txt);font-size:15px}
input::placeholder{color:#7f90bf}
button{border:none;background:linear-gradient(180deg,var(--pri),#416df0);font-weight:700;cursor:pointer;box-shadow:0 8px 20px rgba(59,104,255,.22)}
button:hover{filter:brightness(1.04)}
.btn-secondary{background:linear-gradient(180deg,#314a8c,#263f7c)}
.btn-ok{background:linear-gradient(180deg,#14c38e,#0ea271)}
.btn-danger{background:linear-gradient(180deg,#ff6b6b,#e54848)}
.btn-warn{background:linear-gradient(180deg,#fbbf24,#d97706)}
.toolbar{display:flex;gap:10px;flex-wrap:wrap}
.toolbar button,.toolbar a{width:auto}
.copybox{display:flex;gap:10px;align-items:center}
.copybox input{flex:1}
.notice{padding:14px 16px;border-radius:16px;background:#172a55;border:1px solid #3457a4;color:#eef4ff}
.notice.warn{background:#4b2f06;border-color:#8f6110;color:#fff0d0}
.notice.ok{background:#163a2f;border-color:#1d6b55;color:#eafff7}
.badge{display:inline-flex;align-items:center;padding:7px 11px;border-radius:999px;background:rgba(87,111,186,.18);border:1px solid rgba(122,151,235,.28);font-size:12px}
.kpi{font-size:32px;font-weight:800}
ul{padding-left:18px}
table{width:100%;border-collapse:collapse}
th,td{padding:11px 8px;border-bottom:1px solid rgba(80,105,177,.28);text-align:left;font-size:14px}
.center{min-height:100vh;display:grid;place-items:center;padding:18px}
.loginbox{width:min(440px,100%)}
.hero-logo{display:flex;justify-content:center;margin-bottom:14px}
.hero-logo img{max-width:240px;width:100%;height:auto}
.login-title{text-align:center;margin-bottom:8px}
.login-sub{text-align:center;color:var(--muted);margin-bottom:18px}
.videos{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.video-card{position:relative;background:#000;border-radius:22px;overflow:hidden;border:1px solid rgba(80,105,177,.35);min-height:180px}
.video-wrap{position:relative}
video{width:100%;height:100%;min-height:190px;object-fit:cover;background:#000;display:block}
video.mirror{transform:scaleX(-1)}
.label{position:absolute;left:10px;bottom:10px;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);padding:7px 12px;border-radius:999px;font-size:12px}
.video-badges{position:absolute;top:10px;left:10px;display:flex;gap:8px;flex-wrap:wrap}
.vbadge{background:rgba(10,18,40,.62);border:1px solid rgba(255,255,255,.12);padding:6px 10px;border-radius:999px;font-size:11px}
.section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.small{font-size:12px;color:var(--muted)}
.spacer{height:10px}
.vu{height:10px;background:#091127;border:1px solid rgba(122,151,235,.22);border-radius:999px;overflow:hidden}
.vu > span{display:block;height:100%;width:0%;background:linear-gradient(90deg,#10b981,#f59e0b,#ef4444)}
.login-actions{display:grid;gap:12px}
.softtext{font-size:13px;color:#8fa4d9;text-align:center}
.mode-card{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mode-chip{padding:8px 12px;border-radius:999px;background:rgba(79,124,255,.14);border:1px solid rgba(100,140,255,.24);font-size:12px}
.host-area{display:grid;gap:12px}
.guest-area{display:grid;gap:12px}
@media (max-width: 900px){
  .grid-main{grid-template-columns:1fr}
}
@media (max-width: 768px){
  .wrap{padding:14px}
  .topbar{flex-direction:column;align-items:flex-start}
  .nav{width:100%;justify-content:flex-start}
  .brand img{height:44px}
  .brand .title{font-size:24px}
  .card{padding:15px;border-radius:18px}
  .toolbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .toolbar button,.toolbar a,.toolbar a button{width:100%}
  .copybox{flex-direction:column}
  .copybox input,.copybox button{width:100%}
  .videos{grid-template-columns:1fr}
  video{min-height:220px}
}
@media (max-width: 480px){
  .toolbar{grid-template-columns:1fr 1fr}
  input,select,button{font-size:16px}
}
</style>
</head>
<body>${body}</body>
</html>`;
}

function renderPage(title, content) {
  return basePage(title, content);
}

module.exports = {
  esc,
  modeLabel,
  nav,
  getChannelRecordings,
  renderPage,
  basePage
};