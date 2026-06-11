'use strict';

/* ============================================================
   FOCENOFF — Панель управления (admin.js)
============================================================ */

let token   = sessionStorage.getItem('focenoff_token') || null;
let content = null;
let activeTab = 'hero';

const $ = (sel, root = document) => root.querySelector(sel);

const loginScreen = $('#loginScreen');
const app         = $('#app');
const panelContent = $('#panelContent');
const saveBtn     = $('#saveBtn');

/* ---------- утилиты ---------- */
function esc(s)     { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return esc(s).replace(/"/g,'&quot;'); }

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] = o[k] ?? {}), obj);
  target[last] = val;
}
function arrAt(path) { return getPath(content, path); }

/* ---------- тосты ---------- */
function toast(msg, type = 'ok') {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast toast--' + type;
  const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
  el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
}

/* ============================================================
   API
============================================================ */
async function apiLogin(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Неверный пароль');
  const data = await res.json();
  return data.token;
}

async function apiGetContent() {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('Не удалось загрузить контент');
  return res.json();
}

async function apiSave() {
  const res = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(content),
  });
  if (res.status === 401) { logout(); throw new Error('Сессия истекла — войдите снова'); }
  if (!res.ok) throw new Error('Ошибка сохранения');
  return res.json();
}

function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status === 401) return reject(new Error('401'));
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Некорректный ответ')); }
      } else {
        let msg = 'Ошибка загрузки';
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Сеть недоступна'));
    xhr.send(fd);
  });
}

/* ============================================================
   ВХОД / ВЫХОД
============================================================ */
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = $('#loginPassword').value;
  $('#loginError').hidden = true;
  try {
    token = await apiLogin(pwd);
    sessionStorage.setItem('focenoff_token', token);
    await boot();
  } catch (err) {
    $('#loginError').hidden = false;
  }
});

$('#logoutBtn').addEventListener('click', logout);

function logout() {
  token = null;
  sessionStorage.removeItem('focenoff_token');
  app.hidden = true;
  loginScreen.hidden = false;
  $('#loginPassword').value = '';
}

async function boot() {
  content = await apiGetContent();
  loginScreen.hidden = true;
  app.hidden = false;
  renderTab();
}

/* ============================================================
   ВКЛАДКИ
============================================================ */
$('#sidebar').addEventListener('click', (e) => {
  const btn = e.target.closest('.sidebar__item');
  if (!btn) return;
  activeTab = btn.dataset.tab;
  $$('.sidebar__item').forEach(b => b.classList.toggle('is-active', b === btn));
  renderTab();
});
function $$(sel) { return [...document.querySelectorAll(sel)]; }

function renderTab() {
  const map = {
    hero: tabHero, marquee: tabMarquee, menu: tabMenu, sections: tabSections,
    contact: tabContact, about: tabAbout, footer: tabFooter, links: tabLinks,
  };
  panelContent.innerHTML = (map[activeTab] || tabHero)();
}

/* ---------- конструкторы полей ---------- */
function field(label, path, opts = {}) {
  const val = getPath(content, path) ?? '';
  const hint = opts.hint ? `<span class="field__hint">${esc(opts.hint)}</span>` : '';
  if (opts.area) {
    return `<label class="field"><span class="field__label">${esc(label)}</span>
      <textarea class="field__area" data-bind="${path}" rows="${opts.rows || 3}">${esc(val)}</textarea>${hint}</label>`;
  }
  const ph = opts.placeholder ? `placeholder="${escAttr(opts.placeholder)}"` : '';
  return `<label class="field"><span class="field__label">${esc(label)}</span>
    <input class="field__input" data-bind="${path}" value="${escAttr(val)}" ${ph} />${hint}</label>`;
}

function uploadZone(path, accept, label) {
  const cur = getPath(content, path);
  const current = cur ? `<div class="upload__current"><i class="fa-solid fa-circle-check"></i>${esc(cur)}</div>` : '';
  return `<div class="upload" data-upload="${path}" data-accept="${escAttr(accept)}">
    <i class="fa-solid fa-cloud-arrow-up"></i>${esc(label)}
    <div class="upload__bar"><div class="upload__fill"></div></div>
    ${current}
  </div>`;
}

function toolBtns(arrPath, i, len) {
  return `<div class="card__tools">
    <button class="btn--icon" data-act="up"   data-arr="${arrPath}" data-i="${i}" ${i===0?'disabled':''} title="Вверх"><i class="fa-solid fa-arrow-up"></i></button>
    <button class="btn--icon" data-act="down" data-arr="${arrPath}" data-i="${i}" ${i===len-1?'disabled':''} title="Вниз"><i class="fa-solid fa-arrow-down"></i></button>
    <button class="btn--icon" data-act="del"  data-arr="${arrPath}" data-i="${i}" title="Удалить"><i class="fa-solid fa-trash"></i></button>
  </div>`;
}

function tabHead(title, desc) {
  return `<div class="tab__head"><h1 class="tab__title">${esc(title)}</h1><p class="tab__desc">${esc(desc)}</p></div>`;
}

/* ---------- HERO ---------- */
function tabHero() {
  return tabHead('Шапка / Hero', 'Тексты вверху страницы') +
    `<div class="card"><div class="stack">
      ${field('Логотип (шапка)', 'texts.headerLogo')}
      ${field('Над-заголовок (eyebrow)', 'texts.heroEyebrow')}
      <div class="grid-2">
        ${field('Имя — строка 1', 'texts.heroTitleLine1')}
        ${field('Имя — строка 2', 'texts.heroTitleLine2')}
      </div>
      ${field('Год / копирайт', 'texts.heroYear')}
    </div></div>`;
}

/* ---------- MARQUEE ---------- */
function tabMarquee() {
  const items = content.marquee || [];
  const rows = items.map((t, i) => `
    <div class="list-row">
      <span class="list-row__handle"><i class="fa-solid fa-grip-lines"></i></span>
      <input class="field__input" data-bind="marquee.${i}" value="${escAttr(t)}" />
      <button class="btn--icon" data-act="up"   data-arr="marquee" data-i="${i}" ${i===0?'disabled':''}><i class="fa-solid fa-arrow-up"></i></button>
      <button class="btn--icon" data-act="down" data-arr="marquee" data-i="${i}" ${i===items.length-1?'disabled':''}><i class="fa-solid fa-arrow-down"></i></button>
      <button class="btn--icon" data-act="del"  data-arr="marquee" data-i="${i}"><i class="fa-solid fa-trash"></i></button>
    </div>`).join('');
  return tabHead('Бегущая строка', 'Слова, которые бегут лентой под hero') +
    `<div class="card">${rows}
      <button class="add-btn add-btn--block" data-act="add" data-arr="marquee"><i class="fa-solid fa-plus"></i> Добавить слово</button>
    </div>`;
}

/* ---------- MENU ---------- */
function tabMenu() {
  const items = content.menu || [];
  const cards = items.map((m, i) => `
    <div class="card">
      <div class="card__head">
        <div class="card__title"><span class="tag">${esc(m.num || '—')}</span>${esc(m.text || 'Пункт')}</div>
        ${toolBtns('menu', i, items.length)}
      </div>
      <div class="grid-3">
        ${field('Номер', `menu.${i}.num`)}
        ${field('Текст', `menu.${i}.text`)}
        ${field('Ссылка (#works / url)', `menu.${i}.href`)}
      </div>
    </div>`).join('');
  return tabHead('Меню', 'Пункты навигации в оверлее') + cards +
    `<button class="add-btn add-btn--block" data-act="add" data-arr="menu"><i class="fa-solid fa-plus"></i> Добавить пункт</button>`;
}

/* ---------- SECTIONS ---------- */
function tabSections() {
  const sections = content.sections || [];
  const blocks = sections.map((s, i) => {
    const inner = s.type === 'motion' ? motionSectionUI(s, i) : videosSectionUI(s, i);
    return `<div class="card">
      <div class="card__head">
        <div class="card__title"><span class="tag">${esc(s.type === 'motion' ? 'MOTION' : 'VIDEOS')}</span>${esc(s.title || 'Раздел')}</div>
        ${toolBtns('sections', i, sections.length)}
      </div>
      <div class="grid-2">
        ${field('Номер раздела', `sections.${i}.num`)}
        ${field('Название раздела', `sections.${i}.title`)}
      </div>
      ${inner}
    </div>`;
  }).join('');
  return tabHead('Разделы и видео', 'Motion-нарезки и YouTube-видео в каждом разделе') + blocks +
    `<button class="add-btn add-btn--block" data-act="addsection"><i class="fa-solid fa-plus"></i> Добавить раздел с видео</button>`;
}

function motionSectionUI(s, si) {
  const thumb = getPath(content, `sections.${si}.thumbnail`);
  const preview = thumb ? `<img class="preview-thumb" src="${escAttr(thumb)}" alt="" onerror="this.style.display='none'"/>` : '';
  const clips = (s.clips || []).map((c, ci) => {
    const base = `sections.${si}.clips.${ci}`;
    return `<div class="subitem">
      <div class="subitem__head">
        <span class="subitem__num">Клип ${ci + 1}</span>
        ${toolBtns(`sections.${si}.clips`, ci, s.clips.length)}
      </div>
      ${uploadZone(`${base}.file`, 'video/mp4,video/webm', 'Перетащите .mp4 сюда или нажмите для выбора')}
      <div class="grid-2" style="margin-top:12px">
        ${field('Название', `${base}.title`)}
        ${field('Подпись (label)', `${base}.label`, { placeholder: 'Motion · YouTube' })}
      </div>
      <div class="grid-2">
        ${field('Ссылка на оригинал (YouTube)', `${base}.ytUrl`, { placeholder: 'https://www.youtube.com/watch?v=...' })}
        ${field('Просмотры', `${base}.views`, { placeholder: '*14* views', hint: '*текст* = акцент; пусто — счётчик скрыт' })}
      </div>
    </div>`;
  }).join('');
  return `<div class="stack" style="margin-top:8px">
    <div class="field__label" style="margin-bottom:-6px">Превью плеера</div>
    ${field('URL превью', `sections.${si}.thumbnail`)}
    ${uploadZone(`sections.${si}.thumbnail`, 'image/*', 'Или загрузите изображение превью')}
    ${preview}
    <div class="field__label" style="margin-top:8px">Motion-нарезки</div>
    ${clips}
    <button class="add-btn add-btn--block" data-act="add" data-arr="sections.${si}.clips" data-kind="clip"><i class="fa-solid fa-plus"></i> Добавить нарезку</button>
  </div>`;
}

function videosSectionUI(s, si) {
  const items = (s.items || []).map((it, ii) => {
    const base = `sections.${si}.items.${ii}`;
    const tImg = it.thumbnail ? `<img class="preview-thumb" src="${escAttr(it.thumbnail)}" alt="" onerror="this.style.display='none'"/>` : '';
    return `<div class="subitem">
      <div class="subitem__head">
        <span class="subitem__num">Видео ${ii + 1}</span>
        ${toolBtns(`sections.${si}.items`, ii, s.items.length)}
      </div>
      <div class="grid-2">
        ${field('YouTube ID', `${base}.videoId`, { placeholder: 'напр. 2KrKQPX0m5A' })}
        ${field('Название', `${base}.name`)}
      </div>
      <div class="grid-2">
        ${field('Тип / подпись', `${base}.type`, { placeholder: 'My Channel' })}
        ${field('Статистика', `${base}.stat`, { hint: '*текст* = акцент, напр. *7K* views' })}
      </div>
      ${field('Ссылка названия (URL)', `${base}.nameUrl`)}
      ${field('URL превью', `${base}.thumbnail`)}
      ${uploadZone(`${base}.thumbnail`, 'image/*', 'Или загрузите превью')}
      ${tImg}
    </div>`;
  }).join('');
  return `<div class="stack" style="margin-top:8px">
    <div class="field__label">Видео в разделе</div>
    ${items || '<p class="tab__desc">Пока нет видео.</p>'}
    <button class="add-btn add-btn--block" data-act="add" data-arr="sections.${si}.items" data-kind="video"><i class="fa-solid fa-plus"></i> Добавить видео</button>
  </div>`;
}

/* ---------- CONTACT ---------- */
function tabContact() {
  return tabHead('Контакт', 'Большой призыв в нижней части (справа/CTA)') +
    `<div class="card"><div class="stack">
      ${field('Над-надпись', 'texts.contactLabel')}
      <div class="grid-2">
        ${field('CTA — строка 1', 'texts.contactCtaLine1')}
        ${field('CTA — строка 2', 'texts.contactCtaLine2')}
      </div>
      <p class="field__hint">Ссылка кнопки берётся из вкладки «Ссылки» → Telegram DM.</p>
    </div></div>`;
}

/* ---------- ABOUT ---------- */
function tabAbout() {
  return tabHead('О себе', 'Текст-заявление (слева, светлый блок)') +
    `<div class="card"><div class="stack">
      ${field('Текст', 'texts.statementText', { area: true, rows: 4, hint: 'Оберните слово в *звёздочки*, чтобы выделить акцентом: *2M+*' })}
      ${field('Подпись кнопки', 'texts.statementCta')}
    </div></div>`;
}

/* ---------- FOOTER ---------- */
function tabFooter() {
  return tabHead('Подвал', 'Тексты внизу страницы') +
    `<div class="card"><div class="stack">
      ${field('Имя', 'texts.footerName')}
      ${field('Копирайт', 'texts.footerCopy')}
      ${field('Подпись ссылки контакта', 'texts.footerContact')}
    </div></div>`;
}

/* ---------- LINKS ---------- */
function tabLinks() {
  return tabHead('Ссылки', 'Соц-сети и контакты (применяются по всему сайту)') +
    `<div class="card"><div class="stack">
      ${field('Telegram — написать (DM)', 'links.telegramDM')}
      ${field('Telegram — канал', 'links.telegramChannel')}
      ${field('YouTube', 'links.youtube')}
      ${field('TikTok', 'links.tiktok')}
    </div></div>`;
}

/* ============================================================
   ДВУСТОРОННЕЕ СВЯЗЫВАНИЕ (ввод текста)
============================================================ */
panelContent.addEventListener('input', (e) => {
  const el = e.target.closest('[data-bind]');
  if (!el) return;
  setPath(content, el.getAttribute('data-bind'), el.value);
});

/* ============================================================
   ДЕЙСТВИЯ (add / del / up / down / addsection)
============================================================ */
function newItem(kind) {
  if (kind === 'clip')  return { file: '', title: '', label: 'Motion · YouTube', ytUrl: '', views: '' };
  if (kind === 'video') return { thumbnail: '', videoId: '', name: '', nameUrl: '', type: '', stat: '' };
  return '';
}

panelContent.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]');
  if (act) {
    e.preventDefault();
    handleAction(act.dataset);
    return;
  }
  const up = e.target.closest('.upload[data-upload]');
  if (up) openFilePicker(up);
});

function handleAction(ds) {
  const { act, arr, kind } = ds;
  const i = ds.i != null ? +ds.i : -1;

  if (act === 'clearpath' && ds.path) {
    setPath(content, ds.path, '');
    renderTab();
    return;
  }

  if (act === 'addsection') {
    content.sections = content.sections || [];
    content.sections.push({
      id: 'section-' + Date.now(),
      type: 'videos',
      num: String(content.sections.length + 1).padStart(2, '0'),
      title: 'НОВЫЙ РАЗДЕЛ',
      items: [],
    });
    renderTab();
    return;
  }

  const list = arrAt(arr);
  if (!Array.isArray(list)) return;

  if (act === 'add') {
    if (arr === 'marquee') list.push('');
    else if (arr === 'menu') list.push({ num: String(list.length + 1).padStart(2, '0'), text: 'НОВЫЙ', href: '#works' });
    else list.push(newItem(kind));
  } else if (act === 'del') {
    list.splice(i, 1);
  } else if (act === 'up' && i > 0) {
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
  } else if (act === 'down' && i < list.length - 1) {
    [list[i + 1], list[i]] = [list[i], list[i + 1]];
  }
  renderTab();
}

/* ============================================================
   ЗАГРУЗКА ФАЙЛОВ (drag-drop + клик)
============================================================ */
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

function openFilePicker(zoneEl) {
  fileInput.accept = zoneEl.dataset.accept || '';
  fileInput.onchange = () => {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (f) handleUpload(zoneEl.dataset.upload, f, zoneEl);
  };
  fileInput.click();
}

async function handleUpload(path, file, zoneEl) {
  const bar  = zoneEl && zoneEl.querySelector('.upload__bar');
  const fill = zoneEl && zoneEl.querySelector('.upload__fill');
  if (bar) bar.classList.add('is-active');
  try {
    const res = await uploadFile(file, (p) => { if (fill) fill.style.width = Math.round(p * 100) + '%'; });
    setPath(content, path, res.path);
    toast('Файл загружен: ' + res.name, 'ok');
    renderTab();
  } catch (err) {
    if (err.message === '401') { toast('Сессия истекла — войдите снова', 'error'); logout(); return; }
    toast('Загрузка не удалась: ' + err.message, 'error');
    if (bar) bar.classList.remove('is-active');
  }
}

panelContent.addEventListener('dragover', (e) => {
  const up = e.target.closest('.upload[data-upload]');
  if (up) { e.preventDefault(); up.classList.add('is-drag'); }
});
panelContent.addEventListener('dragleave', (e) => {
  const up = e.target.closest('.upload[data-upload]');
  if (up) up.classList.remove('is-drag');
});
panelContent.addEventListener('drop', (e) => {
  const up = e.target.closest('.upload[data-upload]');
  if (up) {
    e.preventDefault();
    up.classList.remove('is-drag');
    const f = e.dataTransfer.files[0];
    if (f) handleUpload(up.dataset.upload, f, up);
  }
});

/* ============================================================
   СОХРАНЕНИЕ
============================================================ */
saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  const orig = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Сохранение…';
  try {
    await apiSave();
    toast('Сохранено ✓', 'ok');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = orig;
  }
});

// Ctrl/Cmd + S
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && !app.hidden) {
    e.preventDefault();
    saveBtn.click();
  }
});

/* ============================================================
   СТАРТ
============================================================ */
(async function init() {
  if (token) {
    try { await boot(); }
    catch { logout(); }
  } else {
    loginScreen.hidden = false;
  }
})();
