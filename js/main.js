// ADONAY — Landing page
// Giro 360° da camiseta controlado pela rolagem (GSAP + ScrollTrigger + Lenis).

/* ================= CONFIGURAÇÃO ================= */
// Número com DDI + DDD, só dígitos. Ex.: '5531999998888'
const WHATSAPP_NUMBER = '';
const WHATSAPP_MESSAGE = 'Olá! Vim pelo site e quero fazer uma camiseta personalizada.';

const FRAME_COUNT = 8;              // ângulos: 0°, 45°, 90° ... 315°
const STOPS = [0, 95, 177, 240, 360].map((deg) => deg / 360); // paradas do giro, em graus
const STEP_DURATION = 1.1;          // segundos para ir de uma parada à próxima
const STOP_PAUSE = 2.2;             // segundos que a peça fica parada em cada ângulo
const EXPLODED_LENGTH = .3;         // quantas "telas" a seção das camadas fica parada na tela
const EXPLODED_SECONDS = 1.2;       // duração da animação das camadas abrindo        // quantas "telas" dura a vista explodida
const WHEEL_SPEED = 1.3;            // sensibilidade da rodinha do mouse (1 = normal)
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
const viewLabel = document.getElementById('view-label');
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
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (ok) frames[i] = img;
      done++;
      loaderPct.textContent = Math.round((done / FRAME_COUNT) * 100) + '%';
      resolve();
    };
    // onload em vez de img.decode(): em alguns celulares (Safari) o decode() nunca responde
    // e o carregamento ficava parado. O limite de tempo garante que a página sempre segue.
    img.onload = () => { if (img.naturalWidth > 0) frames[i] = img; finish(img.naturalWidth > 0); };
    img.onerror = () => finish(false);
    setTimeout(() => finish(img.complete && img.naturalWidth > 0), 8000);
    img.src = `img/tee/tee-${String(i).padStart(2, '0')}-${size}.webp`;
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
  // Aba mais próxima do ângulo atual (as paradas 0° e 360° são a frente)
  let selected = 0;
  STOPS.slice(0, 4).forEach((stop, i) => {
    if (Math.abs(progress - stop) < Math.abs(progress - STOPS[selected])) selected = i;
  });
  if (progress > (STOPS[3] + 1) / 2) selected = 0;
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
    lenis = new Lenis({ lerp: .1, smoothWheel: true, wheelMultiplier: WHEEL_SPEED, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const state = { p: 0 };
  const render = () => { draw(state.p); updateUi(state.p); };

  // Giro automático: a camiseta passa sozinha por frente → manga → costas → manga → frente,
  // parando um pouco em cada ângulo. A rolagem do mouse só rola a página.
  let stopIndex = 0;
  let timer = null;
  let playing = false;
  const goToStop = (index) => {
    if (stopIndex === STOPS.length - 1) {
      state.p = 0; // 360° é a mesma imagem de 0°: volta sem ninguém perceber
      stopIndex = 0;
    }
    stopIndex = index;
    gsap.to(state, { p: STOPS[index], duration: STEP_DURATION, ease: 'power2.inOut', overwrite: true, onUpdate: render });
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!playing || reducedMotion) return;
    timer = setTimeout(() => {
      goToStop(stopIndex === STOPS.length - 1 ? 1 : stopIndex + 1);
      schedule();
    }, (STEP_DURATION + STOP_PAUSE) * 1000);
  };
  const setPlaying = (on) => {
    playing = on && !document.hidden;
    schedule();
  };

  // Só gira enquanto a primeira dobra está na tela (e a aba do navegador visível)
  const heroTrigger = ScrollTrigger.create({
    trigger: '#hero360',
    start: 'top bottom', // já ativo com a página no topo (scroll 0)
    end: 'bottom 60%',
    onToggle: (self) => document.body.classList.toggle('in-hero', self.isActive),
  });
  ScrollTrigger.create({
    trigger: '#hero360',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => setPlaying(self.isActive),
  });
  document.addEventListener('visibilitychange', () => setPlaying(heroTrigger.isActive || window.scrollY < window.innerHeight));

  window.__lenis = lenis; // facilita testes pelo console

  // Clique nas abas leva direto ao ângulo e o giro continua dali
  steps.forEach((step, i) => step.addEventListener('click', () => {
    goToStop(i);
    schedule();
  }));
  document.querySelectorAll('[data-scroll-top]').forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  setupExploded(lenis);
  setupSections();

  // Entrada dos textos
  if (!reducedMotion) {
    gsap.from('.hero-copy [data-reveal]', { yPercent: 110, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: .12, delay: .1 });
    gsap.from('.side-steps .step, .stage-top-label, .stage-bottom-label', { opacity: 0, x: 20, duration: .9, ease: 'power3.out', stagger: .06, delay: .35 });
    gsap.from('.bottom-bar', { yPercent: 100, duration: 1, ease: 'power3.out', delay: .2 });
    // Anima o canvas (não o wrap) para não mexer na centralização via CSS
    gsap.from(canvas, { scale: .94, duration: 1.4, ease: 'power3.out' });

    // Elementos que entram juntos na tela aparecem em sequência
    gsap.set('[data-fade]', { y: 40, opacity: 0 });
    ScrollTrigger.batch('[data-fade]', {
      start: 'top 88%',
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .1, overwrite: true }),
      onLeaveBack: (batch) => gsap.to(batch, { y: 40, opacity: 0, duration: .4, overwrite: true }),
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

  // No celular cada legenda fica logo abaixo da sua peça, como um rodapé da imagem
  const captionPoints = layers.map((layer) => {
    const [x, y] = layer.dataset.cap.split(',');
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

  // Para onde cada camada vai quando a peça abre (em frações da altura da pilha):
  // as camadas se espalham em leque na diagonal em vez de empilhar em profundidade,
  // assim a foto quase não inclina e continua parecendo foto.
  const SPREAD = [
    { x: -.52, y: .08, z: -.05, s: .7 },   // arte das costas: sai para a direita e um pouco abaixo
    { x: 0, y: 0, z: 0, s: 1 },         // malha
    { x: .04, y: -.3, z: .18, s: 1 },   // traçado
    { x: .1, y: -.5, z: .32, s: 1 },    // logo
    { x: -.1, y: -.42, z: .42, s: 1 },  // bandeira
  ];
  // No celular a tela é estreita e o título fica logo acima: leque mais curto e mais baixo
  if (window.matchMedia('(max-width: 900px)').matches) {
    SPREAD.splice(0, SPREAD.length,
      { x: -.53, y: .2, z: -.05, s: .7 },  // arte das costas: embaixo, à esquerda
      { x: 0, y: 0, z: 0, s: 1 },           // malha
      { x: .44, y: .06, z: .05, s: 1 },     // traçado: embaixo, à direita
      { x: .27, y: -.5, z: .05, s: 1 },    // logo: em cima, à direita
      { x: -.3, y: -.44, z: .08, s: 1 });   // bandeira: à esquerda
  }

  function render() {
    const h = stack.offsetHeight;
    const e = state.explode;
    stack.style.transform =
      `rotateX(${state.tilt * 16}deg) rotateY(${state.tilt * -18}deg) scale(${1 - state.tilt * .06})`;
    layers.forEach((layer, i) => {
      const v = SPREAD[i];
      const scale = 1 + (v.s - 1) * state.explode;
      // 0.5px por camada evita "piscar" quando estão todas no mesmo plano
      layer.style.transform =
        `translate3d(${v.x * h * e}px, ${v.y * h * e}px, ${v.z * h * e + i * .5}px) scale(${scale})`;
    });

    const showLines = getComputedStyle(svg).display !== 'none';
    const box = stage.getBoundingClientRect();
    let visible = 0;
    callouts.forEach((callout, k) => {
      const c = state.calls[k];
      if (c > .5) visible++;
      callout.style.opacity = c;
      if (!showLines) {
        const p = captionPoints[callout.dataset.layer].getBoundingClientRect();
        const half = callout.offsetWidth / 2;
        const x = clamp(p.left - box.left, half + 8, box.width - half - 8);
        callout.style.left = x + 'px';
        callout.style.top = (p.top - box.top + 6) + 'px';
        callout.style.transform = `translate(-50%, ${(1 - c) * 10}px)`;
      } else {
        callout.style.left = callout.style.top = '';
        callout.style.transform = `translateX(${(1 - c) * 24}px)`;
      }
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

  // As camadas abrem sozinhas: basta um toque na rodinha ao chegar na seção e a animação
  // inteira (separar + legendas) roda até o fim. Rolando para cima, ela fecha.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: render });
  tl.to(state, { tilt: 1, duration: .4, ease: 'power2.inOut' }, 0)
    .to(state, { explode: 1, duration: .42, ease: 'power3.inOut' }, .08);
  callouts.forEach((_, k) => {
    tl.to(state.calls, { [k]: 1, duration: .1, ease: 'power2.out' }, .4 + k * .07);
  });
  tl.timeScale(tl.duration() / EXPLODED_SECONDS);
  window.__explodedTl = tl; // facilita testes pelo console

  ScrollTrigger.create({
    trigger: '#exploded',
    start: 'top top',
    end: () => '+=' + window.innerHeight * EXPLODED_LENGTH,
    pin: true,
    invalidateOnRefresh: true,
    // Abre no primeiro toque e só fecha ao subir de volta para fora da seção:
    // pequenos recuos da rolagem suave não fazem a animação ir e voltar
    onEnter: () => tl.play(),
    onLeave: () => tl.play(),
    onLeaveBack: () => tl.reverse(),
  });
  // Quem já chega abaixo da seção (ex.: recarregou a página) vê as camadas abertas
  if (window.scrollY > document.getElementById('exploded').offsetTop) tl.progress(1);


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

/* ================= SEÇÕES ================= */
function setupSections() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Exemplos de trabalho: duplica os cards para o carrossel automático girar sem emenda
  // (feito antes de ligar os botões, assim as cópias também abrem o WhatsApp)
  const collectionTrack = document.getElementById('collection-track');
  [...collectionTrack.children].forEach((item) => {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    collectionTrack.append(copy);
  });

  // Botão "Quero essa" de cada peça abre o WhatsApp com o nome dela
  document.querySelectorAll('[data-product]').forEach((card) => {
    const link = card.querySelector('[data-whatsapp-product]');
    const text = card.dataset.message || `Olá! Vim pelo site e quero fazer uma camiseta personalizada parecida com esta: ${card.dataset.product}.`;
    link.href = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    link.target = '_blank';
    link.rel = 'noopener';
  });

  // Títulos: cada palavra sobe de dentro de uma "máscara"
  document.querySelectorAll('[data-split]').forEach((title) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const word = document.createElement('span');
            word.className = 'word';
            word.innerHTML = `<span>${part}</span>`;
            frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(title);
    if (reducedMotion) return;
    gsap.from(title.querySelectorAll('.word > span'), {
      yPercent: 115, duration: 1, ease: 'power4.out', stagger: .05,
      scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });

  // Cards: inclinação 3D e brilho seguindo o mouse (só com mouse)
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${(x - .5) * 10}deg`);
        card.style.setProperty('--rx', `${(.5 - y) * 10}deg`);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  const mm = gsap.matchMedia();

  // Como funciona: a linha se desenha e os passos aparecem
  const how = document.getElementById('how');
  mm.add('(min-width: 901px)', () => {
    gsap.to('.how-line path', {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: how, start: 'top 80%', end: 'top 35%', scrub: .5 },
    });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.to(how, {
      '--how-progress': 1, ease: 'none',
      scrollTrigger: { trigger: how, start: 'top 75%', end: 'bottom 60%', scrub: .5 },
    });
  });
  if (!reducedMotion) {
    gsap.from('.how-step', {
      y: 40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .18,
      scrollTrigger: { trigger: how, start: 'top 75%', toggleActions: 'play none none reverse' },
    });
  }

  // FAQ: abre e fecha com animação de altura
  document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.faq-body');
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (item.open) {
        gsap.to(body, { height: 0, duration: .4, ease: 'power2.inOut', onComplete: () => { item.open = false; gsap.set(body, { clearProps: 'height' }); } });
      } else {
        item.open = true;
        gsap.from(body, { height: 0, duration: .5, ease: 'power3.out', clearProps: 'height' });
      }
    });
  });

  // Depoimentos: duplica cada linha para o carrossel girar sem emenda
  document.querySelectorAll('.marquee-row').forEach((row) => {
    [...row.children].forEach((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      row.append(copy);
    });
  });

  // Imagens carregando depois mudam alturas: recalcula as posições
  window.addEventListener('load', () => ScrollTrigger.refresh());
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
