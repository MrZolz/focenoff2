/* ============================================================
   FOCENOFF — All 3D layers (Three.js)
   • hero model: cursor-chase + scroll fade
   • about model: centred, Y-spin, always visible
   • contact model: centred, Y-spin, always visible
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

  try { init(); }
  catch (e) { console.warn('[hero3d] disabled →', e); canvas.style.display = 'none'; }

  function loadOneModel(file, group, matsArr, label, onDone) {
    if (!file) { console.log('[hero3d] no modelFile for', label); return; }
    console.log('[hero3d] loading', label, ':', file);
    import('./vendor/GLTFLoader.js')
      .then(({ GLTFLoader }) => new GLTFLoader().load(
        toSrc(file),
        (gltf) => {
          const obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
          if (!obj) return;
          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetScale = label === 'hero' ? 3.2 : 2.8;
          obj.scale.setScalar(targetScale / maxDim);
          box.setFromObject(obj);
          obj.position.sub(box.getCenter(new THREE.Vector3()));
          obj.traverse((n) => {
            if (!n.isMesh || !n.material) return;
            (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => {
              m.transparent = true;
              m.userData.baseOpacity = (m.opacity != null ? m.opacity : 1);
              matsArr.push(m);
            });
          });
          const amb = new THREE.AmbientLight(0xffffff, 1.15);
          const key = new THREE.DirectionalLight(0xffffff, 1.6);
          key.position.set(2.5, 3, 4);
          group.add(amb, key, obj);
          group.visible = true;
          canvas.classList.add('is-live');
          console.log('[hero3d]', label, 'loaded');
          if (onDone) onDone(obj);
        },
        undefined,
        (err) => console.warn('[hero3d]', label, 'load error →', err)
      ))
      .catch((err) => console.warn('[hero3d] GLTFLoader unavailable →', err));
  }

  function init() {
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 7);

    /* ---- HERO ---- */
    const heroGroup = new THREE.Group();
    heroGroup.visible = false;
    scene.add(heroGroup);
    let heroModel = null;
    const heroMats = [];

    /* ---- ABOUT ---- */
    const aboutGroup = new THREE.Group();
    aboutGroup.visible = false;
    aboutGroup.position.set(0, 0, -10);
    scene.add(aboutGroup);
    let aboutModel = null;
    const aboutMats = [];

    /* ---- CONTACT ---- */
    const contactGroup = new THREE.Group();
    contactGroup.visible = false;
    contactGroup.position.set(0, 0, -20);
    scene.add(contactGroup);
    let contactModel = null;
    const contactMats = [];

    function loadAll(content) {
      loadOneModel(content && content.hero && content.hero.modelFile, heroGroup, heroMats, 'hero', (obj) => { heroModel = obj; });
      loadOneModel(content && content.about && content.about.modelFile, aboutGroup, aboutMats, 'about', (obj) => { aboutModel = obj; });
      loadOneModel(content && content.contact && content.contact.modelFile, contactGroup, contactMats, 'contact', (obj) => { contactModel = obj; });
    }

    if (window.FOCENOFF_CONTENT) loadAll(window.FOCENOFF_CONTENT);
    else window.addEventListener('focenoff:content', (e) => loadAll(e.detail), { once: true });

    /* ---- POINTER ---- */
    const pointer = { x: 0, y: 0, vx: 0, vy: 0 };
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.vx = nx - pointer.x;
      pointer.vy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
    }, { passive: true });

    /* ---- RENDER LOOP ---- */
    const worksEl = document.getElementById('works');
    let ppx = 0, ppy = 0, pvx = 0, pvy = 0;
    let hidden = true;
    const clock = new THREE.Clock();

    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;
      const vh = window.innerHeight;

      const scrollY  = window.scrollY || (document.documentElement.scrollTop || 0);
      const worksTop = worksEl ? worksEl.offsetTop : vh;
      const hp = clamp(scrollY / Math.max(1, worksTop), 0, 1);

      // smoothed pointer
      ppx += (pointer.x - ppx) * 0.065;
      ppy += (pointer.y - ppy) * 0.065;
      pvx += (pointer.vx - pvx) * 0.12; pointer.vx *= 0.82;
      pvy += (pointer.vy - pvy) * 0.12; pointer.vy *= 0.82;

      // camera
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

      /* ---- hero model ---- */
      const heroOp = clamp(1 - hp * 1.15, 0, 1);
      if (heroModel) {
        heroGroup.visible = heroOp > 0.01;
        if (heroGroup.visible) {
          heroModel.rotation.y += dt * 0.25 + pvx * 0.4;
          heroGroup.rotation.x = lerp(heroGroup.rotation.x, -ppy * 0.35, 0.06);
          heroGroup.rotation.z = lerp(heroGroup.rotation.z, ppx * 0.12, 0.06);
          const parkX = isMobile ? 0.65 : 2.2;
          heroGroup.position.x = lerp(heroGroup.position.x, parkX + ppx * 0.7 + pvx * 1.4 + hp * 0.9, 0.06);
          heroGroup.position.y = lerp(heroGroup.position.y, (isMobile ? 0.6 : 0.15) - ppy * 0.65 - pvy * 1.4, 0.06);
          const s  = lerp(isMobile ? 0.8 : 0.95, isMobile ? 1.25 : 1.55, hp);
          heroGroup.position.z = hp * 3.2;
          heroGroup.scale.setScalar(s);
          for (let i = 0; i < heroMats.length; i++) {
            heroMats[i].opacity = heroMats[i].userData.baseOpacity * heroOp;
          }
        }
      }

      /* ---- about model — always visible, Y-spin ---- */
      if (aboutModel) {
        aboutGroup.visible = true;
        aboutModel.rotation.y += dt * 0.25;
        aboutModel.rotation.x += dt * 0.04;
        aboutModel.rotation.z += dt * 0.02;
      }

      /* ---- contact model — always visible, Y-spin ---- */
      if (contactModel) {
        contactGroup.visible = true;
        contactModel.rotation.y += dt * 0.25;
        contactModel.rotation.x += dt * 0.04;
        contactModel.rotation.z += dt * 0.02;
      }

      const anyLive = heroOp > 0.01 || aboutModel || contactModel;
      if (anyLive !== !hidden) {
        hidden = !anyLive;
        canvas.classList.toggle('is-live', anyLive);
      }

      if (anyLive && !document.hidden) renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    /* ---- resize ---- */
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
