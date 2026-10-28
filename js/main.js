// ADONAY — Landing page
// Giro 360° da camiseta controlado pela rolagem (GSAP + ScrollTrigger + Lenis).

/* ================= CONFIGURAÇÃO ================= */
// Número com DDI + DDD, só dígitos. Ex.: '5531999998888'
const WHATSAPP_NUMBER = '';
const WHATSAPP_MESSAGE = 'Olá! Vim pelo site e quero um orçamento da camiseta ADONAY.';

const FRAME_COUNT = 8;              // ângulos: 0°, 45°, 90° ... 315°
const SCROLL_LENGTH = 4.5;          // quantas "telas" de rolagem dura o giro
const HOLD = 0.28;                  // fração de cada ângulo em que a peça fica parada

const CAPTIONS = [
  'VISTA FRONTAL · SENNA',
  'MANGA · BRASIL EM CHAMAS',
  'VISTA TRASEIRA · AYRTON SENNA',
  'MANGA · ACABAMENTO',
];

/* ================= WHATSAPP ================= */
const waUrl = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
  : `https://api.whatsapp.com/send?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  link.href = waUrl;
  link.target = '_blank';
  link.rel = 'noopener';
});

/* ================= ELEMENTOS ================= */
const wrap = document.getElementById('shirt-wrap');
const canvas = document.getElementById('shirt-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderPct = document.getElementById('loader-pct');
const angleLabel = document.getElementById('angle');
const viewLabel = document.getElementById('view-label');
const progressFill = document.getElementById('progress-fill');
const steps = [...document.querySelectorAll('.step')];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function hideLoader() {
  loader.classList.add('hide');
  setTimeout(() => loader.remove(), 600);
}

/* ================= CARREGAMENTO DAS IMAGENS ================= */
const size = window.matchMedia('(max-width: 740px)').matches ? 'sm' : 'lg';
const frames = new Array(FRAME_COUNT).fill(null);

function loadFrames() {
  let done = 0;
  const jobs = frames.map((_, i) => new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = `img/tee/tee-${String(i).padStart(2, '0')}-${size}.webp`;
    const finish = () => {
      done++;
      loaderPct.textContent = Math.round((done / FRAME_COUNT) * 100) + '%';
      resolve();
    };
    img.decode().then(() => { frames[i] = img; }).catch(() => {}).finally(finish);
  }));
  return Promise.all(jobs);
}

// Usa o ângulo carregado mais próximo caso algum falhe
function frameAt(index) {
  for (let step = 0; step < FRAME_COUNT; step++) {
    const img = frames[(index + step) % FRAME_COUNT];
    if (img) return img;
  }
  return null;
}

/* ================= DESENHO NO CANVAS ================= */
let dpr = 1;
let lastProgress = 0;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(wrap.clientWidth * dpr);
  canvas.height = Math.round(wrap.clientHeight * dpr);
  draw(lastProgress);
}

function drawImage(img, alpha, offsetX, scaleX) {
  if (!img || alpha <= 0) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.globalAlpha = alpha;
  ctx.setTransform(scaleX, 0, 0, 1, w / 2 + offsetX, 0);
  ctx.drawImage(img, -w / 2, 0, w, h);
}

function draw(progress) {
  lastProgress = progress;
  const position = clamp(progress) * FRAME_COUNT;
  const index = Math.floor(position) % FRAME_COUNT;
  const next = (index + 1) % FRAME_COUNT;
  // A peça "segura" em cada ângulo e só gira na parte central do trecho,
  // assim a troca é curta e não fica aparecendo duas camisetas ao mesmo tempo.
  const raw = position - Math.floor(position);
  const t = easeInOut(clamp((raw - HOLD) / (1 - HOLD * 2)));

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const shift = canvas.width * .035;
  drawImage(frameAt(index), 1 - t, -shift * t, 1 - .05 * t);
  // 'lighter' soma as duas imagens: a mistura não escurece no meio da troca
  ctx.globalCompositeOperation = 'lighter';
  drawImage(frameAt(next), t, shift * (1 - t), .95 + .05 * t);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* ================= INTERFACE ================= */
let currentStep = -1;

function updateUi(progress) {
  angleLabel.textContent = String(Math.round(progress * 360)).padStart(3, '0') + '°';
  progressFill.style.transform = `scaleX(${progress})`;

  const selected = Math.round(progress * 4) % 4;
  if (selected === currentStep) return;
  currentStep = selected;
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === selected);
    step.setAttribute('aria-current', i === selected ? 'step' : 'false');
  });
  if (window.gsap && !reducedMotion) {
    gsap.timeline()
      .to(viewLabel, { yPercent: -110, opacity: 0, duration: .2, ease: 'power2.in' })
      .add(() => { viewLabel.textContent = CAPTIONS[selected]; })
      .fromTo(viewLabel, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35, ease: 'power3.out' });
  } else {
    viewLabel.textContent = CAPTIONS[selected];
  }
}

/* ================= ANIMAÇÕES ================= */
function setupAnimations() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (window.Lenis && !reducedMotion) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const state = { p: 0 };
  const render = () => { draw(state.p); updateUi(state.p); };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero360',
      start: 'top top',
      end: () => '+=' + window.innerHeight * SCROLL_LENGTH,
      pin: true,
      scrub: .6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => document.body.classList.toggle('in-hero', self.isActive),
    },
  });
  tl.to(state, { p: 1, duration: 1, ease: 'none', onUpdate: render }, 0)
    .to('[data-hero-copy]', { autoAlpha: 0, y: -40, duration: .08, ease: 'power1.in' }, .02)
    .to('.mobile-hint', { autoAlpha: 0, duration: .05 }, .02);

  const trigger = tl.scrollTrigger;
  window.__lenis = lenis; // facilita testes pelo console
  const scrollToProgress = (p, immediate = false) => {
    const y = trigger.start + clamp(p) * (trigger.end - trigger.start);
    if (lenis) lenis.scrollTo(y, { immediate, duration: 1.4 });
    else window.scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
  };

  steps.forEach((step) => step.addEventListener('click', () => scrollToProgress(Number(step.dataset.target))));
  document.querySelector('[data-scroll-top]').addEventListener('click', (e) => {
    e.preventDefault();
    scrollToProgress(0);
  });

  // Arrastar a camiseta com o mouse também gira
  let dragging = false;
  let startX = 0;
  let startP = 0;
  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    dragging = true;
    startX = e.clientX;
    startP = trigger.progress;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    scrollToProgress(startP + (e.clientX - startX) / Math.max(320, wrap.clientWidth) * .9, true);
  });
  const stopDrag = () => { dragging = false; };
  wrap.addEventListener('pointerup', stopDrag);
  wrap.addEventListener('pointercancel', stopDrag);

  setupExploded(lenis);

  // Entrada dos textos
  if (!reducedMotion) {
    gsap.from('.hero-copy [data-reveal]', { yPercent: 110, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: .12, delay: .1 });
    gsap.from('.side-steps .step, .stage-top-label, .stage-bottom-label', { opacity: 0, x: 20, duration: .9, ease: 'power3.out', stagger: .06, delay: .35 });
    gsap.from('.bottom-bar', { yPercent: 100, duration: 1, ease: 'power3.out', delay: .2 });
    // Anima o canvas (não o wrap) para não mexer na centralização via CSS
    gsap.from(canvas, { scale: .94, duration: 1.4, ease: 'power3.out' });

    gsap.utils.toArray('[data-fade]').forEach((el, i) => {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: i * .08,
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
    });
  }

  return render;
}

/* ================= EXPLODED VIEW ================= */
// A camiseta se separa nas camadas da estampa: a pilha inclina em 3/4,
// cada camada sobe no eixo Z e as legendas desenham suas linhas.
function setupExploded(lenis) {
  const stage = document.querySelector('.ex-stage');
  const stack = document.getElementById('ex-stack');
  const layers = [...stack.querySelectorAll('.ex-layer')];
  const callouts = [...document.querySelectorAll('.ex-callout')];
  const svg = document.getElementById('ex-lines');
  const counter = document.getElementById('ex-count');
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Ponto de cada camada onde a linha encosta (acompanha a perspectiva 3D)
  const anchors = layers.map((layer) => {
    const [x, y] = layer.dataset.anchor.split(',');
    const dot = document.createElement('span');
    dot.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:1px;height:1px`;
    layer.append(dot);
    return dot;
  });

  const lines = callouts.map(() => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', '2.5');
    svg.append(path, dot);
    return { path, dot };
  });

  // calls é um objeto (não array): o GSAP trataria um array como lista de alvos
  const state = { tilt: 0, explode: 0, calls: Object.fromEntries(callouts.map((_, k) => [k, 0])) };
  let kick = 0;
  let kickVelocity = 0;
  let active = false;

  function render() {
    const gap = stack.offsetHeight * .24 * state.explode * (1 + kick);
    stack.style.transform =
      `rotateX(${state.tilt * 56}deg) rotateZ(${state.tilt * -28}deg) scale(${1 - state.tilt * .1})`;
    layers.forEach((layer, i) => {
      // 0.5px por camada evita "piscar" quando estão todas no mesmo plano
      layer.style.transform = `translateZ(${(i - 2) * gap + i * .5}px)`;
    });

    const showLines = getComputedStyle(svg).display !== 'none';
    const box = stage.getBoundingClientRect();
    let visible = 0;
    callouts.forEach((callout, k) => {
      const c = state.calls[k];
      if (c > .5) visible++;
      callout.style.opacity = c;
      callout.style.transform = `translateX(${(1 - c) * 24}px)`;
      const { path, dot } = lines[k];
      if (!showLines || c <= 0) { path.style.opacity = 0; dot.style.opacity = 0; return; }
      const a = anchors[callout.dataset.layer].getBoundingClientRect();
      const t = callout.getBoundingClientRect();
      const ax = a.left - box.left, ay = a.top - box.top;
      const ex = t.left - box.left - 14, ey = t.top - box.top + 9;
      path.setAttribute('d', `M${ax},${ay} L${ex - 40},${ey} L${ex},${ey}`);
      path.style.strokeDashoffset = 1 - c;
      path.style.opacity = 1;
      dot.setAttribute('cx', ax);
      dot.setAttribute('cy', ay);
      dot.style.opacity = c;
    });
    counter.textContent = String(visible).padStart(2, '0');
  }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: render,
    scrollTrigger: {
      trigger: '#exploded',
      start: 'top top',
      end: () => '+=' + window.innerHeight * 3.5,
      pin: true,
      scrub: .6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => { active = self.isActive; },
    },
  });
  tl.to(state, { tilt: 1, duration: .4, ease: 'power2.inOut' }, 0)
    .to(state, { explode: 1, duration: .42, ease: 'power3.inOut' }, .08);
  callouts.forEach((_, k) => {
    tl.to(state.calls, { [k]: 1, duration: .1, ease: 'power2.out' }, .4 + k * .07);
  });
  tl.to({}, { duration: .15 }); // segura a vista explodida antes de soltar

  // "Mola": rolar rápido abre um pouco mais as camadas e elas voltam balançando
  gsap.ticker.add(() => {
    if (!active) return;
    const target = lenis && !reducedMotion ? clamp(lenis.velocity / 40, -1, 1) * .18 : 0;
    kickVelocity = (kickVelocity + (target - kick) * .12) * .78;
    kick += kickVelocity;
    if (Math.abs(kickVelocity) > .0005 || Math.abs(target - kick) > .0005) render();
  });

  // Passar o mouse na legenda destaca só aquela camada
  callouts.forEach((callout) => {
    const layer = layers[callout.dataset.layer];
    callout.addEventListener('mouseenter', () => {
      stack.classList.add('isolate');
      layer.classList.add('focus');
      callout.classList.add('focus');
    });
    callout.addEventListener('mouseleave', () => {
      stack.classList.remove('isolate');
      layer.classList.remove('focus');
      callout.classList.remove('focus');
    });
  });

  window.addEventListener('resize', render);
  render();
}

/* ================= INÍCIO ================= */
// Sempre começa do topo: o giro deve iniciar na frente da camiseta
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

async function init() {
  if (!window.gsap || !window.ScrollTrigger) {
    // Sem internet para as bibliotecas: a página continua com a imagem fixa
    hideLoader();
    return;
  }
  const render = setupAnimations();
  await loadFrames();
  resizeCanvas();
  render();
  wrap.classList.add('ready');
  hideLoader();
  window.addEventListener('resize', resizeCanvas);
  ScrollTrigger.refresh();
}

init();
