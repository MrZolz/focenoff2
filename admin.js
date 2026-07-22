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
    contact: tabContact, footer: tabFooter, links: tabLinks,
    models: tabModels, workedWith: tabWorkedWith,
    theme: tabTheme, socials: tabSocials, preloader: tabPreloader,
    custom: tabCustom, youtube: tabYoutube,
  };
  panelContent.innerHTML = (map[activeTab] || tabHero)();
  if (activeTab === 'youtube') hydrateYoutube();
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

function selectField(label, path, options, hint) {
  const val = String(getPath(content, path) ?? options[0].value);
  const opts = options.map(o => `<option value="${escAttr(o.value)}" ${val === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
  const h = hint ? `<span class="field__hint">${esc(hint)}</span>` : '';
  return `<label class="field"><span class="field__label">${esc(label)}</span>
    <select class="field__input" data-bind="${path}">${opts}</select>${h}</label>`;
}

function colorField(label, path, hint) {
  const val = getPath(content, path) || '#000000';
  const h = hint ? `<span class="field__hint">${esc(hint)}</span>` : '';
  return `<label class="field"><span class="field__label">${esc(label)}</span>
    <input type="color" class="field__input field__color" data-bind="${path}" value="${escAttr(val)}" style="height:42px;padding:4px;cursor:pointer" />${h}</label>`;
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
      ${selectField('Вид отображения раздела', `sections.${i}.layout`, [
        { value: 'feed',     label: 'Лента — каждое видео отдельной карточкой (стрелки листают страницу)' },
        { value: 'carousel', label: 'Карусель по автору — одно окно на автора, стрелки листают видео в превью' },
      ], 'Карусель группирует работы по полю «Автор»: одно окно на автора, стрелки ‹ › листают его видео прямо в превью')}
      ${inner}
    </div>`;
  }).join('');
  return tabHead('Разделы и видео', 'Motion-нарезки и YouTube-видео в каждом разделе') + blocks +
    `<button class="add-btn add-btn--block" data-act="addsection"><i class="fa-solid fa-plus"></i> Добавить раздел с видео</button>`;
}

function motionSectionUI(s, si) {
  const clips = (s.clips || []).map((c, ci) => {
    const base = `sections.${si}.clips.${ci}`;
    const pImg = c.poster ? `<img class="preview-thumb" src="${escAttr(c.poster)}" alt="" onerror="this.style.display='none'"/>` : '';
    return `<div class="subitem">
      <div class="subitem__head">
        <span class="subitem__num">Клип ${ci + 1}</span>
        ${toolBtns(`sections.${si}.clips`, ci, s.clips.length)}
      </div>
      ${field('Автор', `${base}.author`, { placeholder: 'напр. Scammers', hint: 'Нарезки с одинаковым автором связываются стрелками на сайте' })}
      ${uploadZone(`${base}.file`, 'video/mp4,video/webm', 'Перетащите .mp4 сюда или нажмите для выбора')}
      <div class="grid-2" style="margin-top:12px">
        ${field('Название', `${base}.title`)}
        ${field('Подпись (label)', `${base}.label`, { placeholder: 'Motion \u00b7 YouTube' })}
      </div>
      <div class="grid-2">
        ${field('Ссылка на оригинал (YouTube)', `${base}.ytUrl`, { placeholder: 'https://www.youtube.com/watch?v=...' })}
        ${field('Просмотры', `${base}.views`, { placeholder: '*14* views', hint: '*текст* = акцент; пусто — счётчик скрыт' })}
      </div>
      ${field('URL постера (необяз.)', `${base}.poster`, { hint: 'Пусто — превью-видео крутится как анимированная обложка' })}
      ${uploadZone(`${base}.poster`, 'image/*', 'Или загрузите изображение постера')}
      ${pImg}
    </div>`;
  }).join('');
  return `<div class="stack" style="margin-top:8px">
    <div class="field__label">Motion-нарезки — у каждой свой отдельный плеер</div>
    ${clips || '<p class="tab__desc">Пока нет нарезок.</p>'}
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
      ${field('Автор', `${base}.author`, { placeholder: 'напр. КЭШЗЛО', hint: 'Видео с одинаковым автором связываются стрелками на сайте' })}
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

/* ---------- FOOTER ---------- */
function tabFooter() {
  return tabHead('Подвал', 'Тексты внизу страницы') +
    `<div class="card"><div class="stack">
      ${field('Имя', 'texts.footerName')}
      ${field('Подпись ссылки контакта', 'texts.footerContact')}
    </div></div>`;
}

/* ---------- LINKS ---------- */
function tabLinks() {
  return tabHead('Ссылки', 'Соц-сети и контакты (применяются по всему сайту)') +
    `<div class="card"><div class="stack">
      ${field('Telegram — написать (DM)', 'links.telegramDM')}
      ${field('Telegram �� канал', 'links.telegramChannel')}
      ${field('YouTube', 'links.youtube')}
      ${field('TikTok', 'links.tiktok')}
    </div></div>`;
}

/* ---------- 3D MODELS ---------- */
function tabModels() {
  return tabHead('3D Модели', 'Загрузка .glb/.gltf моделей для разных секций сайта') +
    `<div class="card"><div class="stack">
      <div class="field__label">Hero — модель в шапке</div>
      <p class="field__hint" style="margin-top:-4px">Справа от заголовка. Следует за курсором, уменьшается и уходит на задний план при скролле.</p>
      ${uploadZone('hero.modelFile', '.glb,.gltf,model/gltf-binary,model/gltf+json', 'Перетащите .glb сюда или нажмите для выбора')}
      ${getPath(content, 'hero.modelFile') ? `<button class="add-btn" data-act="clearpath" data-path="hero.modelFile"><i class="fa-solid fa-xmark"></i> Убрать модель</button>` : ''}
    </div></div>
    <div class="card"><div class="stack">
      <div class="field__label">3D-модель по центру ленты работ</div>
      <p class="field__hint" style="margin-top:-4px">По центру между работами и блоком «Worked With». Появляется и плавно вращается при скролле.</p>
      ${uploadZone('about.modelFile', '.glb,.gltf,model/gltf-binary,model/gltf+json', 'Перетащите .glb сюда или нажмите для выбора')}
      ${getPath(content, 'about.modelFile') ? `<button class="add-btn" data-act="clearpath" data-path="about.modelFile"><i class="fa-solid fa-xmark"></i> Убрать модель</button>` : ''}
    </div></div>
    <div class="card"><div class="stack">
      <div class="field__label">Contact — модель после «Контакта»</div>
      <p class="field__hint" style="margin-top:-4px">По центру после секции. Появляется и плавно вращается при скролле к секции «Контакт».</p>
      ${uploadZone('contact.modelFile', '.glb,.gltf,model/gltf-binary,model/gltf+json', 'Перетащите .glb сюда или нажмите для выбора')}
      ${getPath(content, 'contact.modelFile') ? `<button class="add-btn" data-act="clearpath" data-path="contact.modelFile"><i class="fa-solid fa-xmark"></i> Убрать модель</button>` : ''}
    </div></div>`;
}

/* ---------- WORKED WITH ---------- */
function tabWorkedWith() {
  const channels = content.workedWith || [];
  const cards = channels.map((ch, i) => {
    const avatarPreview = ch.avatar
      ? `<div style="display:flex;align-items:center;gap:12px;margin-top:6px">
           <img src="${escAttr(ch.avatar)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:1px solid rgba(0,0,0,0.12)" alt="" onerror="this.style.display='none'"/>
           <span style="font-size:0.72rem;color:var(--muted)">Предпросмотр</span>
         </div>`
      : '';
    return `<div class="card">
      <div class="card__head">
        <div class="card__title"><span class="tag">${String(i + 1).padStart(2, '0')}</span>${esc(ch.name || 'Канал')}</div>
        ${toolBtns('workedWith', i, channels.length)}
      </div>
      <div class="stack">
        <div class="grid-2">
          ${field('Название канала', 'workedWith.' + i + '.name')}
          ${field('Подписчики', 'workedWith.' + i + '.subs', { placeholder: '2M+' })}
        </div>
        ${field('Ссылка на канал', 'workedWith.' + i + '.url', { placeholder: 'https://youtube.com/@... или https://t.me/...', hint: 'При клике по аватарке откроется эта ссылка' })}
        ${field('URL аватарки', 'workedWith.' + i + '.avatar', { placeholder: 'https://...', hint: 'Прямая ссылка на фото канала (jpg/png/webp)' })}
        ${uploadZone('workedWith.' + i + '.avatar', 'image/*', 'Или загрузите аватарку файлом')}
        ${avatarPreview}
      </div>
    </div>`;
  }).join('');
  return tabHead('Worked With', 'Каналы в бегущей дорожке «Worked With:»') +
    cards +
    `<button class="add-btn add-btn--block" data-act="add" data-arr="workedWith" data-kind="channel"><i class="fa-solid fa-plus"></i> Добавить канал</button>`;
}

/* ---------- ТЕМА / ОФОРМЛЕНИЕ ---------- */
function tabTheme() {
  return tabHead('Тема / Оформление', 'Цвета, шрифт и размер текста — применяются по всему сайту') +
    `<div class="card"><div class="stack">
      ${colorField('Цвет фона сайта', 'theme.bg')}
      ${colorField('Цвет текста', 'theme.text')}
      ${colorField('Акцентный цвет', 'theme.accent', 'Выделения и статистика (напр. цифры просмотров)')}
      ${selectField('Шрифт', 'theme.fontFamily', [
        { value: "'Inter', sans-serif", label: 'Inter — как сейчас' },
        { value: "'AKONY', sans-serif", label: 'AKONY — дисплейный' },
        { value: "Georgia, 'Times New Roman', serif", label: 'Georgia — с засечками' },
        { value: "'Courier New', monospace", label: 'Courier — моноширинный' },
        { value: "'Arial', Helvetica, sans-serif", label: 'Arial' },
      ])}
      ${field('Размер текста, %', 'theme.fontScale', { placeholder: '100', hint: '100 — обычный. Напр. 120 — крупнее, 90 — мельче' })}
    </div></div>`;
}

/* ---------- СОЦ-СЕТИ / КОНТАКТЫ ---------- */
function tabSocials() {
  const items = content.socials || [];
  const cards = items.map((s, i) => `
    <div class="card">
      <div class="card__head">
        <div class="card__title"><span class="tag">${String(i + 1).padStart(2, '0')}</span>${esc(s.label || 'Ссылка')}</div>
        ${toolBtns('socials', i, items.length)}
      </div>
      <div class="grid-2">
        ${field('Название', 'socials.' + i + '.label', { placeholder: 'YouTube' })}
        ${field('Ссылка (URL)', 'socials.' + i + '.url', { placeholder: 'https://...' })}
      </div>
    </div>`).join('');
  return tabHead('Соц-сети и контакты', 'Кликабельные названия-ссылки (в блоке контактов и в меню)') +
    cards +
    `<button class="add-btn add-btn--block" data-act="add" data-arr="socials" data-kind="social"><i class="fa-solid fa-plus"></i> Добавить ссылку</button>`;
}

/* ---------- АНИМАЦИЯ ЗАГРУЗКИ (ПРЕЛОАДЕР) ---------- */
function tabPreloader() {
  const cur = getPath(content, 'preloader.animFile');
  return tabHead('Анимация загрузки', 'Файл, который проигрывается на экране загрузки вместо логотипа') +
    `<div class="card"><div class="stack">
      <p class="field__hint" style="margin-top:0">Поддерживаются: Lottie (.json), видео (.mp4 / .webm), изображения (.gif / .png / .webp).</p>
      ${uploadZone('preloader.animFile', '.json,application/json,video/mp4,video/webm,image/*', 'Перетащите файл анимации сюда или нажмите для выбора')}
      ${field('Или путь к файлу', 'preloader.animFile', { placeholder: 'media/intro.json' })}
      ${cur ? `<button class="add-btn" data-act="clearpath" data-path="preloader.animFile"><i class="fa-solid fa-xmark"></i> Убрать анимацию</button>` : ''}
    </div></div>`;
}

/* ===== Свои разделы (задача 2) ===== */
function tabCustom() {
  content.customSections = content.customSections || [];
  const secs = content.customSections;
  const posOpts = [
    { value: 'after-hero', label: 'После Hero (первый экран)' },
    { value: 'after-marquee', label: 'После бегущей строки' },
    { value: 'after-works', label: 'После раздела с работами' },
    { value: 'after-workedwith', label: 'После «Worked With»' },
    { value: 'before-contact', label: 'Перед блоком контактов' },
  ];
  const alignOpts = [{ value: 'left', label: 'Слева' }, { value: 'center', label: 'По центру' }];
  const widthOpts = [{ value: 'normal', label: 'Обычная' }, { value: 'full', label: 'Во всю ширину' }];
  const cards = secs.map((s, i) => {
    s.items = s.items || [];
    const items = s.items.map((it, ii) => {
      const base = `customSections.${i}.items.${ii}`;
      if (it.type === 'image') {
        const prev = it.src ? `<img class="preview-thumb" src="${escAttr(it.src)}" alt="" onerror="this.style.display='none'"/>` : '';
        return `<div class="subitem">
          <div class="subitem__head"><span class="subitem__num">🖼 Изображение ${ii + 1}</span>${toolBtns(`customSections.${i}.items`, ii, s.items.length)}</div>
          ${uploadZone(`${base}.src`, 'image/*', 'Загрузите картинку файлом')}
          ${field('Или URL / путь', `${base}.src`, { placeholder: 'https://… или media/…' })}
          ${prev}
          ${field('Подпись (необязательно)', `${base}.caption`)}
          ${field('Ссылка при клике (необязательно)', `${base}.url`, { placeholder: 'https://…' })}
          ${selectField('Ширина', `${base}.width`, widthOpts)}
        </div>`;
      }
      return `<div class="subitem">
        <div class="subitem__head"><span class="subitem__num">📝 Текст ${ii + 1}</span>${toolBtns(`customSections.${i}.items`, ii, s.items.length)}</div>
        ${field('Заголовок (необязательно)', `${base}.heading`)}
        ${field('Текст', `${base}.text`, { area: true, rows: 4 })}
        ${field('Ссылка (необязательно)', `${base}.url`, { placeholder: 'https://…', hint: 'Если заполнено — весь блок станет кликабельной ссылкой' })}
      </div>`;
    }).join('');
    return `<div class="card">
      <div class="card__head">
        <div class="card__title"><span class="tag">${String(i + 1).padStart(2, '0')}</span>${esc(s.title || 'Раздел')}</div>
        ${toolBtns('customSections', i, secs.length)}
      </div>
      ${field('Заголовок раздела (необязательно)', `customSections.${i}.title`)}
      ${selectField('Расположение на сайте', `customSections.${i}.position`, posOpts)}
      ${selectField('Выравнивание', `customSections.${i}.align`, alignOpts)}
      <div class="stack" style="margin-top:10px">
        <div class="field__label">Блоки в разделе (текст и изображения вперемешку)</div>
        ${items || '<p class="tab__desc">Пока нет блоков.</p>'}
        <div class="grid-2">
          <button class="add-btn" data-act="add" data-arr="customSections.${i}.items" data-kind="ctext"><i class="fa-solid fa-plus"></i> Текстовый блок</button>
          <button class="add-btn" data-act="add" data-arr="customSections.${i}.items" data-kind="cimage"><i class="fa-solid fa-plus"></i> Блок с изображением</button>
        </div>
      </div>
    </div>`;
  }).join('');
  return tabHead('Свои разделы', 'Добавляйте собственные разделы с текстом и изображениями в любом месте страницы') +
    (cards || '<p class="tab__desc">Пока нет своих разделов.</p>') +
    `<button class="add-btn add-btn--block" data-act="add" data-arr="customSections" data-kind="customSection"><i class="fa-solid fa-plus"></i> Добавить раздел</button>`;
}

/* ===== YouTube — автопросмотры (задача 6) ===== */
function tabYoutube() {
  return tabHead('YouTube — автопросмотры', 'Автоматический счётчик просмотров под видео через YouTube Data API') +
    `<div class="card"><div class="stack">
      ${selectField('Автоматический счётчик просмотров', 'autoViews', [
        { value: 'off', label: 'Выкл — показывать введённые вручную значения' },
        { value: 'on', label: 'Вкл — брать актуальные просмотры из YouTube' },
      ], 'При «Вкл» просмотры под каждым видео берутся из YouTube: по ID (YouTube-видео) или по ссылке (motion-нарезки). Значения кэшируются на 3 часа.')}
      <label class="field">
        <span class="field__label">YouTube Data API ключ</span>
        <input class="field__input" id="ytApiKey" placeholder="Вставьте ключ, чтобы задать или заменить" autocomplete="off" />
        <span class="field__hint" id="ytKeyStatus">Проверка…</span>
        <span class="field__hint">Ключ хранится на сервере и не публикуется на сайте. Получить бесплатно: Google Cloud Console → создать проект → включить «YouTube Data API v3» → «Credentials» → создать API key.</span>
      </label>
      <button class="add-btn" data-act="saveytkey"><i class="fa-solid fa-key"></i> Сохранить API-ключ</button>
    </div></div>`;
}

async function apiGetConfig() {
  const res = await fetch('/api/config', { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) return {};
  return res.json();
}
async function apiSaveConfig(patch) {
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Ошибка сохранения ключа');
  return res.json();
}
async function hydrateYoutube() {
  const st = document.getElementById('ytKeyStatus');
  try {
    const c = await apiGetConfig();
    if (st) st.textContent = c.hasYoutubeKey ? 'Ключ уже сохранён ✓ (введите новый, чтобы заменить)' : 'Ключ ещё не задан';
  } catch (e) { if (st) st.textContent = ''; }
}
async function saveYtKey(val) {
  try {
    const c = await apiSaveConfig({ youtubeApiKey: val });
    toast(val ? 'API-ключ сохранён' : 'API-ключ удалён', 'ok');
    const st = document.getElementById('ytKeyStatus');
    if (st) st.textContent = c.hasYoutubeKey ? 'Ключ уже сохранён ✓ (введите новый, чтобы заменить)' : 'Ключ ещё не задан';
    const inp = document.getElementById('ytApiKey');
    if (inp) inp.value = '';
  } catch (e) { toast(e.message, 'error'); }
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
  if (kind === 'clip')    return { file: '', author: '', title: '', label: 'Motion \u00b7 YouTube', ytUrl: '', views: '', poster: '' };
  if (kind === 'video')   return { thumbnail: '', videoId: '', author: '', name: '', nameUrl: '', type: '', stat: '' };
  if (kind === 'channel') return { name: '', avatar: '', subs: '', url: '' };
  if (kind === 'social')  return { label: '', url: '' };
  if (kind === 'customSection') return { title: '', position: 'after-works', align: 'left', items: [] };
  if (kind === 'ctext')   return { type: 'text', heading: '', text: '', url: '' };
  if (kind === 'cimage')  return { type: 'image', src: '', caption: '', url: '', width: 'normal' };
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
  if (act === 'saveytkey') {
    const inp = document.getElementById('ytApiKey');
    saveYtKey(inp ? inp.value.trim() : '');
    return;
  }

  if (act === 'addsection') {
    content.sections = content.sections || [];
    content.sections.push({
      id: 'section-' + Date.now(),
      type: 'videos',
      num: String(content.sections.length + 1).padStart(2, '0'),
      title: 'НОВЫЙ РАЗДЕЛ',
      layout: 'feed',
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
