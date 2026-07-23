'use strict';

window.FOCENOFF_SOUND = (() => {
  const subs = [];
  let on = false;
  return {
    get on() { return on; },
    set(v) {
      v = !!v;
      if (v === on) return;
      on = v;
      subs.forEach((fn) => { try { fn(on); } catch (e) { } });
    },
    toggle() { this.set(!on); },
    subscribe(fn) { subs.push(fn); fn(on); },
  };
})();

let CONTENT = null;

const EMBEDDED_DEFAULTS = {
  texts: {
    headerLogo:      'FOCENOFF',
    heroEyebrow:     'Video Editor',
    heroTitleLine1:  'MAXIM',
    heroTitleLine2:  'FOCENOFF',
    statementText:   'ВИДЕОМОНТАЖЁР. РАБОТАЮ С КАНАЛАМИ ОТ *2M+* ПОДПИСЧИКОВ. YOUTUBE · REELS · BRAND CONTENT.',
    statementCta:    'НАПИСАТЬ В TELEGRAM',
    contactCtaLine1: 'НАПИСАТЬ',
    contactCtaLine2: 'В TELEGRAM',
    footerName:      'MAXIM FOCENOFF',
    footerContact:   'CONTACT',
  },
  links: {
    telegramDM:      'https://t.me/MAKC_CBAPKA',
    telegramChannel: 'https://t.me/focenoff',
    youtube:         'https://www.youtube.com/channel/UC_dVguEpMY8Vbiy0PKDjSwQ',
    tiktok:          'https://www.tiktok.com/@focenoff',
  },
  marquee: [
    'MOTION', '2M+ SUBSCRIBERS', 'YOUTUBE', 'LONG VIDEO',
    'BIG CASES', 'TELEGRAM', 'REELS', 'BRAND CONTENT', 'MONTAGE',
    'TIKTOK', 'SHORTS VIDEO',
  ],
  menu: [
    { text: 'WORKS',   href: '#works'     },
    { text: 'ABOUT',   href: '#statement' },
    { text: 'CONTACT', href: '#contact'   },
  ],
  /* workedWith — edit via content.json on the admin server.
     Schema: [{ name: string, avatar: string (url), subs: string }]
     Add/remove channels by adding/removing objects from this array. */
  workedWith: [
    {
      name:   'Scammers',
      avatar: 'https://i.postimg.cc/1XtbHq0R/Scammers-Ava.jpg',
      subs:   '2M+',
    },
    {
      name:   'Харчевников',
      avatar: 'https://i.postimg.cc/Qd2SfNgm/Snimok-ekrana-2026-03-03-v-19-27-23.png',
      subs:   '1.5M+',
    },
    {
      name:   'КЕШЗЛО',
      avatar: 'https://yt3.googleusercontent.com/VrnR5j2rJIbjVAWBTAR1in3ZlqBb-M1deVz_j6qYzVKKPQ9twgu8IAN2BZu0cLwa0tUH2-hT9Q=s160-c-k-c0x00ffffff-no-rj',
      subs:   '500K+',
    },
  ],
  sections: [
    {
      id: 'motion', type: 'motion', num: '02', title: 'MOTION', layout: 'feed',
      clips: [
        { file: 'scammers.mp4',     title: 'SCAMMERS',    label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is', views: '*14* views' },
        { file: 'scammers (2).mp4', title: 'SCAMMERS',    label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is', views: '*14* views' },
        { file: 'scammers (3).mp4', title: 'SCAMMERS',    label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is', views: '*14* views' },
        { file: 'scammers (4).mp4', title: 'SCAMMERS',    label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is', views: '*14* views' },
        { file: 'scammers (5).mp4', title: 'SCAMMERS',    label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is', views: '*14* views' },
        { file: 'харчевников.mp4',  title: 'ХАРЧЕВНИКОВ', label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=n75_-ntNL2I', views: '*4* views' },
      ],
    },
    {
      id: 'long-videos', type: 'videos', num: '03', title: 'LONG VIDEOS', layout: 'feed',
      items: [
        { thumbnail: 'media/zhbMghFRk_Q_maxres.jpg',  videoId: 'zhbMghFRk_Q', name: 'КЭШЗЛО',   type: 'УСТРОИЛСЯ РАБОТАТЬ В СКАМ ОФИС',                stat: '*357K* views' },
        { thumbnail: 'media/1xpPfVB1R64_maxres.jpg',  videoId: '1xpPfVB1R64', name: 'КЭШЗЛО',   type: '30 ДНЕЙ ТОРЧАЛ НА САМЫХ ПОПУЛЯРНЫХ Н##КОТИКАХ', stat: '*543K* views' },
        { thumbnail: 'media/video09_thumbnail.jpg',   videoId: '2KrKQPX0m5A', name: 'FOCENOFF', type: 'Я – МОНТАЖЕР SCAMMERS (не кликбейт)', stat: '*13K* views' },
      ],
    },
  ],
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtAccent(s) {
  return escapeHtml(s).replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>');
}

function toSrc(filename) {
  return filename.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function toPreviewSrc(filename) {
  const name = String(filename).split('/').pop();
  const base = name.replace(/\.[^.]+$/, '');
  return toSrc('media/previews/' + base + '.preview.mp4');
}

async function fetchContent() {
  try {
    const res = await fetch('content.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch { }
  return EMBEDDED_DEFAULTS;
}

async function loadContent() {
  CONTENT = await fetchContent();
  window.FOCENOFF_CONTENT = CONTENT;
  window.dispatchEvent(new CustomEvent('focenoff:content', { detail: CONTENT }));
  applyTheme();
  applyTexts();
  applyLinks();
  renderSocials();
  renderMarquee();
  renderMenu();
  renderWorks();
  renderWorkedWith();
  renderCustomSections();
  renderPreloaderAnim();
  applyAutoViews();
  applyCustomFonts();
  applyTextStyles();
}

function applyTexts() {
  const t = (CONTENT && CONTENT.texts) || {};
  document.querySelectorAll('[data-text]').forEach(el => {
    const key = el.getAttribute('data-text');
    if (t[key] != null) el.textContent = t[key];
  });
  document.querySelectorAll('[data-text-rich]').forEach(el => {
    const key = el.getAttribute('data-text-rich');
    if (t[key] != null) el.innerHTML = fmtAccent(t[key]);
  });
}

/* Если в URL нет протокола (напр. «www.google.com»), браузер считает его
   относительным путём (http://localhost:8899/www.google.com).
   Добавляем https:// автоматически. */
function normalizeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(s)) return s;
  return 'https://' + s;
}

function applyLinks() {
  const l = (CONTENT && CONTENT.links) || {};
  const socials = (CONTENT && CONTENT.socials) || [];
  // Кнопки «написать в Telegram» берут ссылку из раздела «Соц-сети»:
  // сначала ищем запись с пометкой DM, иначе — первую ссылку на Telegram.
  const dm = socials.find(s => s && s.url && /(^|[^a-z])dm([^a-z]|$)/i.test(s.label || ''))
    || socials.find(s => s && s.url && /t\.me|telegram/i.test((s.label || '') + ' ' + (s.url || '')));
  document.querySelectorAll('[data-link]').forEach(el => {
    const key = el.getAttribute('data-link');
    let url = l[key];
    if (key === 'telegramDM' && dm) url = dm.url;
    if (url) el.setAttribute('href', normalizeUrl(url));
  });
}

function applyTheme() {
  const th = (CONTENT && CONTENT.theme) || {};
  const root = document.documentElement;
  if (th.bg)   { root.style.setProperty('--bg', th.bg); root.style.setProperty('--paper', th.bg); }
  if (th.text) { root.style.setProperty('--ink', th.text); root.style.setProperty('--white', th.text); }
  if (th.accent) root.style.setProperty('--accent', th.accent);
  if (th.fontFamily) root.style.setProperty('--f-sans', th.fontFamily);
  if (th.fontScale != null && th.fontScale !== '') {
    const s = Number(th.fontScale);
    if (!isNaN(s) && s > 0) root.style.setProperty('--font-scale', String(s / 100));
  }
}

/* ===== Свои шрифты (customFonts) =====
   Загружаются в админке (раздел «Шрифты») и подключаются через @font-face. */
function applyCustomFonts() {
  const fonts = (CONTENT && CONTENT.customFonts) || [];
  let css = '';
  fonts.forEach((f) => {
    if (!f || !f.name || !f.file) return;
    const ext = String(f.file).split('.').pop().toLowerCase();
    const fmt = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[ext];
    css += "@font-face { font-family: '" + f.name + "'; src: url('" + f.file + "')" + (fmt ? " format('" + fmt + "')" : '') + "; font-display: swap; }\n";
  });
  let tag = document.getElementById('customFontsCss');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'customFontsCss';
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

/* ===== Индивидуальное оформление текста блоков (textStyles) =====
   Ключи редактируются в админке внутри каждого раздела.
   Значение: { color: '#hex', font: 'CSS font-family', size: px } */
const STYLE_TARGETS = {
  headerLogo:      '.header__logo, .header__logo-text',
  heroEyebrow:     '.hero__eyebrow-tag',
  heroTitleLine1:  '[data-text="heroTitleLine1"]',
  heroTitleLine2:  '[data-text="heroTitleLine2"]',
  heroViewWork:    '.hero__view-work',
  heroContact:     '.hero__contact-btn',
  marquee:         '.marquee__item, .marquee__sep',
  menuLinks:       '.menu-nav__link',
  menuSocials:     '.menu-socials a',
  sectionTitles:   '.works__chapter-title',
  sectionNums:     '.works__chapter-num, .works__chapter-count',
  workNames:       '.work-item__name',
  workMeta:        '.work-item__type, .work-item__stat',
  workedWithLabel: '.worked-with__label',
  workedWithNames: '.worked-with__name',
  workedWithSubs:  '.worked-with__subs',
  contactLabel:    '[data-text="contactLabel"]',
  contactCtaLine1: '[data-text="contactCtaLine1"]',
  contactCtaLine2: '[data-text="contactCtaLine2"]',
  contactSocials:  '.contact-cta__socials a',
  footerName:      '.footer__name',
  footerContact:   '.footer__contact',
  footerCopy:      '.footer__copy',
  customTitle:     '.custom-section__title',
  customHeading:   '.custom-block__heading',
  customText:      '.custom-block__text',
  customCaption:   '.custom-block__caption',
  preloader:       '.preloader__name, .preloader__num, .preloader__foot',
};

function applyTextStyles() {
  const st = (CONTENT && CONTENT.textStyles) || {};
  let css = '';
  Object.keys(STYLE_TARGETS).forEach((key) => {
    const s = st[key];
    if (!s) return;
    const sel = STYLE_TARGETS[key];
    const inheritProps = [];
    if (s.color) inheritProps.push('color: ' + s.color + ' !important');
    if (s.font)  inheritProps.push('font-family: ' + s.font + ' !important');
    if (inheritProps.length) {
      // Красим и сам блок, и всё внутри него (буквы-обёртки, span и т.п.)
      const deep = sel.split(',').map(p => p.trim() + ', ' + p.trim() + ' *').join(', ');
      css += deep + ' { ' + inheritProps.join('; ') + '; }\n';
    }
    const size = Number(s.size);
    if (size > 0) css += sel + ' { font-size: ' + size + 'px !important; }\n';
  });
  let tag = document.getElementById('textStylesCss');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'textStylesCss';
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

function renderSocials() {
  const socials = (CONTENT && CONTENT.socials) || [];
  document.querySelectorAll('[data-socials]').forEach(box => {
    box.innerHTML = '';
    socials.forEach(s => {
      if (!s || !s.label) return;
      const a = document.createElement('a');
      a.href = normalizeUrl(s.url) || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = s.label;
      box.appendChild(a);
    });
  });
}

function renderPreloaderAnim() {
  const box = document.getElementById('preloaderLottie');
  if (!box) return;
  const pf = (CONTENT && CONTENT.preloader && CONTENT.preloader.animFile) || 'media/intro.json';
  if (!pf) { box.innerHTML = ''; return; }
  if (box.dataset.src === pf) return; // already showing this file
  box.dataset.src = pf;
  box.innerHTML = '';
  const ext = String(pf).split('.').pop().toLowerCase();
  const url = String(pf).replace(/ /g, '%20');
  try {
    if (ext === 'json') {
      if (typeof lottie !== 'undefined') lottie.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: true, path: url });
    } else if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
      box.innerHTML = '<video autoplay muted loop playsinline src="' + url + '"></video>';
    } else {
      box.innerHTML = '<img src="' + url + '" alt="" />';
    }
  } catch (e) { /* ignore */ }
}

/* ============================================================
   YouTube auto view counts (задача 6)
============================================================ */
const YT_VIEWS = {}; // id -> отформатированное число просмотров

function extractYtId(url) {
  if (!url) return '';
  const s = String(url);
  let m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/); if (m) return m[1];
  m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
  m = s.match(/\/embed\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
  m = s.match(/\/shorts\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
  return '';
}

function formatViews(n) {
  n = Number(n);
  if (isNaN(n)) return '';
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// Возвращает строку статистики: автоматический счётчик (если есть) или ручное значение.
function ytStat(rawStat, videoId) {
  const c = videoId && YT_VIEWS[videoId];
  return c ? ('*' + c + '* views') : (rawStat || '');
}

async function applyAutoViews() {
  if (!CONTENT || CONTENT.autoViews !== 'on') return;
  const ids = new Set();
  (CONTENT.sections || []).forEach(s => {
    (s.items || []).forEach(it => { if (it.videoId) ids.add(it.videoId); });
    (s.clips || []).forEach(c => { const id = extractYtId(c.ytUrl); if (id) ids.add(id); });
  });
  if (!ids.size) return;
  try {
    const res = await fetch('/api/youtube-views?ids=' + encodeURIComponent([...ids].join(',')));
    if (!res.ok) return;
    const data = await res.json();
    let changed = false;
    Object.keys(data.views || {}).forEach(id => {
      const c = data.views[id];
      if (c != null) { YT_VIEWS[id] = formatViews(c); changed = true; }
    });
    if (changed) renderWorks();
  } catch (e) { /* сеть/API недоступны — остаются ручные значения */ }
}

/* ============================================================
   Собственные разделы с текстом/изображениями (задача 2)
============================================================ */
function renderCustomSections() {
  document.querySelectorAll('[data-custom-section]').forEach(el => el.remove());
  const list = (CONTENT && CONTENT.customSections) || [];
  if (!list.length) return;
  const anchor = (pos) => {
    switch (pos) {
      case 'after-hero':       return { el: document.querySelector('.hero'),        where: 'after' };
      case 'after-marquee':    return { el: document.querySelector('.marquee'),     where: 'after' };
      case 'after-works':      return { el: document.querySelector('.works'),       where: 'after' };
      case 'after-workedwith': return { el: document.querySelector('.worked-with'), where: 'after' };
      case 'before-contact':   return { el: document.querySelector('.contact-cta'), where: 'before' };
      default:                 return { el: document.querySelector('.works'),       where: 'after' };
    }
  };
  list.forEach((sec, secIdx) => {
    if (!sec) return;
    const section = document.createElement('section');
    section.className = 'custom-section' + (sec.align === 'center' ? ' custom-section--center' : '');
    section.setAttribute('data-custom-section', '');
    // Якорь для пунктов меню вида #custom-section-N
    section.id = 'custom-section-' + (secIdx + 1);
    const inner = document.createElement('div');
    inner.className = 'custom-section__inner';
    if (sec.title) { const h = document.createElement('h2'); h.className = 'custom-section__title'; h.textContent = sec.title; inner.appendChild(h); }
    (sec.items || []).forEach(it => {
      if (!it) return;
      if (it.type === 'image') {
        if (!it.src) return;
        const fig = document.createElement('figure');
        fig.className = 'custom-block custom-block--image' + (it.width === 'full' ? ' is-full' : '');
        const img = document.createElement('img');
        img.src = String(it.src).replace(/ /g, '%20');
        img.alt = it.caption || '';
        img.loading = 'lazy';
        let media = img;
        if (it.url) { const a = document.createElement('a'); a.href = it.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.appendChild(img); media = a; }
        fig.appendChild(media);
        if (it.caption) { const cap = document.createElement('figcaption'); cap.className = 'custom-block__caption'; cap.textContent = it.caption; fig.appendChild(cap); }
        inner.appendChild(fig);
      } else {
        if (!it.heading && !it.text) return;
        const hasUrl = !!it.url;
        const wrap = document.createElement(hasUrl ? 'a' : 'div');
        wrap.className = 'custom-block custom-block--text' + (hasUrl ? ' custom-block--link' : '');
        if (hasUrl) { wrap.href = it.url; wrap.target = '_blank'; wrap.rel = 'noopener noreferrer'; }
        if (it.heading) { const h = document.createElement('h3'); h.className = 'custom-block__heading'; h.textContent = it.heading; wrap.appendChild(h); }
        if (it.text) { const p = document.createElement('p'); p.className = 'custom-block__text'; p.textContent = it.text; wrap.appendChild(p); }
        inner.appendChild(wrap);
      }
    });
    section.appendChild(inner);
    const { el, where } = anchor(sec.position);
    if (el) { if (where === 'before') el.before(section); else el.after(section); }
    else document.body.appendChild(section);
  });
}

function renderMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;
  const items = (CONTENT && CONTENT.marquee) || [];
  track.innerHTML = '';
  const build = () => {
    items.forEach(text => {
      const item = document.createElement('span');
      item.className = 'marquee__item';
      item.textContent = text;
      track.appendChild(item);
      const sep = document.createElement('span');
      sep.className = 'marquee__sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '·';
      track.appendChild(sep);
    });
  };
  build(); build();
}

function renderMenu() {
  const list = document.getElementById('menuList');
  if (!list) return;
  const items = (CONTENT && CONTENT.menu) || [];
  list.innerHTML = '';
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.style.setProperty('--i', i);
    const a = document.createElement('a');
    a.className = 'menu-nav__link';
    a.href = item.href || '#';
    const text = document.createElement('span');
    text.className = 'menu-nav__text';
    text.textContent = item.text || '';
    a.appendChild(text);
    li.appendChild(a);
    list.appendChild(li);
  });
}

function renderWorks() {
  const container = document.getElementById('worksTrack');
  if (!container) return;
  const sections = (CONTENT && CONTENT.sections) || [];
  const tplChapter    = document.getElementById('tplChapterCard');
  const tplMotionCard = document.getElementById('tplMotionCard');
  const tplCard       = document.getElementById('tplVideoCard');
  container.innerHTML = '';
  let globalIdx = 0;
  sections.forEach((section, si) => {
    const isMotion = section.type === 'motion';
    const clips = isMotion ? (section.clips || []) : (section.items || []);
    const count = clips.length;
    if (tplChapter) {
      const ch = tplChapter.content.firstElementChild.cloneNode(true);
      ch.querySelector('.works__chapter-num').textContent   = section.num || '';
      ch.querySelector('.works__chapter-title').textContent = section.title || '';
      ch.querySelector('.works__chapter-count').textContent = count + ' PROJECT' + (count !== 1 ? 'S' : '');
      container.appendChild(ch);
    }
    // Group clips/items by author so several works of the same author are
    // linked together with the prev/next arrows on the site.
    const authorOf = (c) => String((c && c.author && String(c.author).trim()) || (isMotion ? (c.title || '') : (c.name || '')) || '').trim().toLowerCase();
    const groupSize = {};
    const groupPos  = {};
    clips.forEach(c => { const k = authorOf(c); groupSize[k] = (groupSize[k] || 0) + 1; });

    // Layout variant (per section, editable in the admin):
    //   'feed'     — each work is its own card; arrows scroll the page between
    //                the works of one author (default, original behaviour).
    //   'carousel' — one window per author; arrows flip through that author's
    //                videos right inside the preview (no page scroll).
    const layout = section.layout === 'carousel' ? 'carousel' : 'feed';
    // Author groups in first-appearance order (used by the carousel layout).
    const groupOrder = [];
    const groupMap = {};
    clips.forEach(c => { const k = authorOf(c); if (!groupMap[k]) { groupMap[k] = []; groupOrder.push(k); } groupMap[k].push(c); });

    if (isMotion) {
      if (!tplMotionCard || !clips.length) return;
      if (layout === 'carousel') {
        // One window per author; the prev/next arrows flip through the clips.
        groupOrder.forEach(key => {
          globalIdx++;
          const node = tplMotionCard.content.firstElementChild.cloneNode(true);
          node.classList.add('is-carousel');
          node.dataset.group = si + '::' + key;
          container.appendChild(node);
          initMotionCarousel(node, groupMap[key]);
        });
      } else {
        // Each motion clip gets its OWN player card (like the Long Videos grid).
        clips.forEach(clip => {
          globalIdx++;
          const node = tplMotionCard.content.firstElementChild.cloneNode(true);
          const key  = authorOf(clip);
          const size = groupSize[key] || 1;
          const pos  = (groupPos[key] = (groupPos[key] == null ? 0 : groupPos[key] + 1));
          node.dataset.group     = si + '::' + key;
          node.dataset.groupPos  = pos;
          node.dataset.groupSize = size;
          container.appendChild(node);
          initMotionCard(node, clip);
          if (size > 1) addGroupControls(node, pos, size);
        });
      }
    } else {
      if (!tplCard) return;
      if (layout === 'carousel') {
        // One window per author; the prev/next arrows flip through the videos.
        groupOrder.forEach(key => {
          globalIdx++;
          const node = tplCard.content.firstElementChild.cloneNode(true);
          node.classList.add('is-carousel');
          node.dataset.group = si + '::' + key;
          container.appendChild(node);
          initVideoCarousel(node, groupMap[key]);
        });
      } else {
        clips.forEach(item => {
          globalIdx++;
          const node    = tplCard.content.firstElementChild.cloneNode(true);
          const img     = node.querySelector('.work-item__thumb');
          img.src       = item.thumbnail || '';
          img.alt       = item.name || '';
          const playBtn = node.querySelector('.work-item__play');
          if (item.videoId) {
            playBtn.setAttribute('data-video-id', item.videoId);
            playBtn.setAttribute('aria-label', 'Смотреть — ' + (item.name || ''));
          }
          const nameLink = node.querySelector('.work-item__name a');
          nameLink.textContent = item.name || '';
          if (item.nameUrl) nameLink.href = item.nameUrl;
          else nameLink.removeAttribute('href');
          node.querySelector('.work-item__type').textContent = item.type || '';
          node.querySelector('.work-item__stat').innerHTML   = fmtAccent(ytStat(item.stat, item.videoId));
          const key  = authorOf(item);
          const size = groupSize[key] || 1;
          const pos  = (groupPos[key] = (groupPos[key] == null ? 0 : groupPos[key] + 1));
          node.dataset.group     = si + '::' + key;
          node.dataset.groupPos  = pos;
          node.dataset.groupSize = size;
          container.appendChild(node);
          if (size > 1) addGroupControls(node, pos, size);
        });
      }
    }
  });
}

/* ============================================================
   AUTHOR GROUPS — prev/next arrows that scroll between the works
   of one author (e.g. several Scammers motion clips) and auto-play
   the clip you land on ("the site moves down and the next clip plays").
============================================================ */
function addGroupControls(node, pos, size) {
  const media = node.querySelector('.work-item__media');
  if (!media) return;
  const mkBtn = (dir, label, path) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'motion-nav motion-nav--' + dir;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
    return b;
  };
  const prev = mkBtn('prev', 'Предыдущая работа автора', 'M15 18l-6-6 6-6');
  const next = mkBtn('next', 'Следующая работа автора', 'M9 18l6-6-6-6');
  if (pos <= 0)        prev.disabled = true;
  if (pos >= size - 1) next.disabled = true;
  const counter = document.createElement('span');
  counter.className = 'motion-counter';
  counter.textContent = (pos + 1) + ' / ' + size;
  media.appendChild(prev);
  media.appendChild(next);
  media.appendChild(counter);
}

function initGroupNav() {
  function scrollToWork(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.2 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Play the muted preview of the clip we land on.
    const preview = el.querySelector('.motion-card__preview');
    if (preview) { const p = preview.play(); if (p && p.catch) p.catch(() => {}); }
  }
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('.motion-nav');
    if (!nav) return;
    if (nav.closest('.is-carousel')) return; // carousel arrows flip in place (handled per-card)
    e.preventDefault();
    e.stopPropagation();
    if (nav.disabled) return;
    const card = nav.closest('[data-group]');
    if (!card) return;
    const group = card.dataset.group;
    const pos   = parseInt(card.dataset.groupPos, 10) || 0;
    const dir   = nav.classList.contains('motion-nav--next') ? 1 : -1;
    const members = Array.from(document.querySelectorAll('[data-group]'))
      .filter(el => el.dataset.group === group)
      .sort((a, b) => (parseInt(a.dataset.groupPos, 10) || 0) - (parseInt(b.dataset.groupPos, 10) || 0));
    scrollToWork(members[pos + dir]);
  });
}

/* ============================================================
   WORKED WITH — channel avatar strip
   Admin: edit content.json → workedWith: [{name, avatar, subs}]
============================================================ */
function renderWorkedWith() {
  const track = document.getElementById('workedWithTrack');
  if (!track) return;
  const channels = (CONTENT && CONTENT.workedWith) || [];
  track.innerHTML = '';
  if (!channels.length) {
    const section = document.getElementById('workedWith');
    if (section) section.style.display = 'none';
    return;
  }
  const build = () => {
    channels.forEach(ch => {
      const item = document.createElement(ch.url ? 'a' : 'div');
      item.className = 'worked-with__item';
      if (ch.url) { item.href = ch.url; item.target = '_blank'; item.rel = 'noopener noreferrer'; }
      const img = document.createElement('img');
      img.className = 'worked-with__avatar';
      img.src     = ch.avatar || '';
      img.alt     = ch.name  || '';
      img.loading = 'lazy';
      img.width   = 68;
      img.height  = 68;
      const name = document.createElement('span');
      name.className   = 'worked-with__name';
      name.textContent = ch.name || '';
      item.appendChild(img);
      item.appendChild(name);
      if (ch.subs) {
        const subs = document.createElement('span');
        subs.className   = 'worked-with__subs';
        subs.textContent = ch.subs;
        item.appendChild(subs);
      }
      track.appendChild(item);
    });
  };
  /* Full-width seamless strip: repeat the channel set enough times that a
     single "half" comfortably exceeds the viewport width (so on wide desktop
     screens the strip fills the full width with no empty gap), then mirror it
     into a second identical half so the GSAP -50% loop is seamless. */
  build(); // one set, used to measure how wide a single set is
  const oneSetW = track.scrollWidth || 1;
  const vw = window.innerWidth || 1280;
  let perHalf = Math.max(1, Math.ceil(vw / oneSetW) + 1); // +1 safety margin
  perHalf = Math.min(perHalf, 30);                        // sane upper bound
  const totalSets = perHalf * 2;                          // even → two identical halves
  for (let i = 1; i < totalSets; i++) build();
}

/* ============================================================
   MOTION CARD — one self-contained player per clip
   Shows a lightweight muted looping preview as an animated
   thumbnail; clicking opens the full clip (with sound) in the
   shared modal, mirroring the Long Videos UX.
============================================================ */
function initMotionCard(root, clip) {
  const preview = root.querySelector('.motion-card__preview');
  const poster  = root.querySelector('.motion-card__poster');
  const playBtn = root.querySelector('.motion-card__play');
  const titleEl = root.querySelector('.motion-title');
  const typeEl  = root.querySelector('.motion-type');
  const viewsEl = root.querySelector('.motion-views');
  const ytLink  = root.querySelector('.motion-yt-link');

  titleEl.textContent = clip.title || '';
  typeEl.textContent  = clip.label || '';
  { const _v = ytStat(clip.views, extractYtId(clip.ytUrl)); viewsEl.innerHTML = fmtAccent(_v); viewsEl.hidden = !_v; }
  if (clip.ytUrl) { ytLink.href = clip.ytUrl; ytLink.hidden = false; }
  else ytLink.hidden = true;

  const fullSrc = toSrc(clip.file);

  // Optional static poster image; otherwise the muted looping preview is the thumbnail.
  if (clip.poster) { poster.src = clip.poster; poster.hidden = false; }

  // Lightweight animated preview, falling back to the full file if the preview is missing.
  preview.muted = true;
  preview.dataset.fullSrc = fullSrc;
  preview.src = toPreviewSrc(clip.file);
  preview.addEventListener('error', () => {
    if (preview.dataset.fellBack) return;
    preview.dataset.fellBack = '1';
    preview.src = fullSrc;
    preview.play().catch(() => {});
  });

  // Only autoplay the muted preview while the card is on screen.
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) preview.play().catch(() => {});
        else preview.pause();
      });
    }, { threshold: 0.25 });
    io.observe(root);
  } else {
    preview.play().catch(() => {});
  }

  // The play button / media click opens this clip in the shared modal (see initVideoModal).
  playBtn.setAttribute('data-video-src', fullSrc);

  // Sound toggle right on the hover-preview (in addition to the modal player):
  // hovering plays the clip muted; this button turns its sound on/off.
  const media = root.querySelector('.work-item__media');
  if (media) {
    const muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.className = 'motion-mute';
    const ICON_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9 2 9 2 15 6 15 11 19Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9 2 9 2 15 6 15 11 19Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.8 5.5a9 9 0 0 1 0 13"/></svg>';
    const syncIcon = () => {
      muteBtn.innerHTML = preview.muted ? ICON_MUTED : ICON_SOUND;
      muteBtn.classList.toggle('is-on', !preview.muted);
      muteBtn.setAttribute('aria-label', preview.muted ? 'Включить звук' : 'Выключить звук');
      muteBtn.setAttribute('aria-pressed', String(!preview.muted));
    };
    syncIcon();
    muteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (preview.muted) {
        // Unmute this clip; mute every other preview so only one plays sound.
        document.querySelectorAll('.motion-card__preview').forEach(v => { if (v !== preview) v.muted = true; });
        preview.muted = false;
        const p = preview.play(); if (p && p.catch) p.catch(() => {});
        if (window.FOCENOFF_SOUND) window.FOCENOFF_SOUND.set(true);
      } else {
        preview.muted = true;
      }
      window.dispatchEvent(new CustomEvent('focenoff:sound-sync'));
    });
    window.addEventListener('focenoff:sound-sync', syncIcon);
    document.addEventListener('focenoff:modal-close', syncIcon);
    media.appendChild(muteBtn);
  }
}

/* ============================================================
   CAROUSEL LAYOUT — one window per author. The prev/next arrows
   flip through that author's videos right inside the preview,
   reusing the exact same button style & placement as the feed
   layout (.motion-nav / .motion-counter), with no page scroll.
============================================================ */
function buildCarouselNav(media, labelPrev, labelNext) {
  const mkBtn = (dir, label, path) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'motion-nav motion-nav--' + dir;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
    return b;
  };
  const prev = mkBtn('prev', labelPrev, 'M15 18l-6-6 6-6');
  const next = mkBtn('next', labelNext, 'M9 18l6-6-6-6');
  const counter = document.createElement('span');
  counter.className = 'motion-counter';
  media.appendChild(prev);
  media.appendChild(next);
  media.appendChild(counter);
  return { prev, next, counter };
}

function initMotionCarousel(root, clips) {
  const preview = root.querySelector('.motion-card__preview');
  const poster  = root.querySelector('.motion-card__poster');
  const playBtn = root.querySelector('.motion-card__play');
  const titleEl = root.querySelector('.motion-title');
  const typeEl  = root.querySelector('.motion-type');
  const viewsEl = root.querySelector('.motion-views');
  const ytLink  = root.querySelector('.motion-yt-link');
  const media   = root.querySelector('.work-item__media');
  let cur = 0, soundOn = false, counter = null, muteBtn = null;

  const ICON_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9 2 9 2 15 6 15 11 19Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9 2 9 2 15 6 15 11 19Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.8 5.5a9 9 0 0 1 0 13"/></svg>';
  function syncIcon() {
    if (!muteBtn) return;
    muteBtn.innerHTML = preview.muted ? ICON_MUTED : ICON_SOUND;
    muteBtn.classList.toggle('is-on', !preview.muted);
    muteBtn.setAttribute('aria-label', preview.muted ? 'Включить звук' : 'Выключить звук');
    muteBtn.setAttribute('aria-pressed', String(!preview.muted));
  }

  preview.muted = true;
  preview.addEventListener('error', () => {
    if (preview.dataset.fellBack) return;
    preview.dataset.fellBack = '1';
    preview.src = preview.dataset.fullSrc || '';
    preview.play().catch(() => {});
  });

  function render(i) {
    cur = (i + clips.length) % clips.length;
    const clip = clips[cur];
    titleEl.textContent = clip.title || '';
    typeEl.textContent  = clip.label || '';
    { const _v = ytStat(clip.views, extractYtId(clip.ytUrl)); viewsEl.innerHTML = fmtAccent(_v); viewsEl.hidden = !_v; }
    if (clip.ytUrl) { ytLink.href = clip.ytUrl; ytLink.hidden = false; } else ytLink.hidden = true;
    const fullSrc = toSrc(clip.file);
    playBtn.setAttribute('data-video-src', fullSrc);
    if (clip.poster) { poster.src = clip.poster; poster.hidden = false; } else poster.hidden = true;
    preview.dataset.fullSrc = fullSrc;
    preview.dataset.fellBack = '';
    preview.muted = !soundOn;
    preview.src = toPreviewSrc(clip.file);
    const p = preview.play(); if (p && p.catch) p.catch(() => {});
    if (counter) counter.textContent = (cur + 1) + ' / ' + clips.length;
    syncIcon();
  }

  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) preview.play().catch(() => {}); else preview.pause(); });
    }, { threshold: 0.25 });
    io.observe(root);
  }

  if (media && clips.length > 1) {
    const nav = buildCarouselNav(media, 'Предыдущее видео этого автора', 'Следующее видео этого автора');
    counter = nav.counter;
    nav.prev.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); render(cur - 1); });
    nav.next.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); render(cur + 1); });
  }

  if (media) {
    muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.className = 'motion-mute';
    muteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (preview.muted) {
        document.querySelectorAll('.motion-card__preview').forEach(v => { if (v !== preview) v.muted = true; });
        soundOn = true; preview.muted = false;
        const p = preview.play(); if (p && p.catch) p.catch(() => {});
        if (window.FOCENOFF_SOUND) window.FOCENOFF_SOUND.set(true);
      } else {
        soundOn = false; preview.muted = true;
      }
      window.dispatchEvent(new CustomEvent('focenoff:sound-sync'));
    });
    window.addEventListener('focenoff:sound-sync', () => { soundOn = !preview.muted; syncIcon(); });
    document.addEventListener('focenoff:modal-close', syncIcon);
    media.appendChild(muteBtn);
  }

  render(0);
}

function initVideoCarousel(root, items) {
  const img      = root.querySelector('.work-item__thumb');
  const playBtn  = root.querySelector('.work-item__play');
  const nameLink = root.querySelector('.work-item__name a');
  const typeEl   = root.querySelector('.work-item__type');
  const statEl   = root.querySelector('.work-item__stat');
  const media    = root.querySelector('.work-item__media');
  let cur = 0, counter = null;

  function render(i) {
    cur = (i + items.length) % items.length;
    const it = items[cur];
    img.src = it.thumbnail || '';
    img.alt = it.name || '';
    if (it.videoId) {
      playBtn.setAttribute('data-video-id', it.videoId);
      playBtn.setAttribute('aria-label', 'Смотреть — ' + (it.name || ''));
    } else {
      playBtn.removeAttribute('data-video-id');
    }
    nameLink.textContent = it.name || '';
    if (it.nameUrl) nameLink.href = it.nameUrl;
    else nameLink.removeAttribute('href');
    typeEl.textContent = it.type || '';
    statEl.innerHTML   = fmtAccent(ytStat(it.stat, it.videoId));
    if (counter) counter.textContent = (cur + 1) + ' / ' + items.length;
  }

  if (media && items.length > 1) {
    const nav = buildCarouselNav(media, 'Предыдущее видео этого автора', 'Следующее видео этого автора');
    counter = nav.counter;
    nav.prev.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); render(cur - 1); });
    nav.next.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); render(cur + 1); });
  }

  render(0);
}

let lenis;

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  // Mobile perf: use native touch scrolling (syncTouch off) so Lenis doesn't
  // hijack every touch move — much smoother on phones. Lenis stays available
  // for wheel + programmatic scrollTo on desktop.
  const isTouch = matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  lenis = new Lenis({
    lerp:            0.085,
    wheelMultiplier: 1.0,
    smoothWheel:     true,
    syncTouch:       !isTouch,
    touchMultiplier: 1.2,
  });
  if (typeof gsap !== 'undefined') {
    lenis.on('scroll', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
}

let preloaderDone = false;

function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) { preloaderDone = true; return; }
  if (typeof gsap === 'undefined') { preloader.style.display = 'none'; preloaderDone = true; return; }
  document.body.classList.add('is-loading');
  // Preloader animation is injected by renderPreloaderAnim() once content loads
  // (so the admin-selected Lottie/video/image is used).
  const fill  = document.getElementById('preloaderFill');
  const numEl = document.getElementById('preloaderNum');
  const obj   = { val: 0 };
  const tl = gsap.timeline({
    onComplete() {
      document.body.classList.remove('is-loading');
      preloaderDone = true;
      preloader.style.display = 'none';
    },
  });
  tl.to(obj, {
    val: 100, duration: 1.7, ease: 'power2.inOut',
    onUpdate() {
      const v = Math.round(obj.val);
      if (numEl) numEl.textContent = v;
      if (fill)  fill.style.width  = v + '%';
    },
  });
  tl.to({}, { duration: 0.18 });
  tl.to(preloader, { opacity: 0, duration: 0.9, ease: 'power2.inOut' });
  return tl;
}

function splitLineToChars(lineEl) {
  const text = lineEl.textContent.trim();
  const isOutline = lineEl.classList.contains('hero__line--outline');
  lineEl.innerHTML = text.split('').map(ch => {
    const inner = `<span class="char">${ch === ' ' ? '&nbsp;' : escapeHtml(ch)}</span>`;
    return `<span class="char-wrap${isOutline ? ' char-wrap--outline' : ''}">${inner}</span>`;
  }).join('');
}

function initHeroChars() {
  document.querySelectorAll('.hero__line').forEach(l => splitLineToChars(l));
}

function fitHeroTitle() {
  const titleEl = document.getElementById('heroTitle');
  const heroEl  = document.querySelector('.hero');
  if (!titleEl || !heroEl) return;
  const lines = Array.from(titleEl.querySelectorAll('.hero__line'));
  if (!lines.length) return;
  lines.forEach(l => l.style.fontSize = '');
  const padLeft   = parseFloat(getComputedStyle(heroEl).paddingLeft) || 0;
  const available = heroEl.clientWidth - padLeft;
  const widths    = lines.map(l => l.scrollWidth);
  const maxWidth  = Math.max(...widths);
  if (maxWidth <= available) return;
  const longestIdx = widths.indexOf(maxWidth);
  const currentFs  = parseFloat(getComputedStyle(lines[longestIdx]).fontSize);
  const newFs      = Math.floor(currentFs * (available / maxWidth) * 0.96);
  lines.forEach(l => { l.style.fontSize = newFs + 'px'; });
}

function fitDisplayText() {
  const fit = (els) => {
    els = els.filter(Boolean);
    if (!els.length) return;
    els.forEach(el => { el.style.fontSize = ''; });
    let ratio = 1;
    els.forEach(el => {
      const avail = el.parentElement ? el.parentElement.clientWidth : 0;
      if (!avail) return;
      const w = el.scrollWidth || el.getBoundingClientRect().width;
      if (w > avail) ratio = Math.min(ratio, avail / w);
    });
    if (ratio >= 1) return;
    els.forEach(el => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = Math.max(14, Math.floor(fs * ratio * 0.97)) + 'px';
    });
  };
  fit(Array.from(document.querySelectorAll('.menu-nav__text')));
  fit(Array.from(document.querySelectorAll('.contact-cta__link span[data-text]')));
  document.querySelectorAll('.works__chapter-title').forEach(el => fit([el]));
  document.querySelectorAll('.work-item__name').forEach(el => fit([el]));
}

function fitAllDisplayText() { fitHeroTitle(); fitDisplayText(); }

/* ============================================================
   MARQUEE — GSAP infinite scroll (fixes CSS anim on desktop+Lenis)
============================================================ */
function initMarqueeGSAP() {
  const track = document.getElementById('marqueeTrack');
  if (!track || typeof gsap === 'undefined') return;
  function start() {
    requestAnimationFrame(() => {
      const halfW = track.scrollWidth / 2;
      if (halfW <= 0) return;
      gsap.fromTo(track, { x: 0 }, { x: -halfW, duration: 40, ease: 'none', repeat: -1 });
    });
  }
  if (track.children.length >= 4) {
    start();
  } else {
    window.addEventListener('focenoff:content', () => requestAnimationFrame(() => requestAnimationFrame(start)), { once: true });
  }
}

/* ============================================================
   WORKED WITH — GSAP infinite scroll
============================================================ */
function initWorkedWithGSAP() {
  const track = document.getElementById('workedWithTrack');
  if (!track || typeof gsap === 'undefined') return;
  requestAnimationFrame(() => {
    const halfW = track.scrollWidth / 2;
    if (halfW <= 0) return;
    gsap.fromTo(track, { x: 0 }, { x: -halfW, duration: 28, ease: 'none', repeat: -1 });
  });
}

function initGSAP() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('gsap-ready');
  const preloaderDelay = preloaderDone ? 0 : 1.9;
  const chars = document.querySelectorAll('.hero__line .char');
  if (chars.length) {
    gsap.set(chars, { yPercent: 115 });
    gsap.to(chars, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: { amount: 0.35, from: 'start' }, delay: preloaderDelay });
  }
  const heroEyebrow = document.querySelector('.hero__eyebrow');
  if (heroEyebrow) gsap.fromTo(heroEyebrow, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: preloaderDelay + 0.1 });
  const heroCta = document.querySelector('.hero__cta-group');
  if (heroCta) gsap.fromTo(heroCta, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: preloaderDelay + 0.35 });
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    gsap.to(heroTitle, {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
  initWorksReveal();
  initStatementReveal();
  revealOnView(document.querySelector('.contact-cta__label'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
  revealOnView(document.querySelector('.contact-cta__link'), { opacity: 0, y: 60, skewY: 1.5 }, { opacity: 1, y: 0, skewY: 0, duration: 1.3, ease: 'expo.out' });
  /* Marquee tracks — GSAP-driven (content already loaded before initGSAP runs) */
  initMarqueeGSAP();
  initWorkedWithGSAP();
  ScrollTrigger.refresh();
}

function revealOnView(el, fromVars, toVars) {
  if (!el || typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.set(el, fromVars);
  let done = false;
  const go = () => { if (done) return; done = true; gsap.to(el, Object.assign({}, toVars)); };
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { go(); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) go();
    });
  } else { go(); }
}

let worksRevealInited = false;
function initWorksReveal() {
  if (worksRevealInited) return;
  worksRevealInited = true;
  if (typeof gsap === 'undefined') { initFallbackReveal(); return; }
  document.body.classList.add('gsap-ready');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('[data-work], [data-work-chapter]');
  if (calm) {
    gsap.set(items, { opacity: 1, y: 0 });
  } else {
    gsap.set(items, { opacity: 0, y: 40 });
    items.forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}

function splitToWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);
  textNodes.forEach(tn => {
    const words = tn.textContent.split(/(\s+)/);
    const frag  = document.createDocumentFragment();
    words.forEach(w => {
      if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); }
      else if (w) {
        const outer = document.createElement('span'); outer.className = 'word'; outer.setAttribute('aria-hidden', 'false');
        const inner = document.createElement('span'); inner.className = 'word__inner'; inner.textContent = w;
        outer.appendChild(inner); frag.appendChild(outer);
      }
    });
    tn.parentNode.replaceChild(frag, tn);
  });
}

function initStatementReveal() {
  const stEl = document.querySelector('.statement__text');
  if (!stEl || typeof gsap === 'undefined') return;
  splitToWords(stEl);
  const words = stEl.querySelectorAll('.word__inner');
  if (!words.length) return;
  const ctaEl = document.querySelector('.statement__cta');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.set(words, { yPercent: 110 });
  if (ctaEl) gsap.set(ctaEl, { opacity: 0, y: 16 });
  let revealed = false;
  function reveal() {
    if (revealed) return; revealed = true;
    gsap.to(words, { yPercent: 0, duration: 0.85, ease: 'expo.out', stagger: { amount: 0.6, from: 'start' } });
    if (ctaEl) gsap.to(ctaEl, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.25 });
  }
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => { if (entries.some(e => e.isIntersecting)) { reveal(); io.disconnect(); } }, { threshold: 0.18 });
    io.observe(stEl);
    requestAnimationFrame(() => { const r = stEl.getBoundingClientRect(); if (r.top < window.innerHeight * 0.85 && r.bottom > 0) reveal(); });
  } else { reveal(); }
}

function initMenu() {
  const toggle  = document.getElementById('menuToggle');
  const overlay = document.getElementById('menuOverlay');
  const header  = document.getElementById('header');
  if (!toggle || !overlay) return;
  const menuLinks = overlay.querySelectorAll('.menu-nav__link');
  let isOpen = false;
  function openMenu() {
    isOpen = true; overlay.classList.add('is-open'); overlay.removeAttribute('aria-hidden');
    header.classList.add('header--open'); toggle.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    isOpen = false; overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true');
    header.classList.remove('header--open'); toggle.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start(); document.body.style.overflow = '';
  }
  toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) setTimeout(() => { if (lenis) lenis.scrollTo(target, { offset: -80 }); else target.scrollIntoView({ behavior: 'smooth' }); }, 420);
      }
    });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeMenu(); });
}

function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');
  // Страница отрисована с CSS-zoom (см. html { zoom }). Координаты мыши приходят
  // в физических пикселях, а translate внутри .cursor дополнительно масштабируется
  // этим zoom — поэтому делим на коэффициент, чтобы курсор точно совпадал с указателем.
  const zoomOf = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  let zoom = zoomOf();
  window.addEventListener('resize', () => { zoom = zoomOf(); }, { passive: true });
  let mx = window.innerWidth / 2 / zoom, my = window.innerHeight / 2 / zoom;
  let rx = mx, ry = my, px = mx, py = my;
  window.addEventListener('mousemove', e => { mx = e.clientX / zoom; my = e.clientY / zoom; });
  function animateCursor() {
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    const vx = rx - px, vy = ry - py; px = rx; py = ry;
    const sp = Math.min(Math.hypot(vx, vy) / 24, 0.55);
    const ang = Math.atan2(vy, vx) * 180 / Math.PI;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) rotate(${ang}deg) scale(${1 + sp}, ${1 - sp * 0.5})`;
    if (label) label.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);
  document.addEventListener('mouseover', e => {
    const playTarget = e.target.closest('.work-item__play');
    if (playTarget) {
      const fromPlay = e.relatedTarget instanceof Element ? e.relatedTarget.closest('.work-item__play') : null;
      if (fromPlay === playTarget) return;
      cursor.classList.remove('cursor--hover'); cursor.classList.add('cursor--play');
      if (label) label.textContent = 'WATCH';
    } else {
      const hoverTarget = e.target.closest('a, button');
      if (!hoverTarget) return;
      const fromHover = e.relatedTarget instanceof Element ? e.relatedTarget.closest('a, button') : null;
      if (fromHover === hoverTarget) return;
      cursor.classList.add('cursor--hover');
    }
  });
  document.addEventListener('mouseout', e => {
    const playTarget = e.target.closest('.work-item__play');
    if (playTarget) {
      const toPlay = e.relatedTarget instanceof Element ? e.relatedTarget.closest('.work-item__play') : null;
      if (toPlay === playTarget) return;
      cursor.classList.remove('cursor--play');
      if (label) label.textContent = '';
    } else {
      const hoverTarget = e.target.closest('a, button');
      if (!hoverTarget) return;
      const toHover = e.relatedTarget instanceof Element ? e.relatedTarget.closest('a, button') : null;
      if (toHover === hoverTarget) return;
      cursor.classList.remove('cursor--hover');
    }
  });
}

function initVideoModal() {
  const modal    = document.getElementById('vModal');
  const iframe   = document.getElementById('vModalIframe');
  const localVid = document.getElementById('vModalVideo');
  const closeBtn = document.getElementById('vModalClose');
  const backdrop = document.getElementById('vModalBackdrop');
  if (!modal) return;
  let pausedByModal = [];
  function pauseBackground() {
    pausedByModal = [];
    document.querySelectorAll('.motion-player__video, .motion-card__preview').forEach(v => { if (!v.paused) { v.pause(); pausedByModal.push(v); } });
    document.dispatchEvent(new CustomEvent('focenoff:modal-open'));
  }
  function resumeBackground() {
    pausedByModal.forEach(v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); });
    pausedByModal = [];
    document.dispatchEvent(new CustomEvent('focenoff:modal-close'));
  }
  function showModal() {
    pauseBackground(); modal.hidden = false; document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop(); closeBtn.focus();
    if (typeof gsap !== 'undefined') gsap.fromTo(modal.querySelector('.v-modal__box'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' });
  }
  function openModal(videoId) {
    if (localVid) { localVid.pause(); localVid.removeAttribute('src'); localVid.hidden = true; }
    iframe.hidden = false;
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&controls=1&autoplay=1`;
    showModal();
  }
  function closeModal() {
    const box = modal.querySelector('.v-modal__box');
    const teardown = () => {
      iframe.src = '';
      if (localVid) { localVid.onerror = null; localVid.pause(); localVid.removeAttribute('src'); localVid.load(); }
      modal.hidden = true; document.body.style.overflow = '';
      if (lenis) lenis.start(); resumeBackground();
    };
    if (typeof gsap !== 'undefined') gsap.to(box, { scale: 0.93, opacity: 0, duration: 0.28, ease: 'expo.in', onComplete: teardown });
    else teardown();
  }
  function openLocal(src) {
    if (!localVid) return;
    iframe.hidden = true; iframe.src = '';
    localVid.hidden = false;
    localVid.src = src;
    localVid.muted = false;
    try { localVid.currentTime = 0; } catch { }
    showModal();
    const p = localVid.play(); if (p && p.catch) p.catch(() => {});
  }
  window.openVideoModal = openModal;
  window.openLocalVideoModal = openLocal;
  document.addEventListener('click', e => {
    // Ignore clicks on the per-clip nav arrows / sound toggle (handled elsewhere).
    if (e.target.closest('.motion-nav') || e.target.closest('.motion-mute')) return;
    // Local motion clips (each its own player) — open the full clip in the modal.
    const localBtn = e.target.closest('.work-item__play[data-video-src]');
    if (localBtn) { e.preventDefault(); openLocal(localBtn.dataset.videoSrc); return; }
    const localMedia = e.target.closest('.work-item--motion-card .work-item__media');
    if (localMedia && !e.target.closest('a')) {
      const pb = localMedia.querySelector('.work-item__play[data-video-src]');
      if (pb) { e.preventDefault(); openLocal(pb.dataset.videoSrc); return; }
    }
    // YouTube (Long Videos)
    const btn = e.target.closest('.work-item__play[data-video-id]');
    if (btn) { e.preventDefault(); openModal(btn.dataset.videoId); return; }
    const media = e.target.closest('.work-item--yt .work-item__media');
    if (media && !e.target.closest('a')) {
      const pb = media.querySelector('.work-item__play[data-video-id]');
      if (pb) { e.preventDefault(); openModal(pb.dataset.videoId); }
    }
  });
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
}

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.5 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initFallbackReveal() {
  document.querySelectorAll('[data-work], [data-work-chapter]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  document.querySelectorAll('.word__inner').forEach(el => { el.style.transform = 'none'; });
  document.querySelectorAll('.char').forEach(el => { el.style.transform = 'none'; });
}

document.addEventListener('DOMContentLoaded', async () => {
  initLenis();
  const preloaderTl = initPreloader();
  await loadContent();
  initHeroChars();
  initMenu();
  initCursor();
  initVideoModal();
  initAnchorScroll();
  initGroupNav();
  window.addEventListener('resize', fitAllDisplayText, { passive: true });
  const heroLine = document.querySelector('.hero__line');
  const heroFs = heroLine ? getComputedStyle(heroLine).fontSize : '100px';
  Promise.all([
    document.fonts.ready,
    document.fonts.load(`400 ${heroFs} AKONY`).catch(() => {}),
  ]).then(() => fitAllDisplayText());
  window.addEventListener('load', () => setTimeout(fitAllDisplayText, 300));
  if (typeof gsap !== 'undefined') {
    const initDelay = preloaderDone ? 0 : 50;
    setTimeout(() => {
      initGSAP();
      window.addEventListener('load', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); }, { once: true });
    }, initDelay);
  } else {
    initFallbackReveal();
  }
});
