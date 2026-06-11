'use strict';

/* ============================================================
   SITE MODE — immersive (full) vs simple (lite)
   The user can override auto-detection with the header toggle.
   'auto' (default) → immersive wherever WebGL runs; 'lite' → DOM
   version; 'full' → force immersive even with reduced-motion.
   webgl.js reads window.FOCENOFF_MODE before booting the scene.
============================================================ */
window.FOCENOFF_MODE = (() => {
  try {
    const m = localStorage.getItem('focenoff_mode');
    if (m === 'lite' || m === 'full') return m;
  } catch (e) { /* storage unavailable → auto */ }
  return 'auto';
})();
if (window.FOCENOFF_MODE === 'lite') document.documentElement.classList.add('mode-lite');

/* ============================================================
   GLOBAL SOUND STATE — one switch for every video on the site.
   Both the WebGL HUD button and the DOM panel buttons drive it;
   all videos + all icons stay in sync.
============================================================ */
window.FOCENOFF_SOUND = (() => {
  const subs = [];
  let on = false;
  return {
    get on() { return on; },
    set(v) {
      v = !!v;
      if (v === on) return;
      on = v;
      subs.forEach((fn) => { try { fn(on); } catch (e) { /* keep others alive */ } });
    },
    toggle() { this.set(!on); },
    subscribe(fn) { subs.push(fn); fn(on); },
  };
})();

/* ============================================================
   CONTENT LAYER
============================================================ */
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
  sections: [
    {
      id: 'motion', type: 'motion', num: '02', title: 'MOTION',
      clips: [
        { file: 'scammers.mp4',     title: 'SCAMMERS',     label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is' },
        { file: 'scammers (2).mp4', title: 'SCAMMERS',     label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is' },
        { file: 'scammers (3).mp4', title: 'SCAMMERS',     label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is' },
        { file: 'scammers (4).mp4', title: 'SCAMMERS',     label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is' },
        { file: 'scammers (5).mp4', title: 'SCAMMERS',     label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=_5AatlIb_is' },
        { file: 'харчевников.mp4',  title: 'ХАРЧЕВНИКОВ',  label: 'Motion · YouTube', ytUrl: 'https://www.youtube.com/watch?v=n75_-ntNL2I' },
      ],
    },
    {
      id: 'long-videos', type: 'videos', num: '03', title: 'LONG VIDEOS',
      items: [
        { thumbnail: 'media/zhbMghFRk_Q_maxres.jpg',   videoId: 'zhbMghFRk_Q', name: 'КЭШЗЛО',   type: 'УСТРОИЛСЯ РАБОТАТЬ В СКАМ ОФИС',                stat: '*350K* views' },
        { thumbnail: 'media/1xpPfVB1R64_maxres.jpg',   videoId: '1xpPfVB1R64', name: 'КЭШЗЛО',   type: '30 ДНЕЙ ТОРЧАЛ НА САМЫХ ПОПУЛЯРНЫХ Н##КОТИКАХ', stat: '*540K* views' },
        { thumbnail: 'media/video09_thumbnail.jpg',
          videoId: '2KrKQPX0m5A', name: 'FOCENOFF', type: 'Я – МОНТАЖЕР SCAMMERS (не кликбейт)', stat: '*13K* views' },
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

async function fetchContent() {
  // content.json is the single source of truth: the admin server rewrites it on
  // every save, so a relative static fetch works identically on the Express host
  // and on a plain static host (GitHub Pages) — no /api dependency, no 404 noise.
  try {
    const res = await fetch('content.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return EMBEDDED_DEFAULTS;
}

async function loadContent() {
  CONTENT = await fetchContent();
  applyTexts();
  applyLinks();
  renderMarquee();
  renderMenu();
  renderWorks();
  // share content with the WebGL layer (webgl.js builds the flying gallery)
  window.FOCENOFF_CONTENT = CONTENT;
  window.dispatchEvent(new CustomEvent('focenoff:content', { detail: CONTENT }));
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
  const tplPanel   = document.getElementById('tplWorkPanel');
  const tplCard    = document.getElementById('tplVideoCard');
  container.innerHTML = '';

  let globalIdx = 0;

  sections.forEach(section => {
    const clips = section.type === 'motion' ? (section.clips || []) : (section.items || []);
    const count = clips.length;

    // Chapter title card
    if (tplChapter) {
      const ch = tplChapter.content.firstElementChild.cloneNode(true);
      ch.querySelector('.work-chapter__num').textContent  = section.num || '';
      ch.querySelector('.work-chapter__title').textContent = section.title || '';
      ch.querySelector('.work-chapter__count').textContent = count + ' PROJECT' + (count !== 1 ? 'S' : '');
      container.appendChild(ch);
    }

    if (section.type === 'motion') {
      clips.forEach(clip => {
        if (!tplPanel) return;
        globalIdx++;
        const node  = tplPanel.content.firstElementChild.cloneNode(true);
        const video = node.querySelector('.work-panel__video');
        video.src   = toSrc(clip.file);
        node.querySelector('.work-panel__num').textContent   = String(globalIdx).padStart(2, '0');
        node.querySelector('.work-panel__title').textContent = clip.title || '';
        node.querySelector('.work-panel__type').textContent  = clip.label || '';
        const ytLink = node.querySelector('.work-panel__yt-link');
        if (clip.ytUrl) ytLink.href = clip.ytUrl;
        else ytLink.style.display = 'none';
        container.appendChild(node);
      });
    } else {
      clips.forEach(item => {
        if (!tplCard) return;
        globalIdx++;
        const node    = tplCard.content.firstElementChild.cloneNode(true);
        const img     = node.querySelector('.work-panel__thumb');
        img.src       = item.thumbnail || '';
        img.alt       = item.name || '';
        const playBtn = node.querySelector('.work-panel__play-btn');
        if (item.videoId) {
          playBtn.setAttribute('data-video-id', item.videoId);
          playBtn.setAttribute('aria-label', 'Смотреть — ' + (item.name || ''));
        }
        node.querySelector('.work-panel__num').textContent   = String(globalIdx).padStart(2, '0');
        node.querySelector('.work-panel__title').textContent = item.name || '';
        node.querySelector('.work-panel__type').textContent  = item.type || '';
        node.querySelector('.work-panel__stat').innerHTML    = fmtAccent(item.stat || '');
        container.appendChild(node);
      });
    }
  });

  // Update counter max display
  const counterEl = document.getElementById('worksCount');
  if (counterEl) counterEl.textContent = '01';
}

/* ============================================================
   LENIS — Smooth Scroll (integrated with GSAP ticker)
============================================================ */
let lenis;

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    lerp:            0.085,   // continuous inertia — heavier, cinematic glide
    wheelMultiplier: 1.0,
    smoothWheel:     true,
    syncTouch:       true,    // drive the mobile fly-through through Lenis too
    touchMultiplier: 1.2,
  });

  if (typeof gsap !== 'undefined') {
    lenis.on('scroll', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

/* ============================================================
   PRELOADER — GSAP counter + clip-path wipe
============================================================ */
let preloaderDone = false;

function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) { preloaderDone = true; return; }

  if (typeof gsap === 'undefined') {
    preloader.style.display = 'none';
    preloaderDone = true;
    return;
  }

  document.body.classList.add('is-loading');

  const fill    = document.getElementById('preloaderFill');
  const numEl   = document.getElementById('preloaderNum');
  const obj     = { val: 0 };

  const tl = gsap.timeline({
    onComplete() {
      document.body.classList.remove('is-loading');
      preloaderDone = true;
      preloader.style.display = 'none';
    },
  });

  tl.to(obj, {
    val: 100,
    duration: 1.7,
    ease: 'power2.inOut',
    onUpdate() {
      const v = Math.round(obj.val);
      if (numEl)  numEl.textContent = v;
      if (fill)   fill.style.width  = v + '%';
    },
  });

  tl.to({}, { duration: 0.18 });

  tl.to(preloader, {
    clipPath: 'inset(100% 0% 0% 0%)',
    duration: 0.9,
    ease: 'expo.inOut',
  });

  return tl;
}

/* ============================================================
   HERO — split title into char spans + animate
============================================================ */
function splitLineToChars(lineEl) {
  const text = lineEl.textContent.trim();
  const isOutline = lineEl.classList.contains('hero__line--outline');
  lineEl.innerHTML = text.split('').map(ch => {
    const inner = `<span class="char">${ch === ' ' ? '&nbsp;' : escapeHtml(ch)}</span>`;
    return `<span class="char-wrap${isOutline ? ' char-wrap--outline' : ''}">${inner}</span>`;
  }).join('');
}

function initHeroChars() {
  const lines = document.querySelectorAll('.hero__line');
  lines.forEach(l => splitLineToChars(l));
}

/* Fit hero title so every line fits within available width */
function fitHeroTitle() {
  const titleEl = document.getElementById('heroTitle');
  const heroEl  = document.querySelector('.hero');
  if (!titleEl || !heroEl) return;

  const lines = Array.from(titleEl.querySelectorAll('.hero__line'));
  if (!lines.length) return;

  // Clear any previous inline override so CSS value is active
  lines.forEach(l => l.style.fontSize = '');

  // Available width = hero client width minus left padding only
  // (text can bleed toward right edge, clipped by overflow-x:clip)
  const padLeft   = parseFloat(getComputedStyle(heroEl).paddingLeft) || 0;
  const available = heroEl.clientWidth - padLeft;

  // Measure widths (after font loaded, chars are split into spans)
  const widths   = lines.map(l => l.scrollWidth);
  const maxWidth = Math.max(...widths);

  if (maxWidth <= available) return; // already fits, done

  // Get the actual computed font-size from the line element
  const longestIdx = widths.indexOf(maxWidth);
  const currentFs  = parseFloat(getComputedStyle(lines[longestIdx]).fontSize);
  const newFs      = Math.floor(currentFs * (available / maxWidth) * 0.96); // 4% safety margin

  // Apply inline size directly to each line (overrides CSS)
  lines.forEach(l => { l.style.fontSize = newFs + 'px'; });
}

/* ============================================================
   GSAP — ScrollTrigger + Animations
============================================================ */
function initGSAP() {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('gsap-ready');

  const preloaderDelay = preloaderDone ? 0 : 1.9;

  // ── Hero chars entrance ───────────────────────────────────
  const chars = document.querySelectorAll('.hero__line .char');
  if (chars.length) {
    gsap.set(chars, { yPercent: 115 });
    gsap.to(chars, {
      yPercent: 0,
      duration: 1.4,
      ease: 'expo.out',
      stagger: { amount: 0.35, from: 'start' },
      delay: preloaderDelay,
    });
  }

  const heroEyebrow = document.querySelector('.hero__eyebrow');
  if (heroEyebrow) {
    gsap.fromTo(heroEyebrow,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: preloaderDelay + 0.1 }
    );
  }

  const heroBottom = document.querySelector('.hero__bottom');
  if (heroBottom) {
    gsap.fromTo(heroBottom,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: preloaderDelay + 0.35 }
    );
  }

  // ── Hero parallax on scroll ───────────────────────────────
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    gsap.to(heroTitle, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // ── Works gallery — WebGL flies it (webgl.js); DOM is the fallback ──
  if (!document.body.classList.contains('mode-webgl')) initDomWorks();

  // ── Statement word reveal ─────────────────────────────────
  initStatementReveal();

  // ── Contact CTA reveal (IntersectionObserver — this is the conversion CTA,
  //    it must never be left hidden by a misfiring ScrollTrigger) ──
  revealOnView(document.querySelector('.contact-cta__label'),
    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
  revealOnView(document.querySelector('.contact-cta__link'),
    { opacity: 0, y: 60, skewY: 1.5 }, { opacity: 1, y: 0, skewY: 0, duration: 1.3, ease: 'expo.out' });

  ScrollTrigger.refresh();
}

/* Reveal an element when it scrolls into view — reliable regardless of Lenis /
   ScrollTrigger position caching. Default (no JS / reduced motion) = visible. */
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

/* ============================================================
   DOM WORKS — fallback gallery (no WebGL / touch / reduced-motion)
   Also called by webgl.js if the 3D layer fails at runtime.
============================================================ */
let domWorksInited = false;
function initDomWorks() {
  if (domWorksInited) return;
  domWorksInited = true;
  if (typeof gsap === 'undefined') {
    initFallbackReveal();
    initScrollVideos();
    return;
  }
  document.body.classList.add('gsap-ready');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.innerWidth >= 1024 && !calm) {
    initHorizontalWorks();        // desktop: cinematic horizontal scroll
  } else {
    document.body.classList.add('works-vertical'); // force column layout at any width
    initVerticalWorksReveal();    // mobile / reduced-motion: calm vertical stack
    initScrollVideos();
  }
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}
window.initDomWorksFallback = initDomWorks;

/* ============================================================
   HORIZONTAL WORKS — GSAP pin + x movement
============================================================ */
/* ============================================================
   PANEL SOUND — DOM gallery buttons bound to the global state
============================================================ */
function bindPanelSound(panel) {
  const video   = panel.querySelector('video');
  const muteBtn = panel.querySelector('.work-panel__mute');
  if (!video || !muteBtn || muteBtn.dataset.soundBound) return;
  muteBtn.dataset.soundBound = '1';
  const iconOff = muteBtn.querySelector('.mute-icon--off');
  const iconOn  = muteBtn.querySelector('.mute-icon--on');
  window.FOCENOFF_SOUND.subscribe((on) => {
    video.muted = !on;
    if (iconOff) iconOff.hidden = on;
    if (iconOn)  iconOn.hidden  = !on;
    muteBtn.setAttribute('aria-label', on ? 'Выключить звук' : 'Включить звук');
  });
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.FOCENOFF_SOUND.toggle();
  });
}

function initHorizontalWorks() {
  const hz    = document.querySelector('.works-hz');
  const track = document.getElementById('worksTrack');
  if (!hz || !track) return;

  const panels     = Array.from(track.children);
  const workPanels = panels.filter(p => p.hasAttribute('data-work'));

  if (!workPanels.length) return;

  const getMove = () => -(track.scrollWidth - window.innerWidth);

  gsap.to(track, {
    x: getMove,
    ease: 'none',
    scrollTrigger: {
      trigger: hz,
      start: 'top top',
      end: () => `+=${track.scrollWidth - window.innerWidth}`,
      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        // Progress bar
        const bar = document.getElementById('worksBar');
        if (bar) bar.style.transform = `scaleX(${self.progress})`;

        // Panel counter
        const totalPanels = workPanels.length;
        const idx = Math.min(
          Math.round(self.progress * totalPanels),
          totalPanels
        );
        const counterEl = document.getElementById('worksCount');
        if (counterEl) {
          counterEl.textContent = String(Math.max(idx, 1)).padStart(2, '0');
        }

        // Video autoplay based on horizontal position
        workPanels.forEach(panel => {
          if (!panel.hasAttribute('data-work')) return;
          const video = panel.querySelector('video');
          if (!video) return;
          const r = panel.getBoundingClientRect();
          const panelCenter = r.left + r.width / 2;
          const dist = Math.abs(panelCenter - window.innerWidth / 2);
          if (dist < window.innerWidth * 0.55) {
            video.play().catch(() => {});
            const muteBtn = panel.querySelector('.work-panel__mute');
            if (muteBtn) muteBtn.hidden = false;
          } else {
            video.pause();
            const muteBtn = panel.querySelector('.work-panel__mute');
            if (muteBtn) muteBtn.hidden = true;
          }
        });
      },
    },
  });

  // Video sound — bound to the global state (one switch for all videos)
  workPanels.forEach(bindPanelSound);
}

/* ============================================================
   VERTICAL WORKS REVEAL — mobile fallback
============================================================ */
function initVerticalWorksReveal() {
  const panels = document.querySelectorAll('[data-work], [data-work-chapter]');
  gsap.set(panels, { opacity: 0, y: 40 });
  panels.forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  // Parallax on video panels
  document.querySelectorAll('.work-panel:not(.work-panel--yt)').forEach(panel => {
    const video = panel.querySelector('video');
    if (!video) return;
    gsap.to(video, {
      yPercent: 9,
      ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ============================================================
   STATEMENT — word-by-word reveal
============================================================ */
function splitToWords(el) {
  const html = el.innerHTML;
  // Parse children and text nodes, wrapping only text words
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach(tn => {
    const words = tn.textContent.split(/(\s+)/);
    const frag  = document.createDocumentFragment();
    words.forEach(w => {
      if (/^\s+$/.test(w)) {
        frag.appendChild(document.createTextNode(w));
      } else if (w) {
        const outer = document.createElement('span');
        outer.className = 'word';
        outer.setAttribute('aria-hidden', 'false');
        const inner = document.createElement('span');
        inner.className = 'word__inner';
        inner.textContent = w;
        outer.appendChild(inner);
        frag.appendChild(outer);
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
  const calm  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: leave everything visible, no entrance.
  if (calm) return;

  // Hide the start state ONLY now (JS confirmed running). Default CSS is visible,
  // so a misfiring trigger can never leave the About copy blank.
  gsap.set(words, { yPercent: 110 });
  if (ctaEl) gsap.set(ctaEl, { opacity: 0, y: 16 });

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    gsap.to(words, {
      yPercent: 0,
      duration: 0.85,
      ease: 'expo.out',
      stagger: { amount: 0.6, from: 'start' },
    });
    if (ctaEl) gsap.to(ctaEl, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.25 });
  }

  // IntersectionObserver fires reliably regardless of Lenis / ScrollTrigger state.
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { reveal(); io.disconnect(); }
    }, { threshold: 0.18 });
    io.observe(stEl);
    // hard safety net: if it's already on screen at load, reveal on next frame
    requestAnimationFrame(() => {
      const r = stEl.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) reveal();
    });
  } else {
    reveal();
  }
}

/* ============================================================
   SCROLL-DRIVEN VIDEO AUTOPLAY (vertical / mobile)
============================================================ */
function initScrollVideos() {
  const panels = document.querySelectorAll('.work-panel:not(.work-panel--yt)');
  if (!panels.length) return;

  panels.forEach(bindPanelSound);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video   = entry.target.querySelector('video');
      const muteBtn = entry.target.querySelector('.work-panel__mute');
      if (!video) return;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
        if (muteBtn) muteBtn.hidden = false;
      } else {
        video.pause();
        if (muteBtn) muteBtn.hidden = true;
      }
    });
  }, { threshold: 0.45 });

  panels.forEach(panel => observer.observe(panel));
}

/* ============================================================
   MENU OVERLAY
============================================================ */
function initMenu() {
  const toggle  = document.getElementById('menuToggle');
  const overlay = document.getElementById('menuOverlay');
  const header  = document.getElementById('header');
  if (!toggle || !overlay) return;

  const menuLinks = overlay.querySelectorAll('.menu-nav__link');
  let isOpen = false;

  function openMenu() {
    isOpen = true;
    overlay.classList.add('is-open');
    overlay.removeAttribute('aria-hidden');
    header.classList.add('header--open');
    toggle.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    isOpen = false;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    header.classList.remove('header--open');
    toggle.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          setTimeout(() => {
            if (lenis) lenis.scrollTo(target, { offset: -80 });
            else target.scrollIntoView({ behavior: 'smooth' });
          }, 420);
        }
      }
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
}

/* ============================================================
   CUSTOM CURSOR
============================================================ */
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  const dot   = cursor.querySelector('.cursor__dot');
  const ring  = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my, px = mx, py = my;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function animateCursor() {
    // dot snaps to the pointer, ring + label trail with inertia
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;

    // velocity → stretch the ring like a comet in its direction of travel
    const vx = rx - px, vy = ry - py;
    px = rx; py = ry;
    const sp  = Math.min(Math.hypot(vx, vy) / 24, 0.55);
    const ang = Math.atan2(vy, vx) * 180 / Math.PI;
    ring.style.transform =
      `translate(${rx}px, ${ry}px) translate(-50%, -50%) rotate(${ang}deg) scale(${1 + sp}, ${1 - sp * 0.5})`;
    if (label) label.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });

  document.querySelectorAll('.work-panel__play-btn[data-video-id]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.remove('cursor--hover');
      cursor.classList.add('cursor--play');
      if (label) label.textContent = 'WATCH';
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor--play');
      if (label) label.textContent = '';
    });
  });
}

/* ============================================================
   VIDEO MODAL (YouTube)
============================================================ */
function initVideoModal() {
  const modal    = document.getElementById('vModal');
  const iframe   = document.getElementById('vModalIframe');
  const localVid = document.getElementById('vModalVideo');
  const closeBtn = document.getElementById('vModalClose');
  const backdrop = document.getElementById('vModalBackdrop');
  if (!modal) return;

  // pause whatever is playing behind the modal; resume the same set on close
  let pausedByModal = [];
  function pauseBackground() {
    pausedByModal = [];
    document.querySelectorAll('.work-panel video').forEach(v => {
      if (!v.paused) { v.pause(); pausedByModal.push(v); }
    });
    document.dispatchEvent(new CustomEvent('focenoff:modal-open'));
  }
  function resumeBackground() {
    pausedByModal.forEach(v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); });
    pausedByModal = [];
    document.dispatchEvent(new CustomEvent('focenoff:modal-close'));
  }

  function showModal() {
    pauseBackground();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    closeBtn.focus();
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(modal.querySelector('.v-modal__box'),
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' }
      );
    }
  }

  function openModal(videoId) {
    if (localVid) { localVid.pause(); localVid.removeAttribute('src'); localVid.hidden = true; }
    iframe.hidden = false;
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&controls=1&autoplay=1`;
    showModal();
  }

  // motion clips play on-site from local mp4 — same modal, native <video>
  function openLocalModal(src) {
    if (!localVid || !src) return;
    iframe.src = '';
    iframe.hidden = true;
    localVid.hidden = false;
    localVid.src = src;
    localVid.muted = false;
    localVid.currentTime = 0;
    showModal();
    const pr = localVid.play();
    if (pr && pr.catch) pr.catch(() => {}); // user can press play if autoplay is blocked
  }

  function closeModal() {
    const box = modal.querySelector('.v-modal__box');
    const teardown = () => {
      iframe.src = '';
      if (localVid) { localVid.pause(); localVid.removeAttribute('src'); localVid.load(); }
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      resumeBackground();
    };
    if (typeof gsap !== 'undefined') {
      gsap.to(box, { scale: 0.93, opacity: 0, duration: 0.28, ease: 'expo.in', onComplete: teardown });
    } else {
      teardown();
    }
  }

  // expose for the WebGL gallery (click a plane → open modal)
  window.openVideoModal = openModal;
  window.openLocalVideoModal = openLocalModal;

  document.addEventListener('click', e => {
    const btn = e.target.closest('.work-panel__play-btn[data-video-id]');
    if (btn) {
      e.preventDefault();
      openModal(btn.dataset.videoId);
      return;
    }
    // DOM gallery: clicking a motion panel (not its buttons/links) opens the clip on-site
    const panel = e.target.closest('.work-panel:not(.work-panel--yt)');
    if (panel && !e.target.closest('a, button')) {
      const v = panel.querySelector('.work-panel__video');
      const src = v && (v.currentSrc || v.src);
      if (src) openLocalModal(src);
    }
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

/* ============================================================
   SMOOTH SCROLL — anchor links
============================================================ */
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

/* ============================================================
   FALLBACK (no GSAP)
============================================================ */
/* ============================================================
   MODE TOGGLE — FULL (immersive) / LITE (simple) header switch
============================================================ */
function initModeToggle() {
  const btn = document.getElementById('modeToggle');
  if (!btn) return;
  // what actually booted (webgl.js sets mode-webgl synchronously before DOMContentLoaded)
  const active = document.body.classList.contains('mode-webgl') ? 'full' : 'lite';
  btn.querySelectorAll('.header__mode-opt').forEach(el => {
    el.classList.toggle('is-active', el.dataset.mode === active);
  });
  btn.addEventListener('click', () => {
    const target = active === 'full' ? 'lite' : 'full';
    try { localStorage.setItem('focenoff_mode', target); } catch (e) { /* ignore */ }
    // full reload = clean teardown of the WebGL scene / GSAP triggers
    window.location.reload();
  });
}

function initFallbackReveal() {
  document.querySelectorAll('[data-work], [data-work-chapter]').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  document.querySelectorAll('.word__inner').forEach(el => {
    el.style.transform = 'none';
  });
  document.querySelectorAll('.char').forEach(el => {
    el.style.transform = 'none';
  });
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initLenis();

  const preloaderTl = initPreloader();

  // Load content FIRST — applyTexts() sets final text on hero lines
  await loadContent();

  // Split hero chars AFTER text is finalized
  initHeroChars();

  initMenu();
  initCursor();
  initVideoModal();
  initAnchorScroll();
  initModeToggle();

  // Fit hero title after fonts load (ensures chars measured with correct font metrics).
  // font-display:swap means fonts.ready can resolve while AKONY is still
  // loading (text measured with fallback font) — explicitly load AKONY too,
  // and re-check after window 'load' as a final safety net.
  window.addEventListener('resize', fitHeroTitle, { passive: true });
  const heroLine = document.querySelector('.hero__line');
  const heroFs = heroLine ? getComputedStyle(heroLine).fontSize : '100px';
  Promise.all([
    document.fonts.ready,
    document.fonts.load(`400 ${heroFs} AKONY`).catch(() => {}),
  ]).then(() => fitHeroTitle());
  window.addEventListener('load', () => setTimeout(fitHeroTitle, 300));

  if (typeof gsap !== 'undefined') {
    const initDelay = preloaderDone ? 0 : 50;
    setTimeout(() => {
      initGSAP();
      window.addEventListener('load', () => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      }, { once: true });
    }, initDelay);
  } else {
    initFallbackReveal();
    initScrollVideos();
  }
});
