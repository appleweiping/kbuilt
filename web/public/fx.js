/* kbuilt fx — ambient Three.js scene behind the terminal.
   "Media flows in, files come out": glowing media glyphs (play / note / photo)
   ride bezier curves from the viewport edges into a wireframe funnel that
   pulses on download success (window.kbuiltFX.pulse()).

   Constraints honoured:
   - three.js pinned via importmap (three@0.182.0, cdn.jsdelivr.net)
   - no WebGL or prefers-reduced-motion  -> silently skipped, page fully usable
   - lazy init (DOM ready + requestIdleCallback), pixel ratio capped at 2,
     rendering paused when the tab is hidden. */

// Safe no-op facade so app.js can always call pulse().
window.kbuiltFX = window.kbuiltFX || { pulse() {} };

const REDUCED = window.matchMedia
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext
      && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

function scheduleInit() {
  const kick = () => { init().catch(() => { /* page stays usable without fx */ }); };
  if ("requestIdleCallback" in window) requestIdleCallback(kick, { timeout: 2500 });
  else setTimeout(kick, 250);
}

if (!REDUCED && webglAvailable() && document.getElementById("fx")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInit, { once: true });
  } else {
    scheduleInit();
  }
}

async function init() {
  const THREE = await import("three");
  const canvas = document.getElementById("fx");
  if (!canvas) return;

  // ---- renderer / scene / camera ----------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 12);

  // ---- theme palettes -----------------------------------------------------
  const PALETTES = {
    dark: {
      accent: new THREE.Color(0xd97757),
      tints: [new THREE.Color(0xd97757), new THREE.Color(0x8fb8d8), new THREE.Color(0xe8e3da)],
      blending: THREE.AdditiveBlending,
      funnelOpacity: 0.55,
      particleOpacity: 0.95,
    },
    light: {
      accent: new THREE.Color(0xc75f3e),
      tints: [new THREE.Color(0xc75f3e), new THREE.Color(0x3f6f99), new THREE.Color(0x6b6257)],
      blending: THREE.NormalBlending,
      funnelOpacity: 0.5,
      particleOpacity: 0.8,
    },
  };
  const themeName = () =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  let palette = PALETTES[themeName()];

  // ---- glyph sprite textures (play / note / photo) ------------------------
  function glyphTexture(draw) {
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d");
    g.clearRect(0, 0, s, s);
    g.fillStyle = "#fff";
    g.strokeStyle = "#fff";
    g.lineWidth = 5;
    g.lineJoin = "round";
    draw(g, s);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 1;
    return tex;
  }

  const TEX = {
    play: glyphTexture((g, s) => {            // ▶ play triangle
      g.beginPath();
      g.moveTo(s * 0.30, s * 0.20);
      g.lineTo(s * 0.80, s * 0.50);
      g.lineTo(s * 0.30, s * 0.80);
      g.closePath();
      g.fill();
    }),
    note: glyphTexture((g, s) => {            // ♪ eighth note
      g.beginPath();
      g.ellipse(s * 0.38, s * 0.72, s * 0.13, s * 0.10, -0.3, 0, Math.PI * 2);
      g.fill();
      g.fillRect(s * 0.48, s * 0.18, s * 0.06, s * 0.54);
      g.beginPath();
      g.moveTo(s * 0.48, s * 0.18);
      g.quadraticCurveTo(s * 0.74, s * 0.26, s * 0.70, s * 0.46);
      g.quadraticCurveTo(s * 0.66, s * 0.32, s * 0.48, s * 0.30);
      g.closePath();
      g.fill();
    }),
    photo: glyphTexture((g, s) => {           // ▣ photo frame + mountain
      g.strokeRect(s * 0.18, s * 0.24, s * 0.64, s * 0.52);
      g.beginPath();
      g.moveTo(s * 0.24, s * 0.68);
      g.lineTo(s * 0.42, s * 0.46);
      g.lineTo(s * 0.56, 0.60 * s);
      g.lineTo(s * 0.66, s * 0.50);
      g.lineTo(s * 0.76, s * 0.68);
      g.stroke();
      g.beginPath();
      g.arc(s * 0.64, s * 0.36, s * 0.05, 0, Math.PI * 2);
      g.fill();
    }),
  };

  // ---- flow curves: viewport edges -> funnel mouth -------------------------
  const FUNNEL_MOUTH = new THREE.Vector3(0, 1.7, 0);
  const CURVES = [];
  const CURVE_COUNT = 26;
  for (let i = 0; i < CURVE_COUNT; i++) {
    const a = (i / CURVE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const r = 11 + Math.random() * 5;
    const start = new THREE.Vector3(
      Math.cos(a) * r,
      Math.sin(a) * r * 0.55 + 1.5,
      -2 - Math.random() * 4);
    const mid1 = start.clone().lerp(FUNNEL_MOUTH, 0.35)
      .add(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, Math.random() * 2));
    const mid2 = start.clone().lerp(FUNNEL_MOUTH, 0.72)
      .add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.3) * 2, Math.random()));
    CURVES.push(new THREE.CubicBezierCurve3(start, mid1, mid2, FUNNEL_MOUTH.clone()));
  }

  // ---- particle systems (one THREE.Points per glyph) ------------------------
  const SYSTEMS = [];
  const PER_SYSTEM = 60;

  Object.values(TEX).forEach((tex, sysIdx) => {
    const positions = new Float32Array(PER_SYSTEM * 3);
    const colors = new Float32Array(PER_SYSTEM * 3);
    const meta = [];
    for (let i = 0; i < PER_SYSTEM; i++) {
      meta.push({
        curve: (Math.random() * CURVES.length) | 0,
        t: Math.random(),
        speed: 0.0012 + Math.random() * 0.0022,
        tint: (Math.random() * 3) | 0,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.34 + sysIdx * 0.04,
      map: tex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      blending: palette.blending,
      opacity: palette.particleOpacity,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    SYSTEMS.push({ geo, mat, meta });
  });

  const _pos = new THREE.Vector3();
  const _col = new THREE.Color();
  function updateParticles(speedScale) {
    for (const sys of SYSTEMS) {
      const pos = sys.geo.attributes.position.array;
      const col = sys.geo.attributes.color.array;
      for (let i = 0; i < sys.meta.length; i++) {
        const p = sys.meta[i];
        p.t += p.speed * speedScale;
        if (p.t >= 1) {
          p.t = 0;
          p.curve = (Math.random() * CURVES.length) | 0;
        }
        CURVES[p.curve].getPoint(p.t, _pos);
        pos[i * 3] = _pos.x;
        pos[i * 3 + 1] = _pos.y;
        pos[i * 3 + 2] = _pos.z;
        // fade in at spawn, fade out as it dives into the funnel
        const fade = Math.min(p.t / 0.12, 1) * Math.min((1 - p.t) / 0.10, 1);
        _col.copy(palette.tints[p.tint]).multiplyScalar(Math.max(fade, 0));
        col[i * 3] = _col.r;
        col[i * 3 + 1] = _col.g;
        col[i * 3 + 2] = _col.b;
      }
      sys.geo.attributes.position.needsUpdate = true;
      sys.geo.attributes.color.needsUpdate = true;
    }
  }

  // ---- wireframe funnel + downward arrow ------------------------------------
  const funnel = new THREE.Group();

  const funnelMat = new THREE.LineBasicMaterial({
    color: palette.accent, transparent: true, opacity: palette.funnelOpacity,
  });
  const coneGeo = new THREE.ConeGeometry(2.0, 2.6, 20, 5, true);
  const cone = new THREE.LineSegments(new THREE.WireframeGeometry(coneGeo), funnelMat);
  cone.rotation.x = Math.PI;            // apex points down
  cone.position.y = 0.4;
  funnel.add(cone);

  const ringMat = new THREE.LineBasicMaterial({
    color: palette.accent, transparent: true, opacity: palette.funnelOpacity * 0.7,
  });
  const ring = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.TorusGeometry(2.15, 0.012, 6, 48)), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.7;
  funnel.add(ring);

  // arrow shaft + head below the cone apex
  const arrowPts = [
    new THREE.Vector3(0, -1.1, 0), new THREE.Vector3(0, -2.5, 0),
    new THREE.Vector3(-0.45, -1.95, 0), new THREE.Vector3(0, -2.5, 0),
    new THREE.Vector3(0.45, -1.95, 0), new THREE.Vector3(0, -2.5, 0),
  ];
  const arrow = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(arrowPts), funnelMat);
  funnel.add(arrow);

  // expanding pulse ring (revealed on download success)
  const pulseRingMat = new THREE.LineBasicMaterial({
    color: palette.accent, transparent: true, opacity: 0,
  });
  const pulseRing = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.TorusGeometry(1.2, 0.02, 4, 40)), pulseRingMat);
  pulseRing.rotation.x = Math.PI / 2;
  pulseRing.position.y = 0.4;
  funnel.add(pulseRing);

  const FUNNEL_SCALE = 1.55;   // big enough to peek around the glass terminal
  funnel.position.y = 0.4;
  funnel.scale.setScalar(FUNNEL_SCALE);
  scene.add(funnel);

  // ---- pulse hook (fired by app.js on download success) -----------------------
  let pulseT = 0;          // 1 -> 0 envelope
  window.kbuiltFX.pulse = () => { pulseT = 1; };

  // ---- theme adaptation ----------------------------------------------------------
  function applyPalette() {
    palette = PALETTES[themeName()];
    funnelMat.color.copy(palette.accent);
    funnelMat.opacity = palette.funnelOpacity;
    ringMat.color.copy(palette.accent);
    ringMat.opacity = palette.funnelOpacity * 0.7;
    pulseRingMat.color.copy(palette.accent);
    for (const sys of SYSTEMS) {
      sys.mat.blending = palette.blending;
      sys.mat.opacity = palette.particleOpacity;
      sys.mat.needsUpdate = true;
    }
  }
  new MutationObserver(applyPalette).observe(document.documentElement, {
    attributes: true, attributeFilter: ["data-theme"],
  });

  // ---- camera parallax -------------------------------------------------------------
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // ---- resize ------------------------------------------------------------------------
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  // ---- render loop (paused while tab hidden) --------------------------------------------
  let rafId = 0;
  let running = false;
  const clock = new THREE.Clock();

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // pulse envelope: quick attack handled by setter, smooth decay here
    if (pulseT > 0) pulseT = Math.max(0, pulseT - dt * 1.6);
    const pulse = pulseT * pulseT;

    funnel.rotation.y += dt * (0.25 + pulse * 2.2);
    const breathe = 1 + Math.sin(t * 1.4) * 0.02 + pulse * 0.22;
    funnel.scale.setScalar(breathe * FUNNEL_SCALE);
    funnelMat.opacity = palette.funnelOpacity * (1 + pulse * 0.8);

    pulseRingMat.opacity = pulse * 0.9;
    const ringScale = 1 + (1 - pulseT) * 4.5;
    pulseRing.scale.setScalar(pulseT > 0 ? ringScale : 1);

    updateParticles(1 + pulse * 3);

    camera.position.x += (mouse.x * 0.9 - camera.position.x) * 0.045;
    camera.position.y += (-mouse.y * 0.55 + 0.4 - camera.position.y) * 0.045;
    camera.lookAt(0, 0.3, 0);

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    clock.start();
    frame();
  }
  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  updateParticles(0); // seed initial positions before first paint
  start();
}
