/* ============================================================
   FOCENOFF — WebGL layer (Three.js)
   • dark sculptural FOCENOFF comet floating on light paper
   • cursor-driven camera movement through 3D space
   • scroll-driven flying gallery of work planes
   • progressive enhancement: runs wherever WebGL + ES modules exist,
     falls back to the DOM works gallery otherwise
   NOTE: Three is imported by a DIRECT RELATIVE PATH (no importmap) so the
   scene also boots in older Safari / in-app webviews that support ES modules
   but not import maps (Safari < 16.4, many Telegram/IG in-app browsers).
============================================================ */
import * as THREE from './vendor/three.module.js';

(() => {
  'use strict';

  /* ---------- capability gate ---------------------------------- */
  // The immersive scene is the default everywhere WebGL is available.
  // The user can override it with the header FULL/LITE toggle:
  //   'lite' → always the DOM version, 'full' → immersive even with
  //   reduced-motion, 'auto' → immersive unless reduced-motion / very
  //   low-end device.
  const manualMode   = window.FOCENOFF_MODE || 'auto';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = matchMedia('(pointer: fine)').matches;
  const isMobile     = !finePointer || window.innerWidth < 768;
  const lowEnd       = (navigator.deviceMemory && navigator.deviceMemory <= 1);

  if (manualMode === 'lite') return; // user chose the simple version
  if (manualMode !== 'full' && (reduceMotion || lowEnd)) return; // DOM fallback handles it

  const canvas = document.getElementById('glCanvas');
  if (!canvas) return;

  // Create the renderer defensively: drop antialias, then fall back further,
  // so a fussy GPU / driver / webview still yields a context instead of bailing.
  function makeRenderer() {
    const tries = [
      { canvas, antialias: true,  alpha: true },
      { canvas, antialias: false, alpha: true },
      { canvas, alpha: true, failIfMajorPerformanceCaveat: false },
    ];
    for (const opts of tries) {
      try {
        const r = new THREE.WebGLRenderer(opts);
        if (r && r.getContext && r.getContext()) return r;
      } catch (e) { /* try next */ }
    }
    return null;
  }

  const renderer = makeRenderer();
  if (!renderer) return; // no WebGL → DOM fallback

  // From here on, WebGL is the active works experience.
  document.body.classList.add('mode-webgl');

  function fallbackToDom(err) {
    if (err) console.warn('[webgl] disabled →', err);
    document.body.classList.remove('mode-webgl');
    canvas.style.display = 'none';
    try { window.initDomWorksFallback && window.initDomWorksFallback(); } catch (e) {}
  }

  /* ---------- small utils -------------------------------------- */
  const clamp  = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp   = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const pad2   = (n) => String(n).padStart(2, '0');
  const toSrc  = (f) => f.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

  try {
    init();
  } catch (e) {
    fallbackToDom(e);
  }

  function init() {
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 7);

    /* ============================================================
       HERO MODEL — custom .glb/.gltf uploaded via the admin panel
       (replaces the old comet; same cursor-chase + scroll fade)
    ============================================================ */
    const heroGroup = new THREE.Group();
    heroGroup.visible = false;
    scene.add(heroGroup);
    let heroModel = null;
    const heroMats = [];

    function loadHeroModel(content) {
      const file = content && content.hero && content.hero.modelFile;
      if (!file) return;
      // loader is only fetched when a model is actually configured
      import('./vendor/GLTFLoader.js')
        .then(({ GLTFLoader }) => new GLTFLoader().load(
          toSrc(file),
          (gltf) => {
            const obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            if (!obj) return;
            // normalize size + center so any upload sits like the old comet
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            obj.scale.setScalar(3.2 / maxDim);
            box.setFromObject(obj);
            obj.position.sub(box.getCenter(new THREE.Vector3()));
            // collect materials for the scroll fade; keep their base opacity
            obj.traverse((n) => {
              if (!n.isMesh || !n.material) return;
              (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => {
                m.transparent = true;
                m.userData.baseOpacity = (m.opacity != null ? m.opacity : 1);
                heroMats.push(m);
              });
            });
            // the scene is otherwise unlit (matcap/shader) → light the model
            const amb = new THREE.AmbientLight(0xffffff, 1.15);
            const key = new THREE.DirectionalLight(0xffffff, 1.6);
            key.position.set(2.5, 3, 4);
            heroGroup.add(amb, key, obj);
            heroModel = obj;
            heroGroup.visible = true;
          },
          undefined,
          (err) => console.warn('[webgl] hero model failed to load →', err)
        ))
        .catch((err) => console.warn('[webgl] GLTFLoader unavailable →', err));
    }

    if (window.FOCENOFF_CONTENT) loadHeroModel(window.FOCENOFF_CONTENT);
    else window.addEventListener('focenoff:content', (e) => loadHeroModel(e.detail), { once: true });

    /* ============================================================
       GALLERY — work planes flying in depth
    ============================================================ */
    const galleryGroup = new THREE.Group();
    scene.add(galleryGroup);

    const SPACING = 5.2;
    const PW = 4.3, PH = PW * 9 / 16;
    const loader = new THREE.TextureLoader();

    let items = [];           // flattened work list
    let planes = [];          // plane meshes (1:1 with items)
    let N = 0;
    let activeIdx = -1;
    let activeVideoPlane = null;

    function makeCardTexture(num, title, sub) {
      const w = 1024, h = 576;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#1a1813'); grd.addColorStop(1, '#0a0a08');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      // soft centre glow so the card has depth even when zoomed
      const rg = g.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.46, w * 0.55);
      rg.addColorStop(0, 'rgba(120,120,130,0.18)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; g.strokeRect(20, 20, w - 40, h - 40);
      // corner index
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.font = '600 24px Inter, Arial, sans-serif';
      g.fillText(num, 48, 74);
      g.textAlign = 'right';
      g.fillText('FOCENOFF', w - 48, 74);
      // centred title
      g.textAlign = 'center';
      g.fillStyle = 'rgba(245,245,245,0.97)';
      g.font = '700 96px Arial, sans-serif';
      g.fillText((title || '').toUpperCase(), w / 2, h / 2 + 14);
      // label under title
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.font = '500 24px Inter, Arial, sans-serif';
      g.fillText((sub || '').toUpperCase(), w / 2, h / 2 + 70);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.LinearSRGBColorSpace; t.needsUpdate = true;
      return t;
    }

    function planeMaterial(tex) {
      return new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uMap:        { value: tex },
          uTime:       { value: 0 },
          uHover:      { value: 0 },
          uActive:     { value: 0 },
          uOpacity:    { value: 0 },
          uImgAspect:  { value: 16 / 9 },
          uPlaneAspect:{ value: PW / PH },
        },
        vertexShader: `
          uniform float uTime; uniform float uHover;
          varying vec2 vUv;
          void main(){
            vUv = uv;
            vec3 p = position;
            float w = sin(p.x * 2.2 + uTime * 2.0) * cos(p.y * 2.0 - uTime * 1.5);
            p.z += w * 0.12 * uHover;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform sampler2D uMap; uniform float uTime; uniform float uHover;
          uniform float uActive; uniform float uOpacity;
          uniform float uImgAspect; uniform float uPlaneAspect;
          varying vec2 vUv;
          void main(){
            // cover fit
            vec2 uv = vUv;
            float pa = uPlaneAspect, ia = uImgAspect;
            if (ia > pa) { float s = pa / ia; uv.x = (uv.x - 0.5) * s + 0.5; }
            else         { float s = ia / pa; uv.y = (uv.y - 0.5) * s + 0.5; }
            // hover ripple + chromatic aberration
            vec2 c = uv - 0.5; float d = length(c);
            float ripple = sin(d * 16.0 - uTime * 3.0) * 0.007 * uHover;
            vec2 ruv = uv + (c / (d + 0.0001)) * ripple;
            float ca = 0.0075 * uHover;
            float r = texture2D(uMap, ruv + vec2(ca, 0.0)).r;
            float g = texture2D(uMap, ruv).g;
            float b = texture2D(uMap, ruv - vec2(ca, 0.0)).b;
            vec3 col = vec3(r, g, b);
            // dim inactive planes slightly, lift active
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            col = mix(vec3(lum), col, 0.55 + 0.45 * uActive);
            col *= 0.72 + 0.28 * uActive + 0.12 * uHover;
            // thin inner frame
            vec2 b2 = step(vec2(0.012), uv) * step(uv, vec2(0.988));
            float frame = b2.x * b2.y;
            col = mix(col * 0.0 + 0.04, col, frame);
            gl_FragColor = vec4(col, uOpacity);
          }`,
      });
    }

    function buildGallery(content) {
      // flatten sections into a single ordered work list
      const out = [];
      const sections = (content && content.sections) || [];
      sections.forEach((sec) => {
        if (sec.type === 'motion') {
          (sec.clips || []).forEach((c) => out.push({
            kind: 'motion', title: c.title || sec.title || 'MOTION',
            label: c.label || 'MOTION', file: c.file, ytUrl: c.ytUrl,
          }));
        } else {
          (sec.items || []).forEach((it) => out.push({
            kind: 'yt', title: it.name || sec.title || 'VIDEO',
            label: it.type || 'YOUTUBE', videoId: it.videoId, thumbnail: it.thumbnail,
            stat: it.stat,
          }));
        }
      });
      items = out; N = items.length;
      if (!N) return;

      items.forEach((it, i) => {
        const card = makeCardTexture(pad2(i + 1), it.title, it.label);
        const mat  = planeMaterial(card);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, 24, 18), mat);

        const sign = i % 2 === 0 ? -1 : 1;
        const jx = ((i * 37) % 10) / 10;
        const jy = ((i * 53) % 10) / 10 - 0.5;
        // wider lateral spread → planes fly PAST you on both sides (corridor depth)
        mesh.userData.baseX = sign * (1.15 + jx * 1.0);
        mesh.userData.baseY = jy * 1.7;
        mesh.position.set(mesh.userData.baseX, mesh.userData.baseY, -(i + 1) * SPACING);
        mesh.rotation.y = sign * 0.06;
        mesh.rotation.z = (jx - 0.5) * 0.05;
        mesh.userData.item = it;
        mesh.userData.card = card;
        mesh.userData.still = null;
        mesh.userData.video = null;
        mesh.userData.videoTex = null;
        mesh.userData.hoverT = 0;

        // eager-load YouTube thumbnails (small images)
        if (it.kind === 'yt' && it.thumbnail) {
          loader.load(it.thumbnail, (tex) => {
            tex.colorSpace = THREE.LinearSRGBColorSpace;
            mat.uniforms.uMap.value = tex;
            if (tex.image && tex.image.width) {
              mat.uniforms.uImgAspect.value = tex.image.width / tex.image.height;
            }
            mesh.userData.still = tex;
          }, undefined, () => {});
        }

        galleryGroup.add(mesh);
        planes.push(mesh);
      });

      // scroll length: ~0.9 viewport per plane + headroom
      sizeWorksScroll();
    }

    function sizeWorksScroll() {
      const el = document.getElementById('worksScroll');
      if (el && N) el.style.height = Math.round(N * window.innerHeight * 0.92 + window.innerHeight * 0.55) + 'px';
      // the giant spacer shifts every section below works — recompute ScrollTrigger
      // positions so downstream reveals (statement, contact) fire at the right place
      if (window.ScrollTrigger) { try { window.ScrollTrigger.refresh(); } catch (e) {} }
    }

    /* ---------- video focus (only the active motion plane plays) -- */
    function startVideo(mesh) {
      const it = mesh.userData.item;
      if (it.kind !== 'motion' || !it.file) return;
      let v = mesh.userData.video;
      if (!v) {
        v = document.createElement('video');
        v.muted = !soundOn; v.loop = true; v.playsInline = true;
        v.preload = 'auto'; v.crossOrigin = 'anonymous';
        v.src = toSrc(it.file);
        mesh.userData.video = v;
        const vt = new THREE.VideoTexture(v);
        vt.colorSpace = THREE.LinearSRGBColorSpace;
        mesh.userData.videoTex = vt;
        v.addEventListener('loadedmetadata', () => {
          if (v.videoWidth) mesh.material.uniforms.uImgAspect.value = v.videoWidth / v.videoHeight;
        });
        // swap to live video only once a real frame exists (no black flash)
        const reveal = () => {
          if (mesh.userData.video === v && activeVideoPlane === mesh) {
            if (v.videoWidth) mesh.material.uniforms.uImgAspect.value = v.videoWidth / v.videoHeight;
            mesh.material.uniforms.uMap.value = vt;
          }
        };
        v.addEventListener('loadeddata', reveal);
        v.addEventListener('playing', reveal);
      } else if (v.readyState >= 2) {
        if (v.videoWidth) mesh.material.uniforms.uImgAspect.value = v.videoWidth / v.videoHeight;
        mesh.material.uniforms.uMap.value = mesh.userData.videoTex;
      }
      const pr = v.play();
      if (pr && pr.catch) pr.catch(() => {});
    }

    function captureStill(mesh) {
      const v = mesh.userData.video;
      if (!v || v.readyState < 2) return;
      const w = 1024, h = 576;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      const ia = v.videoWidth / v.videoHeight, pa = w / h;
      let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
      if (ia > pa) { sw = v.videoHeight * pa; sx = (v.videoWidth - sw) / 2; }
      else         { sh = v.videoWidth / pa; sy = (v.videoHeight - sh) / 2; }
      try { g.drawImage(v, sx, sy, sw, sh, 0, 0, w, h); } catch (e) { return; }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.LinearSRGBColorSpace; t.needsUpdate = true;
      if (mesh.userData.still && mesh.userData.still.dispose) mesh.userData.still.dispose();
      mesh.userData.still = t;
    }

    function stopVideo(mesh) {
      const v = mesh.userData.video;
      if (v) { try { v.pause(); } catch (e) {} }
      captureStill(mesh);
      mesh.material.uniforms.uImgAspect.value = mesh.userData.still
        ? 16 / 9 : mesh.material.uniforms.uImgAspect.value;
      mesh.material.uniforms.uMap.value = mesh.userData.still || mesh.userData.card;
    }

    function setActive(idx) {
      if (idx === activeIdx) return;
      if (activeVideoPlane) { stopVideo(activeVideoPlane); activeVideoPlane = null; }
      activeIdx = idx;
      const p = planes[idx];
      if (p && p.userData.item.kind === 'motion') {
        startVideo(p);
        activeVideoPlane = p;
      }
    }

    /* ============================================================
       WORK ACTIONS (click / HUD open)
    ============================================================ */
    function openWork(it) {
      if (!it) return;
      if (it.kind === 'yt' && it.videoId && window.openVideoModal) {
        window.openVideoModal(it.videoId);
      } else if (it.ytUrl) {
        window.open(it.ytUrl, '_blank', 'noopener');
      } else if (it.kind === 'yt' && it.videoId) {
        window.open('https://www.youtube.com/watch?v=' + it.videoId, '_blank', 'noopener');
      }
    }

    /* ============================================================
       POINTER + RAYCAST
    ============================================================ */
    const pointer = { x: 0, y: 0, vx: 0, vy: 0 }; // normalized -1..1 + per-event velocity
    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let hovered = null;
    let downX = 0, downY = 0, dragging = false;

    const cursorEl = document.getElementById('cursor');
    const cursorLabelEl = document.getElementById('cursorLabel');
    function setCursor(name, on) {
      if (!cursorEl) return;
      cursorEl.classList.toggle(name, on);
      if (name === 'cursor--play' && cursorLabelEl) cursorLabelEl.textContent = on ? 'VIEW' : '';
    }

    function uiBlocked(t) {
      return !!(t && t.closest && t.closest('.header, .menu-overlay, .v-modal, .works__hud a, .works__hud button'));
    }
    function overlaysOpen() {
      return document.body.classList.contains('is-loading') ||
        document.querySelector('.menu-overlay.is-open') ||
        !document.getElementById('vModal').hidden;
    }

    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.vx = nx - pointer.x;
      pointer.vy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      ndc.x = pointer.x; ndc.y = -pointer.y;
      if (dragging && (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6)) dragging = false;
    }, { passive: true });

    window.addEventListener('pointerdown', (e) => {
      downX = e.clientX; downY = e.clientY; dragging = true;
      if (galleryVisible && !uiBlocked(e.target)) setCursor('cursor--drag', true);
    });
    window.addEventListener('pointerup', (e) => {
      setCursor('cursor--drag', false);
      const click = Math.abs(e.clientX - downX) < 6 && Math.abs(e.clientY - downY) < 6;
      if (click && hovered && galleryVisible && !uiBlocked(e.target) && !overlaysOpen()) {
        openWork(hovered.userData.item);
      }
      dragging = false;
    });

    const worksOpenBtn = document.getElementById('worksOpen');
    if (worksOpenBtn) worksOpenBtn.addEventListener('click', () => {
      if (items[activeIdx]) openWork(items[activeIdx]);
    });

    /* ---------- sound toggle for the active motion clip ---------- */
    let soundOn = false;
    const worksSoundBtn = document.getElementById('worksSound');
    function applySound() {
      const v = activeVideoPlane && activeVideoPlane.userData.video;
      if (v) {
        v.muted = !soundOn;
        if (soundOn) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      }
    }
    function syncSoundBtn() {
      if (!worksSoundBtn) return;
      worksSoundBtn.classList.toggle('is-on', soundOn);
      worksSoundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      worksSoundBtn.setAttribute('aria-label', soundOn ? 'Выключить звук' : 'Включить звук');
      const off = worksSoundBtn.querySelector('.works__sound-ic--off');
      const on  = worksSoundBtn.querySelector('.works__sound-ic--on');
      if (off) off.hidden = soundOn;
      if (on)  on.hidden  = !soundOn;
    }
    if (worksSoundBtn) worksSoundBtn.addEventListener('click', () => {
      soundOn = !soundOn;     // this click is the user gesture that unlocks audio
      applySound();
      syncSoundBtn();
    });

    /* ============================================================
       HUD
    ============================================================ */
    const hud      = document.getElementById('worksHud');
    const elTitle  = document.getElementById('worksTitle');
    const elType   = document.getElementById('worksType');
    const elCount  = document.getElementById('worksCount');
    const elBar    = document.getElementById('worksBar');
    const elOpenLb = document.getElementById('worksOpenLabel');
    let lastHudIdx = -1;

    function updateHud(activeI, progress, visible) {
      if (hud) hud.classList.toggle('is-active', visible);
      if (!visible || !items[activeI]) return;
      if (activeI !== lastHudIdx) {
        const it = items[activeI];
        if (elTitle) elTitle.textContent = it.title || '';
        if (elType)  elType.textContent  = it.label || '';
        if (elCount) elCount.textContent = pad2(activeI + 1) + ' / ' + pad2(N);
        if (worksOpenBtn) worksOpenBtn.hidden = false;
        if (elOpenLb) elOpenLb.textContent = it.kind === 'yt' ? 'WATCH' : 'YOUTUBE';
        // sound control only makes sense over a playing motion clip
        if (worksSoundBtn) {
          worksSoundBtn.hidden = it.kind !== 'motion';
          syncSoundBtn();
        }
        lastHudIdx = activeI;
      }
      if (elBar) elBar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    }

    /* ============================================================
       SCROLL MAPPING + RENDER LOOP
    ============================================================ */
    const heroEl  = document.querySelector('.hero');
    const worksEl = document.getElementById('works');

    let galleryVisible = false;
    let camX = 0, camY = 0, ppx = 0, ppy = 0, pvx = 0, pvy = 0;
    let prevScrollY = 0, scrollVel = 0, speedEase = 0;
    let dimmed = false;
    const BASE_FOV = 42;
    const clock = new THREE.Clock();

    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;
      const vh = window.innerHeight;

      // --- scroll phases ---
      const scrollY  = window.scrollY || (document.documentElement.scrollTop || 0);
      const worksTop = worksEl ? worksEl.offsetTop : vh;
      const hp = clamp(scrollY / Math.max(1, worksTop), 0, 1);

      // scroll velocity → cinematic "speed" feel (FOV kick, roll, streaks)
      const rawVel = scrollY - prevScrollY;
      prevScrollY = scrollY;
      scrollVel += (rawVel - scrollVel) * 0.18;
      const speed = clamp(Math.abs(scrollVel) / 70, 0, 1);
      speedEase += (speed - speedEase) * 0.1;

      let wp = 0, worksInView = false;
      if (worksEl) {
        const wr = worksEl.getBoundingClientRect();
        const total = Math.max(1, worksEl.offsetHeight - vh);
        wp = clamp(-wr.top / total, 0, 1);
        worksInView = wr.top < vh * 0.9 && wr.bottom > vh * 0.1;
      }

      const sceneActive = worksEl ? scrollY < worksEl.offsetTop + worksEl.offsetHeight + vh : true;
      galleryVisible = worksInView && hp > 0.35 && N > 0;

      // --- camera path : the cursor leads you THROUGH the space ---
      let camZ;
      if (wp <= 0) camZ = lerp(7, 0, hp);
      else         camZ = -SPACING * (N > 1 ? (N - 1) : 1) * wp;

      // smoothed pointer (a little lag = floating through space)
      ppx += (pointer.x - ppx) * 0.065;
      ppy += (pointer.y - ppy) * 0.065;
      // smoothed pointer velocity → a quick "push" when you flick the mouse
      pvx += (pointer.vx - pvx) * 0.12; pointer.vx *= 0.82;
      pvy += (pointer.vy - pvy) * 0.12; pointer.vy *= 0.82;

      // camera physically drifts toward the cursor (strong, readable parallax).
      // On touch there's no resting hover, so soften the pointer pull and add a
      // slow auto-orbit so the scene still breathes.
      const par   = isMobile ? 0.5 : 1.0;
      const autoX = isMobile ? Math.sin(t * 0.22) * 0.55 : 0;
      const autoY = isMobile ? Math.cos(t * 0.18) * 0.32 : 0;
      camX = (ppx * 2.6 + pvx * 7.0) * par + autoX;
      camY = (-ppy * 1.8 - pvy * 5.0) * par + autoY;
      camera.position.set(camX, camY, camZ);
      // look slightly the OTHER way → the whole world swings around you
      camera.lookAt(-ppx * 1.7 * par + autoX * 0.5, ppy * 1.25 * par + autoY * 0.5, camZ - 12);
      // barrel-roll into the turn + a touch from scroll speed = momentum
      camera.rotation.z = -ppx * 0.05 - scrollVel * 0.0011;
      // FOV opens up while scrolling fast → sense of velocity down the corridor
      camera.fov = lerp(camera.fov, BASE_FOV + speedEase * 11, 0.1);
      camera.updateProjectionMatrix();

      // --- hero model (chases the cursor, fades out on scroll) ---
      if (heroModel) {
        const heroOp = clamp(1 - hp * 1.15, 0, 1);
        heroGroup.visible = heroOp > 0.01;
        if (heroGroup.visible) {
          heroModel.rotation.y += dt * 0.25 + pvx * 0.4;
          heroGroup.rotation.x = lerp(heroGroup.rotation.x, -ppy * 0.35, 0.06);
          heroGroup.rotation.z = lerp(heroGroup.rotation.z, ppx * 0.12, 0.06);
          // park on the right so the left-aligned hero type stays clear
          const parkX = isMobile ? 0.55 : 1.7;
          heroGroup.position.x = lerp(heroGroup.position.x, parkX + ppx * 1.0 + pvx * 2.0, 0.06);
          heroGroup.position.y = lerp(heroGroup.position.y, (isMobile ? 0.6 : 0.15) - ppy * 0.65 - pvy * 1.4, 0.06);
          const s = lerp(isMobile ? 0.72 : 1, isMobile ? 0.5 : 0.7, hp);
          heroGroup.scale.setScalar(s);
          for (let i = 0; i < heroMats.length; i++) {
            heroMats[i].opacity = heroMats[i].userData.baseOpacity * heroOp;
          }
        }
      }

      // --- gallery planes ---
      const gp = clamp((hp - 0.35) / 0.5, 0, 1); // fade in approaching works
      let nearestIdx = 0, nearestDist = Infinity;
      const cz = camera.position.z;
      for (let i = 0; i < planes.length; i++) {
        const m = planes[i];
        const u = m.material.uniforms;
        u.uTime.value = t;
        const ahead = cz - m.position.z;        // >0 when plane is in front
        let op = (wp > 0 ? 1 : gp);
        op *= smooth(-0.6, 2.2, ahead);
        op *= 1 - smooth(40, 58, ahead);         // hold the corridor open deeper
        u.uOpacity.value = op;

        // hover lerp
        m.userData.hoverT += ((hovered === m ? 1 : 0) - m.userData.hoverT) * 0.12;
        u.uHover.value = m.userData.hoverT;

        if (op > 0.05 && ahead > 0.3 && ahead < nearestDist) { nearestDist = ahead; nearestIdx = i; }
      }

      // center active plane on the rail + activate video
      if (N > 0) {
        const idx = Math.round(wp * (N - 1));
        setActive(idx);
        for (let i = 0; i < planes.length; i++) {
          planes[i].material.uniforms.uActive.value +=
            ((i === idx ? 1 : 0) - planes[i].material.uniforms.uActive.value) * 0.1;
        }
        const targetGX = -(planes[idx] ? planes[idx].userData.baseX : 0) * 0.92;
        galleryGroup.position.x += (targetGX - galleryGroup.position.x) * 0.07;
        updateHud(idx, wp, galleryVisible);
      }

      // --- raycast hover (only while gallery is the focus) ---
      if (galleryVisible && !overlaysOpen()) {
        camera.updateMatrixWorld();
        galleryGroup.updateMatrixWorld(true);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(planes, false);
        const hit = hits.find((h) => h.object.material.uniforms.uOpacity.value > 0.25);
        hovered = hit ? hit.object : null;
      } else {
        hovered = null;
      }
      setCursor('cursor--play', !!hovered);

      // --- canvas dim past the gallery (reveal solid sections, save GPU) ---
      const wantDim = !sceneActive;
      if (wantDim !== dimmed) { dimmed = wantDim; canvas.classList.toggle('is-dimmed', dimmed); }

      if (sceneActive && !document.hidden) renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }

    /* ============================================================
       RESIZE / VISIBILITY / CONTENT WIRING
    ============================================================ */
    function onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      sizeWorksScroll();
      // (mobile is supported now — no narrow/coarse fallback here. Only a real
      //  reduced-motion preference change drops the scene.)
      if (manualMode !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
        cancelAnimationFrame(rafId);
        if (activeVideoPlane) stopVideo(activeVideoPlane);
        fallbackToDom('reduced motion');
      }
    }
    let resizeTmr;
    window.addEventListener('resize', () => { clearTimeout(resizeTmr); resizeTmr = setTimeout(onResize, 160); });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && activeVideoPlane && activeVideoPlane.userData.video) {
        try { activeVideoPlane.userData.video.pause(); } catch (e) {}
      } else if (!document.hidden && activeVideoPlane && activeVideoPlane.userData.video) {
        const pr = activeVideoPlane.userData.video.play(); if (pr && pr.catch) pr.catch(() => {});
      }
    });

    // build gallery once content is available (script.js dispatches it)
    if (window.FOCENOFF_CONTENT) buildGallery(window.FOCENOFF_CONTENT);
    else window.addEventListener('focenoff:content', (e) => buildGallery(e.detail), { once: true });

    let rafId = requestAnimationFrame(frame);

    // small observability handle (used by QA; harmless in production)
    window.FOCENOFF_WEBGL = {
      isSoundOn: () => soundOn,
      activeKind: () => (activeIdx >= 0 && items[activeIdx] ? items[activeIdx].kind : null),
      activeMuted: () => {
        const v = activeVideoPlane && activeVideoPlane.userData.video;
        return v ? v.muted : null;
      },
    };

    // signal that WebGL took over (script.js skips DOM works)
    window.dispatchEvent(new CustomEvent('focenoff:webgl-ready'));
  }
})();
