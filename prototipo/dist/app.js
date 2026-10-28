import * as THREE from './vendor/three.module.js';
import { buildRealisticShirt } from './realistic-shirt.js';

const stage = document.querySelector('.sticky-stage');
const viewport = document.getElementById('scene');
const track = document.getElementById('experience');
const angleLabel = document.getElementById('angle');
const viewLabel = document.getElementById('view-label');
const range = document.getElementById('rotation-range');
const steps = [...document.querySelectorAll('.step')];
const loader = document.getElementById('load-state');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
camera.position.set(0, .06, 6.8);
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.34;
  viewport.append(renderer.domElement);
} catch (error) {
  // Some browsers and embedded previews disable WebGL entirely. A CSS 3D
  // version still gives the visitor a working scroll-controlled 360° view.
  console.info('WebGL indisponível; usando visualização 360° alternativa.');
}

scene.add(new THREE.AmbientLight(0xf1ece6, 1.05));
const frontalLight = new THREE.DirectionalLight(0xfff4df, 2.5);
frontalLight.position.set(-3, 4, 5);
scene.add(frontalLight);
const goldenRim = new THREE.DirectionalLight(0xe3c6a0, 3.7);
goldenRim.position.set(4, 2, -3);
scene.add(goldenRim);
const silverRim = new THREE.DirectionalLight(0xbac4cd, 3.0);
silverRim.position.set(-4, -1, -4);
scene.add(silverRim);

const shirt = new THREE.Group();
scene.add(shirt);

// A stylized 3D prototype garment, with the actual supplied Senna artwork
// and flaming Brazil flag mapped onto the respective print regions.
const outline = new THREE.Shape();
outline.moveTo(-.295, 1.18);
outline.lineTo(-.60, 1.21);
outline.quadraticCurveTo(-.72, 1.17, -.80, 1.10);
outline.lineTo(-1.38, .83);
outline.lineTo(-1.16, .36);
outline.lineTo(-.79, .52);
outline.lineTo(-.70, -1.33);
outline.quadraticCurveTo(0, -1.39, .70, -1.33);
outline.lineTo(.79, .52);
outline.lineTo(1.16, .36);
outline.lineTo(1.38, .83);
outline.lineTo(.80, 1.10);
outline.quadraticCurveTo(.72, 1.17, .60, 1.21);
outline.lineTo(.295, 1.18);
outline.quadraticCurveTo(.25, .92, 0, .91);
outline.quadraticCurveTo(-.25, .92, -.295, 1.18);
outline.closePath();

const depth = .52;
const extruded = new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelThickness: .035, bevelSize: .03, bevelSegments: 3, curveSegments: 14, steps: 1 });
extruded.translate(0, 0, -depth / 2);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x17181a, metalness: .02, roughness: .96 });
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, metalness: .0, roughness: .94 });
const foundation = new THREE.Mesh(extruded, [bodyMaterial, edgeMaterial]);
shirt.add(foundation);

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
const [flagArtwork, backArtwork] = await Promise.all([
  loadImage('./brazil-fire.png'),
  loadImage('./senna-back.png')
]);

function fabricTexture(back = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d');
  const base = c.createLinearGradient(100, 0, 950, 900);
  base.addColorStop(0, '#222326');
  base.addColorStop(.38, '#141416');
  base.addColorStop(.7, '#1e1e20');
  base.addColorStop(1, '#101113');
  c.fillStyle = base;
  c.fillRect(0, 0, 1024, 1024);

  // Textile grain, drawn deterministically so front/back remain consistent.
  for (let i = 0; i < 9000; i++) {
    const x = (i * 167.31) % 1024;
    const y = (i * 241.67) % 1024;
    c.fillStyle = i % 3 ? 'rgba(255,255,255,.012)' : 'rgba(0,0,0,.035)';
    c.fillRect(x, y, 1, 2);
  }

  const wrinkle = c.createLinearGradient(180, 400, 880, 700);
  wrinkle.addColorStop(0, 'rgba(255,255,255,.035)');
  wrinkle.addColorStop(.30, 'rgba(0,0,0,.065)');
  wrinkle.addColorStop(.48, 'rgba(255,255,255,.02)');
  wrinkle.addColorStop(.75, 'rgba(0,0,0,.07)');
  wrinkle.addColorStop(1, 'rgba(255,255,255,.012)');
  c.fillStyle = wrinkle;
  c.fillRect(0, 0, 1024, 1024);

  c.textAlign = 'center';
  if (!back) {
    // Ghosted Interlagos circuit: derived from the public-domain track outline
    // Circuit_Interlagos.svg, Wikimedia Commons / Ch1902.
    c.save();
    c.translate(512, 419);
    c.scale(.69, .69);
    c.translate(-356, -453);
    const circuit = new Path2D('M191.75 559.612 C212.75 558.112 211 565.112 211 565.112 C214 585.112 229.269 624.265 271.75 627.362 C287.894 628.746 304.236 617.355 318.315 610.33 C332.094 603.454 442.258 548.616 464.217 537.204 C483.145 527.367 507.501 515.628 510.707 508.716 C518.985 489.222 490.686 448.805 480.311 443.185 C462.17 429.145 430.405 438.564 400.081 442.118 C382.757 444.173 331.023 445.687 319 444.362 C296.75 436.862 296.5 405.868 296.5 400.612 C296.5 395.362 336.745 350.81 342.25 350.862 C354.381 350.862 346.31 378.368 357.279 389.46 C367.083 399.66 380.25 386.112 380.25 386.112 C391.5 375.112 389.25 375.362 388.5 340.112 C389.5 334.237 403.5 314.987 407.187 309.612 C414.625 298.987 419.785 295.647 425.5 301.362 C428.75 306.737 424.305 352.435 425.25 358.643 C426.375 378.55 447.449 388.852 456.25 390.612 C470 391.862 522.313 382.05 522.313 382.05 C538.563 379.237 540.625 371.987 542 368.612 C544.508 360.139 528 326.362 528 326.362 C511 307.862 480.563 291.737 462.094 282.893 C452.375 277.8 428.807 278.023 423 279.112 C418.758 279.908 319.5 332.112 304.75 343.362 L191.625 505.862 C181.75 518.362 170.594 542.487 175.406 553.487 C181.219 561.487 191.75 559.612 191.75 559.612 Z');
    c.strokeStyle = 'rgba(185,181,168,.24)';
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke(circuit);
    c.strokeStyle = 'rgba(116,45,41,.36)';
    c.lineWidth = 2;
    c.stroke(circuit);
    c.restore();

    c.fillStyle = '#ede9df';
    c.font = '900 84px Impact, Arial Black, Arial, sans-serif';
    c.letterSpacing = '5px';
    c.fillText('SENNA', 512, 449, 274); // ~25 cm on a typical adult shirt.
    c.fillStyle = '#ac3430';
    c.fillRect(394, 470, 236, 5);
    c.fillStyle = '#817e76';
    c.font = '600 13px Arial';
    c.letterSpacing = '3px';
    c.fillText('INTERLAGOS', 512, 505);
  } else {
    if (backArtwork) {
      // Keep the complete vertical artwork, from AYRTON/SENNA to the racing car.
      c.save();
      c.globalCompositeOperation = 'screen';
      c.drawImage(backArtwork, 316, 272, 392, 523);
      c.restore();
    }
  }
  if (flagArtwork) {
    c.save();
    c.globalCompositeOperation = 'screen'; // Blends away the supplied black background.
    c.drawImage(flagArtwork, 819, 214, 160, 96);
    c.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer ? Math.min(renderer.capabilities.getMaxAnisotropy(), 8) : 1;
  return texture;
}

const frontFabric = fabricTexture(false);
const backFabric = fabricTexture(true);
function printedSurface(back = false) {
  const geometry = new THREE.ShapeGeometry(outline, 16);
  const pos = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    uv.setXY(i, back ? 1 - (x + 1.47) / 2.94 : (x + 1.47) / 2.94, (y + 1.43) / 2.78);
  }
  uv.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({ map: back ? backFabric : frontFabric, color: 0xffffff, metalness: 0, roughness: .95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = (back ? -1 : 1) * (depth / 2 + .041);
  shirt.add(mesh);
}
printedSurface(false);
printedSurface(true);

let fallbackShirt = null;
if (!renderer) {
  viewport.innerHTML = `
    <div class="fallback-perspective">
      <div class="fallback-shirt" id="fallback-shirt">
        <div class="fallback-side fallback-side-left"></div>
        <div class="fallback-side fallback-side-right"></div>
        <div class="fallback-face fallback-front"></div>
        <div class="fallback-face fallback-back"></div>
      </div>
    </div>`;
  const front = viewport.querySelector('.fallback-front');
  const back = viewport.querySelector('.fallback-back');
  front.style.backgroundImage = `url(${frontFabric.image.toDataURL('image/png')})`;
  back.style.backgroundImage = `url(${backFabric.image.toDataURL('image/png')})`;
  fallbackShirt = document.getElementById('fallback-shirt');
}

function seam(points, color = 0x37363a, radius = .009) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  shirt.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 5, false), new THREE.MeshStandardMaterial({ color, roughness: 1 })));
}
// Neck ribbing and the small seams make the silhouette readable in near-black.
for (const direction of [-1, 1]) {
  const z = direction * (depth / 2 + .052);
  seam([[-.30, 1.18, z],[-.23, .98, z], [0, .92, z], [.23, .98, z], [.30, 1.18, z]], 0x444348, .019);
  seam([[-.8, 1.10, z],[-1.02, .985, z],[-1.365, .825, z]], 0x353536, .007);
  seam([[.8, 1.10, z],[1.02, .985, z],[1.365, .825, z]], 0x353536, .007);
  seam([[-1.16, .38, z],[-1.27, .60, z],[-1.36, .81, z]], 0x424146, .012);
  seam([[1.16, .38, z],[1.27, .60, z],[1.36, .81, z]], 0x424146, .012);
  seam([[-.68,-1.30,z],[0,-1.35,z],[.68,-1.30,z]], 0x38383a, .012);
}

// Very subtle depth accents near each sleeve edge.
const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x25262a, roughness: 1, metalness: 0 });
for (const sign of [-1, 1]) {
  const trim = new THREE.Mesh(new THREE.BoxGeometry(.025, .48, depth + .035), trimMaterial);
  trim.position.set(sign * 1.255, .60, 0);
  trim.rotation.z = sign * -.43;
  shirt.add(trim);
}

// Keep the exact existing print canvases but replace the rigid silhouette
// with a full garment mesh: curved torso, round collar and tubular sleeves.
// The legacy shape above remains useful solely for the software-rendered
// fallback when the visitor's browser has WebGL disabled.
shirt.clear();
shirt.add(buildRealisticShirt(THREE, frontFabric, backFabric, flagArtwork));

let scrollProgress = 0;
let visualProgress = 0;
let dragging = false;
let dragX = 0;
let dragStartProgress = 0;

function totalScroll() { return Math.max(1, track.offsetHeight - window.innerHeight); }
function clamp(value) { return Math.max(0, Math.min(1, value)); }
function goToProgress(progress) { window.scrollTo({ top: track.offsetTop + clamp(progress) * totalScroll(), behavior: 'instant' }); }

function readScroll() {
  scrollProgress = clamp((window.scrollY - track.offsetTop) / totalScroll());
  const value = Math.round(scrollProgress * 1000);
  range.value = value;
  range.style.setProperty('--progress', (value / 10) + '%');
  const degrees = Math.round(scrollProgress * 360);
  angleLabel.textContent = String(degrees).padStart(3, '0') + '°';
  let current = 0;
  if (scrollProgress >= .125 && scrollProgress < .375) current = 1;
  else if (scrollProgress >= .375 && scrollProgress < .625) current = 2;
  else if (scrollProgress >= .625 && scrollProgress < .875) current = 3;
  const captions = ['VISTA FRONTAL','MANGA DIREITA','VISTA TRASEIRA','MANGA ESQUERDA'];
  viewLabel.textContent = captions[current];
  steps.forEach((step, index) => { step.classList.toggle('active', current === index); step.setAttribute('aria-current', current === index ? 'step' : 'false'); });
}

window.addEventListener('scroll', readScroll, { passive: true });
range.addEventListener('input', e => goToProgress(Number(e.target.value) / 1000));
steps.forEach(step => step.addEventListener('click', () => goToProgress(Number(step.dataset.target))));
document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); goToProgress(0); });

viewport.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') return; // Keep natural swipe-scrolling on mobile.
  dragging = true;
  dragX = e.clientX;
  dragStartProgress = scrollProgress;
  viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener('pointermove', e => {
  if (!dragging) return;
  const difference = (e.clientX - dragX) / Math.max(320, viewport.clientWidth);
  goToProgress(dragStartProgress + difference * 1.2);
});
viewport.addEventListener('pointerup', () => { dragging = false; });
viewport.addEventListener('pointercancel', () => { dragging = false; });

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  camera.aspect = w / h;
  const mobile = w < 741;
  camera.position.z = mobile ? 8.4 : 6.8;
  camera.position.y = mobile ? -.05 : .06;
  camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(w, h, false);
}
window.addEventListener('resize', () => { resize(); readScroll(); }, { passive: true });
resize();
readScroll();

function frame() {
  visualProgress += (scrollProgress - visualProgress) * .115;
  if (Math.abs(scrollProgress - visualProgress) < .00001) visualProgress = scrollProgress;
  shirt.rotation.y = visualProgress * Math.PI * 2;
  shirt.rotation.x = .012 + .018 * Math.sin(visualProgress * Math.PI * 2);
  shirt.rotation.z = .014 * Math.sin(visualProgress * Math.PI * 4);
  const isMobile = viewport.clientWidth < 741;
  shirt.position.set(isMobile ? 0 : .28, isMobile ? -.04 : -.02, 0);
  shirt.scale.setScalar(isMobile ? 1.02 : 1.1);
  if (renderer) {
    renderer.render(scene, camera);
  } else if (fallbackShirt) {
    fallbackShirt.style.transform = `translate(-50%, -50%) rotateY(${visualProgress * 360}deg) rotateX(${1.2 + 1.7 * Math.sin(visualProgress * Math.PI * 2)}deg)`;
  }
  requestAnimationFrame(frame);
}
frame();
requestAnimationFrame(() => loader.classList.add('hide'));
setTimeout(() => loader.remove(), 1200);
