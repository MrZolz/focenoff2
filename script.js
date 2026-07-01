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
      id: 'motion', type: 'motion', num: '02', title: 'MOTION',
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
      id: 'long-videos', type: 'videos', num: '03', title: 'LONG VIDEOS',
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
  applyTexts();
  applyLinks();
  renderMarquee();
  renderMenu();
  renderWorks();
  renderWorkedWith();
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

function applyLinks() {
  const l = (CONTENT && CONTENT.links) || {};
  document.querySelectorAll('[data-link]').forEach(el => {
    const key = el.getAttribute('data-link');
    if (l[key]) el.setAttribute('href', l[key]);
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
  const tplChapter = document.getElementById('tplChapterCard');
  const tplMotion  = document.getElementById('tplMotion');
  const tplCard    = document.getElementById('tplVideoCard');
  container.innerHTML = '';
  let globalIdx = 0;
  sections.forEach(section => {
    const clips = section.type === 'motion' ? (section.clips || []) : (section.items || []);
    const count = clips.length;
    if (tplChapter) {
      const ch = tplChapter.content.firstElementChild.cloneNode(true);
      ch.querySelector('.works__chapter-num').textContent   = section.num || '';
      ch.querySelector('.works__chapter-title').textContent = section.title || '';
      ch.querySelector('.works__chapter-count').textContent = count + ' PROJECT' + (count !== 1 ? 'S' : '');
      container.appendChild(ch);
    }
    if (section.type === 'motion') {
      if (!tplMotion || !clips.length) return;
      globalIdx++;
      const node = tplMotion.content.firstElementChild.cloneNode(true);
      node.querySelector('.work-item__index').textContent = String(globalIdx).padStart(2, '0');
      const thumb = node.querySelector('.motion-player__thumb');
      if (section.thumbnail) thumb.src = section.thumbnail;
      else thumb.hidden = true;
      container.appendChild(node);
      initMotionPlayer(node, clips);
    } else {
      clips.forEach(item => {
        if (!tplCard) return;
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
        node.querySelector('.work-item__index').textContent = String(globalIdx).padStart(2, '0');
        const nameLink = node.querySelector('.work-item__name a');
        nameLink.textContent = item.name || '';
        if (item.nameUrl) nameLink.href = item.nameUrl;
        else nameLink.removeAttribute('href');
        node.querySelector('.work-item__type').textContent = item.type || '';
        node.querySelector('.work-item__stat').innerHTML   = fmtAccent(item.stat || '');
        container.appendChild(node);
      });
    }
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
      const item = document.createElement('div');
      item.className = 'worked-with__item';
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
   MOTION PLAYER
============================================================ */
function initMotionPlayer(root, clips) {
  const video    = root.querySelector('.motion-player__video');
  const thumb    = root.querySelector('.motion-player__thumb');
  const playBtn  = root.querySelector('.motion-player__play');
  const prevBtn  = root.querySelector('.motion-nav--prev');
  const nextBtn  = root.querySelector('.motion-nav--next');
  const curEl    = root.querySelector('.motion-counter__cur');
  const totalEl  = root.querySelector('.motion-counter__total');
  const muteBtn  = root.querySelector('.motion-mute');
  const titleEl  = root.querySelector('.motion-title');
  const typeEl   = root.querySelector('.motion-type');
  const viewsEl  = root.querySelector('.motion-views');
  const ytLink   = root.querySelector('.motion-yt-link');
  let idx = 0;
  let started = false;
  totalEl.textContent = String(clips.length);
  function setSrc(clip) {
    const fullSrc = toSrc(clip.file);
    delete video.dataset.fellBack;
    video.dataset.fullSrc = fullSrc;
    video.src = toPreviewSrc(clip.file);
  }
  video.addEventListener('error', () => {
    if (video.dataset.fellBack) return;
    video.dataset.fellBack = '1';
    video.src = video.dataset.fullSrc;
    if (started) video.play().catch(() => {});
  });
  function applyCaption(clip) {
    titleEl.textContent = clip.title || '';
    typeEl.textContent  = clip.label || '';
    viewsEl.innerHTML   = fmtAccent(clip.views || '');
    viewsEl.hidden      = !clip.views;
    if (clip.ytUrl) { ytLink.href = clip.ytUrl; ytLink.hidden = false; }
    else ytLink.hidden = true;
  }
  function load(i, autoplay) {
    idx = (i + clips.length) % clips.length;
    const clip = clips[idx];
    curEl.textContent = String(idx + 1);
    applyCaption(clip);
    setSrc(clip);
    if (autoplay) video.play().catch(() => {});
  }
  function start() {
    if (started) {
      video.paused ? video.play().catch(() => {}) : video.pause();
      return;
    }
    started = true;
    root.classList.add('is-playing');
    thumb.hidden = true;
    muteBtn.hidden = false;
    video.play().catch(() => {});
  }
  playBtn.addEventListener('click', (e) => { e.stopPropagation(); start(); });
  video.addEventListener('click', () => { if (started) video.paused ? video.play().catch(() => {}) : video.pause(); });
  video.addEventListener('play',  () => root.classList.add('is-playing'));
  video.addEventListener('pause', () => root.classList.remove('is-playing'));
  video.addEventListener('ended', () => load(idx + 1, true));
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); load(idx - 1, started); if (!started) start(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); load(idx + 1, started); if (!started) start(); });
  const iconOff = muteBtn.querySelector('.mute-icon--off');
  const iconOn  = muteBtn.querySelector('.mute-icon--on');
  window.FOCENOFF_SOUND.subscribe((on) => {
    video.muted = !on;
    if (iconOff) iconOff.toggleAttribute('hidden', on);
    if (iconOn)  iconOn.toggleAttribute('hidden', !on);
    muteBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', on ? 'Выключить звук' : 'Включить звук');
  });
  muteBtn.addEventListener('click', (e) => { e.stopPropagation(); window.FOCENOFF_SOUND.toggle(); });
  if (typeof IntersectionObserver !== 'undefined') {
    let pausedByScroll = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!started) return;
        if (!entry.isIntersecting && !video.paused) { video.pause(); pausedByScroll = true; }
        else if (entry.isIntersecting && pausedByScroll) { video.play().catch(() => {}); pausedByScroll = false; }
      });
    }, { threshold: 0.25 });
    io.observe(root);
  }
  load(0, false);
}

let lenis;

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    lerp:            0.085,
    wheelMultiplier: 1.0,
    smoothWheel:     true,
    syncTouch:       true,
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
  tl.to(preloader, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' });
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
  const heroBottom = document.querySelector('.hero__bottom');
  if (heroBottom) gsap.fromTo(heroBottom, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: preloaderDelay + 0.35 });
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
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my, px = mx, py = my;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
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
    document.querySelectorAll('.motion-player__video').forEach(v => { if (!v.paused) { v.pause(); pausedByModal.push(v); } });
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
  window.openVideoModal = openModal;
  document.addEventListener('click', e => {
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
