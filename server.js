'use strict';

/* ============================================================
   FOCENOFF — Express сервер
   • раздаёт статический сайт + media/
   • /api/content  — чтение/запись content.json
   • /api/login    — авторизация по паролю → токен
   • /api/upload   — загрузка .mp4 / превью в media/
   ============================================================ */

const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const ROOT         = __dirname;
const MEDIA_DIR    = path.join(ROOT, 'media');
const CONTENT_FILE = path.join(ROOT, 'content.json');
const CONFIG_FILE  = path.join(ROOT, 'admin.config.json');
const PORT         = process.env.PORT || 8899;

// Гарантируем существование media/
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

// ----- Пароль администратора -----
function getPassword() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return cfg.password || 'focenoff';
  } catch {
    return 'focenoff';
  }
}

// ----- In-memory токены сессий (сбрасываются при рестарте) -----
const tokens = new Set();

function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token  = header.replace(/^Bearer\s+/i, '').trim();
  if (token && tokens.has(token)) return next();
  return res.status(401).json({ error: 'Не авторизован' });
}

// ----- Имя файла: санитизация (латиница/кириллица/цифры/.-_ пробел) -----
function safeName(original) {
  const ext  = path.extname(original);
  const base = path.basename(original, ext)
    .replace(/[^\p{L}\p{N}\-_ ]+/gu, '')   // только буквы/цифры/-_ и пробел
    .trim()
    .slice(0, 80) || 'file';
  let name = base + ext.toLowerCase();
  let i = 1;
  while (fs.existsSync(path.join(MEDIA_DIR, name))) {
    name = `${base}-${i}${ext.toLowerCase()}`;
    i++;
  }
  return name;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MEDIA_DIR),
  filename:    (req, file, cb) => cb(null, safeName(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250 МБ
  fileFilter: (req, file, cb) => {
    const ok = /\.(mp4|webm|mov|jpg|jpeg|png|webp|gif|glb|gltf|json)$/i.test(file.originalname);
    cb(ok ? null : new Error('Недопустимый тип файла'), ok);
  },
});

// ============================================================
//  APP
// ============================================================
const app = express();
app.use(express.json({ limit: '2mb' }));

// --- Авторизация ---
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password === 'string' && password === getPassword()) {
    const token = crypto.randomBytes(24).toString('hex');
    tokens.add(token);
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Неверный пароль' });
});

// --- Чтение контента ---
app.get('/api/content', (req, res) => {
  fs.readFile(CONTENT_FILE, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'content.json не найден' });
    res.type('application/json').send(data);
  });
});

// --- Запись контента (атомарно: temp → rename) ---
app.put('/api/content', requireAuth, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Ожидается JSON-объект' });
  }
  const json = JSON.stringify(body, null, 2);
  const tmp  = CONTENT_FILE + '.tmp';
  fs.writeFile(tmp, json, 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'Ошибка записи' });
    fs.rename(tmp, CONTENT_FILE, (err2) => {
      if (err2) return res.status(500).json({ error: 'Ошибка сохранения' });
      res.json({ ok: true });
    });
  });
});

// --- Загрузка файла ---
app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    res.json({ path: 'media/' + req.file.filename, name: req.file.filename });
  });
});

// --- Удаление файла из media/ ---
app.delete('/api/upload/:file', requireAuth, (req, res) => {
  const name = path.basename(req.params.file); // защита от path traversal
  const fp   = path.join(MEDIA_DIR, name);
  fs.unlink(fp, (err) => {
    if (err) return res.status(404).json({ error: 'Файл не найден' });
    res.json({ ok: true });
  });
});

// --- Список файлов в media/ (для удобства в панели) ---
app.get('/api/media', requireAuth, (req, res) => {
  fs.readdir(MEDIA_DIR, (err, files) => {
    if (err) return res.json({ files: [] });
    res.json({ files: files.map(f => 'media/' + f) });
  });
});

// --- Конфиг (API-ключи и пр.) ---
function readConfig() { try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; } }
function writeConfig(cfg) {
  const tmp = CONFIG_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8');
  fs.renameSync(tmp, CONFIG_FILE);
}

app.get('/api/config', requireAuth, (req, res) => {
  const cfg = readConfig();
  res.json({ hasYoutubeKey: !!cfg.youtubeApiKey });
});

app.put('/api/config', requireAuth, (req, res) => {
  const cfg = readConfig();
  const body = req.body || {};
  if (typeof body.youtubeApiKey === 'string') {
    if (body.youtubeApiKey.trim()) cfg.youtubeApiKey = body.youtubeApiKey.trim();
    else delete cfg.youtubeApiKey;
  }
  try { writeConfig(cfg); res.json({ ok: true, hasYoutubeKey: !!cfg.youtubeApiKey }); }
  catch { res.status(500).json({ error: 'Ошибка сохранения конфигурации' }); }
});

// --- Просмотры YouTube (кэш в памяти + прокси к YouTube Data API) ---
const ytCache = new Map(); // id -> { views, ts }
const YT_TTL  = 3 * 60 * 60 * 1000; // 3 часа
app.get('/api/youtube-views', async (req, res) => {
  const idsParam = String(req.query.ids || '').trim();
  if (!idsParam) return res.json({ views: {} });
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
  const cfg = readConfig();
  const key = cfg.youtubeApiKey;
  const now = Date.now();
  const out = {};
  const need = [];
  ids.forEach(id => {
    const c = ytCache.get(id);
    if (c && (now - c.ts) < YT_TTL) out[id] = c.views;
    else need.push(id);
  });
  if (need.length && key) {
    try {
      const url = 'https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' +
        encodeURIComponent(need.join(',')) + '&key=' + encodeURIComponent(key);
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        (data.items || []).forEach(item => {
          const v = item.statistics && item.statistics.viewCount != null ? Number(item.statistics.viewCount) : null;
          if (v != null) { out[item.id] = v; ytCache.set(item.id, { views: v, ts: now }); }
        });
      }
    } catch (e) { /* сеть/API недоступны — вернём кэш/пусто */ }
  }
  res.json({ views: out });
});

// --- Панель ---
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'admin.html')));

// --- Статика (сайт, .mp4, media/) ---
// admin.config.json НЕ раздаём публично
app.use((req, res, next) => {
  if (req.path === '/admin.config.json') return res.status(403).end();
  next();
});
app.use(express.static(ROOT, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`\n  FOCENOFF сервер запущен:`);
  console.log(`  • Сайт:   http://localhost:${PORT}/`);
  console.log(`  • Панель: http://localhost:${PORT}/admin`);
  console.log(`  • Пароль панели — в admin.config.json\n`);
});
