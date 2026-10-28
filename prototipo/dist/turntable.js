// ADONAY — Photoreal garment showcase.
// Eight pre-rendered garment angles are scrubbed by native document scroll.
// This intentionally replaces the earlier low-fidelity procedural 3D model.

const experience = document.getElementById('experience');
const viewport = document.getElementById('scene');
const range = document.getElementById('rotation-range');
const angleLabel = document.getElementById('angle');
const viewLabel = document.getElementById('view-label');
const loader = document.getElementById('load-state');
const steps = [...document.querySelectorAll('.step')];

// The source images are transparent cutouts, all produced from the same
// realistic garment brief with the supplied SENNA and Brazil-flag references.
const sources = [
  './tee-front-real.png',     // 0°: front chest / SENNA
  './tee-front-flag.png',     // 45°: chest and flaming flag sleeve
  './tee-side-flag.png',      // 90°: flaming flag sleeve
  './tee-rear-flag.png',      // 135°: flag and Senna poster
  './tee-back-real.png',     // 180°: large Senna poster
  './tee-rear-plain.png',    // 225°: poster and plain sleeve
  './tee-side-plain.png',    // 270°: plain sleeve
  './tee-front-plain.png',   // 315°: plain sleeve and chest
];

const layers = [viewport.querySelector('.render-frame')];
layers[0].classList.add('turntable-active');
for (let i = 1; i < sources.length; i++) {
  const image = document.createElement('img');
  image.className = 'render-frame';
  image.src = sources[i];
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  image.setAttribute('aria-hidden', 'true');
  viewport.append(image);
  layers.push(image);
}
layers[0].draggable = false;

// Keep a real front image in the HTML so the hero works before JavaScript
// finishes, and hide the loader as soon as that first render is available.
function hideLoader() {
  if (!loader || loader.classList.contains('hide')) return;
  loader.classList.add('hide');
  setTimeout(() => loader.remove(), 800);
}
if (layers[0].complete) hideLoader();
else layers[0].addEventListener('load', hideLoader, { once: true });
setTimeout(hideLoader, 3500);

let scrollProgress = 0;
let visualProgress = 0;
let dragging = false;
let pointerStartX = 0;
let dragStartProgress = 0;
let activeA = -1;
let activeB = -1;

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (t) => t * t * (3 - 2 * t);
const totalScroll = () => Math.max(1, experience.offsetHeight - window.innerHeight);
const goToProgress = (progress) => window.scrollTo({
  top: experience.offsetTop + clamp(progress) * totalScroll(),
  behavior: 'instant'
});

function readScroll() {
  scrollProgress = clamp((window.scrollY - experience.offsetTop) / totalScroll());
  const sliderValue = Math.round(scrollProgress * 1000);
  range.value = sliderValue;
  range.style.setProperty('--progress', (sliderValue / 10) + '%');
  angleLabel.textContent = String(Math.round(scrollProgress * 360)).padStart(3, '0') + '°';

  let selected = 0;
  if (scrollProgress >= .125 && scrollProgress < .375) selected = 1;
  else if (scrollProgress >= .375 && scrollProgress < .625) selected = 2;
  else if (scrollProgress >= .625 && scrollProgress < .875) selected = 3;

  const captions = [
    'VISTA FRONTAL · SENNA',
    'MANGA · BRASIL EM CHAMAS',
    'VISTA TRASEIRA · AYRTON SENNA',
    'MANGA · ACABAMENTO'
  ];
  viewLabel.textContent = captions[selected];
  steps.forEach((step, index) => {
    step.classList.toggle('active', index === selected);
    step.setAttribute('aria-current', index === selected ? 'step' : 'false');
  });
}

window.addEventListener('scroll', readScroll, { passive: true });
window.addEventListener('resize', readScroll, { passive: true });
range.addEventListener('input', (event) => goToProgress(Number(event.target.value) / 1000));
steps.forEach((step) => step.addEventListener('click', () => goToProgress(Number(step.dataset.target))));
document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  goToProgress(0);
});

// Dragging keeps the old prototype's direct control, while touch users can
// scroll naturally. There is no fake flat 3D card or paper silhouette.
viewport.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') return;
  dragging = true;
  pointerStartX = event.clientX;
  dragStartProgress = scrollProgress;
  viewport.setPointerCapture(event.pointerId);
});
viewport.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  goToProgress(dragStartProgress + (event.clientX - pointerStartX) / Math.max(320, viewport.clientWidth) * 1.2);
});
viewport.addEventListener('pointerup', () => { dragging = false; });
viewport.addEventListener('pointercancel', () => { dragging = false; });

function render() {
  visualProgress += (scrollProgress - visualProgress) * .16;
  if (Math.abs(scrollProgress - visualProgress) < .00008) visualProgress = scrollProgress;

  const position = visualProgress * sources.length;
  const from = Math.floor(position) % sources.length;
  const to = (from + 1) % sources.length;
  const fraction = ease(position - Math.floor(position));

  if (activeA !== from || activeB !== to) {
    for (let i = 0; i < layers.length; i++) {
      layers[i].style.opacity = '0';
      layers[i].style.visibility = (i === from || i === to) ? 'visible' : 'hidden';
    }
    activeA = from;
    activeB = to;
  }
  layers[from].style.opacity = String(1 - fraction);
  layers[to].style.opacity = String(fraction);

  // A very subtle physical float prevents a slideshow feel without rotating
  // the actual PNG plane and exposing its flatness.
  const floatY = Math.sin(visualProgress * Math.PI * 4) * 5;
  viewport.style.setProperty('--float-y', floatY.toFixed(2) + 'px');
  requestAnimationFrame(render);
}

readScroll();
render();
