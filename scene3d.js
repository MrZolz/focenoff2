/* ============================================================
   FOCENOFF — About & Contact 3D layers (Three.js)
   • about model: visible around the Statement section
   • contact model: visible around the Contact section
   • simple float + slow spin animation, similar to hero but
     lighter — no cursor chase, no scroll-driven camera
============================================================ */
import * as THREE from './vendor/three.module.js';

(() => {
  'use strict';

  /* ---------- capability gate ---------------------------------- */
  const veryLowEnd = (navigator.deviceMemory != null && navigator.deviceMemory < 0.5);
  if (veryLowEnd) { console.log('[scene3d] skipped: low device memory'); return; }

  const isMobile = !matchMedia('(pointer: fine)').matches || window.innerWidth < 768;

  function makeRenderer(canvas) {
    if (!canvas) return null;
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

  /* ---------- small utils -------------------------------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const toSrc = (f) => f.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

  function loadModel(file, group, mats, canvas, onDone) {
    if (!file) { console.log('[scene3d] no modelFile for', canvas.id); return; }
    console.log('[scene3d] loading model:', file);
    import('./vendor/GLTFLoader.js')
      .then(({ GLTFLoader }) => new GLTFLoader().load(
        toSrc(file),
        (gltf) => {
          const obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
          if (!obj) return;
          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          obj.scale.setScalar(2.8 / maxDim);
          box.setFromObject(obj);
          obj.position.sub(box.getCenter(new THREE.Vector3()));
          obj.traverse((n) => {
            if (!n.isMesh || !n.material) return;
            (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => {
              m.transparent = true;
              m.userData.baseOpacity = (m.opacity != null ? m.opacity : 1);
              mats.push(m);
            });
          });
          const amb = new THREE.AmbientLight(0xffffff, 1.15);
          const key = new THREE.DirectionalLight(0xffffff, 1.4);
          key.position.set(2, 3, 4);
          group.add(amb, key, obj);
          group.visible = true;
          canvas.classList.add('is-live');
          console.log('[scene3d] model loaded:', canvas.id);
          if (onDone) onDone(obj);
        },
        undefined,
        (err) => console.warn('[scene3d] model load error:', canvas.id, err)
      ))
      .catch((err) => console.warn('[scene3d] GLTFLoader unavailable:', err));
  }

  /* ============================================================
     Create a 3D slot bound to one canvas + one section range
  ============================================================ */
  function createSlot(canvasId, sectionId, modelPathFn, posX, posY) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const renderer = makeRenderer(canvas);
    if (!renderer) { console.log('[scene3d] no WebGL for', canvasId); return null; }

    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 7);

    const group = new THREE.Group();
    group.visible = false;
    group.position.set(posX, posY, 0);
    scene.add(group);

    let model = null;
    const mats = [];

    function init(content) {
      const file = modelPathFn(content);
      loadModel(file, group, mats, canvas, (obj) => { model = obj; });
    }

    if (window.FOCENOFF_CONTENT) init(window.FOCENOFF_CONTENT);
    else window.addEventListener('focenoff:content', (e) => init(e.detail), { once: true });

    const section = document.getElementById(sectionId);
    const clock = new THREE.Clock();
    let hidden = true;

    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.elapsedTime;

      // visibility: model appears when its section is visible
      const vh = window.innerHeight;
      let op = 0;
      if (section) {
        const r = section.getBoundingClientRect();
        // fade in as section enters viewport, out as it leaves
        const inTop  = clamp((vh - r.top) / vh, 0, 1);
        const inBot  = clamp((r.bottom) / vh, 0, 1);
        op = inTop * inBot;
      }

      if (model) {
        group.visible = op > 0.02;
        if (group.visible) {
          model.rotation.y += dt * 0.18;
          model.rotation.x += dt * 0.06;
          const s = lerp(0.85, 1, op);
          group.scale.setScalar(s);
          for (let i = 0; i < mats.length; i++) {
            mats[i].opacity = mats[i].userData.baseOpacity * op;
          }
        }
      }

      const wantHidden = op <= 0.02 || !model;
      if (wantHidden !== hidden) {
        hidden = wantHidden;
        canvas.classList.toggle('is-live', !hidden);
      }

      if (!hidden && !document.hidden) renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    /* resize */
    window.addEventListener('resize', () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }, { passive: true });

    requestAnimationFrame(frame);
    return { canvas, renderer };
  }

  /* ============================================================
     SLOTS — both centred, floating behind their sections
  ============================================================ */
  createSlot('aboutCanvas', 'statement',
    (c) => c && c.about && c.about.modelFile,
    0, 0);

  createSlot('contactCanvas', 'contact',
    (c) => c && c.contact && c.contact.modelFile,
    0, 0);

})();
