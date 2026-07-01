/* ========================================================
   FOCENOFF — All 3D layers (Three.js)
   → hero: enlarges and fades out as user scrolls through hero section
   → about: anchored to #modelAboutSpot viewport position, no fade, Y-spin + gentle X/Z rock
   → contact: fixed position, Y-spin only
   Camera is fixed at (0,0,7) — all pointer motion is on group transforms
======================================================== */
import * as THREE from './vendor/three.module.js';

(() => {
  'use strict';

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
  if (!renderer) { console.log('[hero3d] no WebGL context'); return; }

  console.log('[hero3d] init...');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const toSrc = (f) => f.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

  try { init(); }
  catch (e) { console.warn('[hero3d] disabled ->', e); canvas.style.display = 'none'; }

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
        (err) => console.warn('[hero3d]', label, 'load error ->', err)
      ))
      .catch((err) => console.warn('[hero3d] GLTFLoader unavailable ->', err));
  }

  function init() {
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, -5);

    /* HERO */
    const heroGroup = new THREE.Group();
    heroGroup.visible = false;
    scene.add(heroGroup);
    let heroModel = null;
    const heroMats = [];

    /* ABOUT */
    const aboutGroup = new THREE.Group();
    aboutGroup.visible = false;
    aboutGroup.position.set(0, 0, -4);
    scene.add(aboutGroup);
    let aboutModel = null;
    const aboutMats = [];

    /* CONTACT */
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

    /* POINTER — affects hero group only */
    const pointer = { x: 0, y: 0, vx: 0, vy: 0 };
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.vx = nx - pointer.x;
      pointer.vy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
    }, { passive: true });

    /* RENDER LOOP */
    /* heroEl = hero section (#top, height 100dvh).
       Scroll progress hp goes 0→1 over exactly the hero section height,
       so the model is completely gone before the next section appears. */
    const heroEl      = document.getElementById('top');
    const aboutSpotEl = document.getElementById('modelAboutSpot');
    let ppx = 0, ppy = 0;
    let hidden = true;
    const clock = new THREE.Clock();

    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;
      const vh = window.innerHeight;

      const scrollY    = window.scrollY || (document.documentElement.scrollTop || 0);
      /* hp = 0 at top, hp = 1 when hero section fully scrolled past. */
      const heroHeight = heroEl ? heroEl.offsetHeight : vh;
      const hp = clamp(scrollY / Math.max(1, heroHeight), 0, 1);

      // smooth pointer
      ppx += (pointer.x - ppx) * 0.065;
      ppy += (pointer.y - ppy) * 0.065;

      /* HERO — enlarges (scale grows, Z moves toward camera) and fades as user
         scrolls through the hero section. Multiplier 1.5 means opacity = 0 at
         hp = 0.67, well before the works section starts. */
      const heroOp = clamp(1 - hp * 1.5, 0, 1);
      if (heroModel) {
        heroGroup.visible = heroOp > 0.01;
        if (heroGroup.visible) {
          heroModel.rotation.y += dt * 0.22 + pointer.vx * 0.3;
          heroModel.rotation.x = Math.sin(t * 0.5) * 0.10;
          heroModel.rotation.z = Math.cos(t * 0.4) * 0.07;
          heroGroup.rotation.x = lerp(heroGroup.rotation.x, -ppy * 0.25, 0.05);
          heroGroup.rotation.z = lerp(heroGroup.rotation.z, ppx * 0.08, 0.05);
          const parkX = isMobile ? 1.0 : 3.0;
          heroGroup.position.x = lerp(heroGroup.position.x, parkX + ppx * 0.5, 0.07);
          heroGroup.position.y = lerp(heroGroup.position.y, (isMobile ? 0.3 : 0) - ppy * 0.3, 0.07);
          /* Zoom toward camera (positive z) + scale grows: gives the impression
             of the model enlarging as it fades out into the background. */
          heroGroup.position.z = lerp(heroGroup.position.z, hp * 2.5, 0.10);
          heroGroup.scale.setScalar(lerp(isMobile ? 0.9 : 1.0, isMobile ? 2.0 : 2.2, hp));
          for (let i = 0; i < heroMats.length; i++) {
            heroMats[i].opacity = heroMats[i].userData.baseOpacity * heroOp;
          }
        } else {
          /* Snap back to rest state while invisible so reappearance on
             scroll-back is clean and doesn't jump from an enlarged position. */
          heroGroup.position.z = lerp(heroGroup.position.z, 0, 0.18);
          heroGroup.scale.setScalar(lerp(heroGroup.scale.x, isMobile ? 0.9 : 1.0, 0.18));
        }
      }

      /* ABOUT — strictly locked to #modelAboutSpot centre; no fade in/out; Y-spin + X/Z rock.
         position.y is set directly every frame — no lerp lag, no scroll drift. */
      let aboutInView = false;
      if (aboutSpotEl && aboutModel) {
        const r = aboutSpotEl.getBoundingClientRect();
        aboutInView = r.top < vh && r.bottom > 0;

        const modelZ     = aboutGroup.position.z;
        const camDist    = camera.position.z - modelZ;
        const tanHalfFov = Math.tan(camera.fov * 0.5 * Math.PI / 180);
        const worldHalfH = camDist * tanHalfFov;
        const sectionCY  = (r.top + r.height * 0.5) / vh;
        const ndcY       = -(sectionCY * 2 - 1);
        const targetY    = ndcY * worldHalfH;

        /* Strict snap — no lerp, model stays exactly at section centre. */
        aboutGroup.position.x = 0;
        aboutGroup.position.y = targetY;

        aboutGroup.visible = aboutInView;
        if (aboutInView) {
          aboutModel.rotation.y += dt * 0.25;
          aboutModel.rotation.x = Math.sin(t * 0.5) * 0.12;
          aboutModel.rotation.z = Math.cos(t * 0.4) * 0.08;
        }
      }

      /* CONTACT — fixed position, Y-spin only */
      const contactSpot = document.getElementById('modelContactSpot');
      let contactInView = false;
      if (contactSpot && contactModel) {
        const r = contactSpot.getBoundingClientRect();
        contactInView = r.top < vh && r.bottom > 0;
        contactGroup.visible = contactInView;
        if (contactInView) {
          contactModel.rotation.y += dt * 0.25;
        }
      }

      const anyLive = (heroOp > 0.01 && heroModel) || aboutInView || contactInView;
      if (anyLive) {
        if (hidden) { hidden = false; canvas.classList.add('is-live'); }
        if (!document.hidden) renderer.render(scene, camera);
      } else if (!hidden) {
        /* Nothing is on screen (e.g. hero fully scrolled past): wipe the
           framebuffer and hide the canvas so the last faint frame of the hero
           model can't linger as a ghost. Without this the render loop simply
           stops and the previously drawn frame stays visible on the fixed,
           full-screen canvas. */
        hidden = true;
        canvas.classList.remove('is-live');
        renderer.clear();
      }
      requestAnimationFrame(frame);
    }

    /* RESIZE */
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
