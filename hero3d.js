/* ============================================================
   FOCENOFF — Hero 3D layer (Three.js)
   • custom .glb/.gltf model uploaded via the admin panel
   • same behaviour as the original immersive hero:
     cursor-chase + slow spin, parked right of the headline,
     fades out and stops rendering once you scroll to works
   • progressive enhancement: if WebGL / ES modules are missing
     or reduced motion is preferred, the hero simply has no model
   NOTE: Three is imported by a DIRECT RELATIVE PATH (no importmap) so the
   scene also boots in older Safari / in-app webviews that support ES modules
   but not import maps (Safari < 16.4, many Telegram/IG in-app browsers).
============================================================ */
import * as THREE from './vendor/three.module.js';

(() => {
  'use strict';

  /* ---------- capability gate ---------------------------------- */
  const finePointer  = matchMedia('(pointer: fine)').matches;
  const isMobile     = !finePointer || window.innerWidth < 768;
  const veryLowEnd   = (navigator.deviceMemory != null && navigator.deviceMemory < 0.5);

  if (veryLowEnd) {
    console.log('[hero3d] scene skipped: deviceMemory=' + navigator.deviceMemory);
    return;
  }

  const canvas = document.getElementById('heroCanvas');
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
  if (!renderer) { console.log('[hero3d] no WebGL context available'); return; }

  console.log('[hero3d] scene initializing…');

  /* ---------- small utils -------------------------------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const toSrc = (f) => f.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

  try {
    init();
  } catch (e) {
    console.warn('[hero3d] disabled →', e);
    canvas.style.display = 'none';
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
       (cursor-chase + scroll fade, exactly like before)
    ============================================================ */
    const heroGroup = new THREE.Group();
    heroGroup.visible = false;
    scene.add(heroGroup);
    let heroModel = null;
    const heroMats = [];

    function loadHeroModel(content) {
      const file = content && content.hero && content.hero.modelFile;
      if (!file) { console.log('[hero3d] no modelFile configured in content.json'); return; }
      console.log('[hero3d] loading model:', file);
      // loader is only fetched when a model is actually configured
      import('./vendor/GLTFLoader.js')
        .then(({ GLTFLoader }) => new GLTFLoader().load(
          toSrc(file),
          (gltf) => {
            const obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            if (!obj) return;
            // normalize size + center so any upload sits the same way
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
            // the scene is otherwise unlit → light the model
            const amb = new THREE.AmbientLight(0xffffff, 1.15);
            const key = new THREE.DirectionalLight(0xffffff, 1.6);
            key.position.set(2.5, 3, 4);
            heroGroup.add(amb, key, obj);
            heroModel = obj;
            heroGroup.visible = true;
            canvas.classList.add('is-live');
            console.log('[hero3d] model loaded successfully');
          },
          undefined,
          (err) => console.warn('[hero3d] hero model failed to load →', err)
        ))
        .catch((err) => console.warn('[hero3d] GLTFLoader unavailable →', err));
    }

    if (window.FOCENOFF_CONTENT) loadHeroModel(window.FOCENOFF_CONTENT);
    else window.addEventListener('focenoff:content', (e) => loadHeroModel(e.detail), { once: true });

    /* ============================================================
       POINTER
    ============================================================ */
    const pointer = { x: 0, y: 0, vx: 0, vy: 0 }; // normalized -1..1 + per-event velocity
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.vx = nx - pointer.x;
      pointer.vy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
    }, { passive: true });

    /* ============================================================
       SCROLL MAPPING + RENDER LOOP — same motion as the original
    ============================================================ */
    const worksEl = document.getElementById('works');
    let ppx = 0, ppy = 0, pvx = 0, pvy = 0;
    let hidden = true;
    const clock = new THREE.Clock();

    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;
      const vh = window.innerHeight;

      // hero progress: 0 at top → 1 when the works section arrives
      const scrollY  = window.scrollY || (document.documentElement.scrollTop || 0);
      const worksTop = worksEl ? worksEl.offsetTop : vh;
      const hp = clamp(scrollY / Math.max(1, worksTop), 0, 1);

      // smoothed pointer (a little lag = floating through space)
      ppx += (pointer.x - ppx) * 0.065;
      ppy += (pointer.y - ppy) * 0.065;
      // smoothed pointer velocity → a quick "push" when you flick the mouse
      pvx += (pointer.vx - pvx) * 0.12; pointer.vx *= 0.82;
      pvy += (pointer.vy - pvy) * 0.12; pointer.vy *= 0.82;

      // camera drifts toward the cursor (soft parallax; auto-orbit on touch)
      const par   = isMobile ? 0.5 : 1.0;
      const autoX = isMobile ? Math.sin(t * 0.22) * 0.55 : 0;
      const autoY = isMobile ? Math.cos(t * 0.18) * 0.32 : 0;
      camera.position.set(
        (ppx * 2.6 + pvx * 7.0) * par + autoX,
        (-ppy * 1.8 - pvy * 5.0) * par + autoY,
        7
      );
      camera.lookAt(-ppx * 1.7 * par + autoX * 0.5, ppy * 1.25 * par + autoY * 0.5, -5);
      camera.rotation.z = -ppx * 0.05;

      // hero model chases the cursor, fades out on scroll
      const heroOp = clamp(1 - hp * 1.15, 0, 1);
      if (heroModel) {
        heroGroup.visible = heroOp > 0.01;
        if (heroGroup.visible) {
          heroModel.rotation.y += dt * 0.25 + pvx * 0.4;
          heroGroup.rotation.x = lerp(heroGroup.rotation.x, -ppy * 0.35, 0.06);
          heroGroup.rotation.z = lerp(heroGroup.rotation.z, ppx * 0.12, 0.06);
          // park on the right so the left-aligned hero type stays clear
          const parkX = isMobile ? 0.55 : 1.7;
          heroGroup.position.x = lerp(heroGroup.position.x, parkX + ppx * 1.0 + pvx * 2.0, 0.06);
          heroGroup.position.y = lerp(heroGroup.position.y, (isMobile ? 0.6 : 0.15) - ppy * 0.65 - pvy * 1.4, 0.06);
          // scale up + push back as you scroll down — model grows larger
          const s  = lerp(isMobile ? 0.8 : 0.95, isMobile ? 1.25 : 1.55, hp);
          const zOff = hp * 2.4;
          heroGroup.position.z = zOff;
          heroGroup.scale.setScalar(s);
          for (let i = 0; i < heroMats.length; i++) {
            heroMats[i].opacity = heroMats[i].userData.baseOpacity * heroOp;
          }
        }
      }

      // hide the canvas (and save GPU) once the hero is gone
      const wantHidden = heroOp <= 0.01 || !heroModel;
      if (wantHidden !== hidden) {
        hidden = wantHidden;
        canvas.classList.toggle('is-live', !hidden);
      }

      if (!hidden && !document.hidden) renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    /* ---------- resize ------------------------------------------ */
    let resizeTmr;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTmr);
      resizeTmr = setTimeout(() => {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }, 160);
    });

    requestAnimationFrame(frame);
  }
})();
