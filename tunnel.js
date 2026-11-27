/* The card tunnel: an opening scene where scrolling walks a camera down a curved tunnel lined with cards.
   Original CSS-3D build (no libraries). Skipped for prefers-reduced-motion. */
(() => {
  const sec = document.querySelector('#tunnel');
  if (!sec) return;
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { sec.remove(); return; }

  const stage = sec.querySelector('.t-stage'), cam = sec.querySelector('.t-cam'), world = sec.querySelector('.t-world');
  const caps = [...sec.querySelectorAll('.t-cap')], counter = sec.querySelector('.t-count b');
  const small = innerWidth < 760;

  // geometry
  const G = small
    ? { R: 300, W: 168, H: 108, per: 7, rings: 11, S: 190, persp: 520, bend: 140 }
    : { R: 560, W: 290, H: 186, per: 11, rings: 13, S: 300, persp: 820, bend: 300 };
  stage.style.perspective = `${G.persp}px`;
  const bendX = z => G.bend * Math.sin(z / (G.S * 3.2));        // tunnel curves left/right
  const bendA = z => Math.atan(G.bend / (G.S * 3.2) * Math.cos(z / (G.S * 3.2))); // its heading

  /* ---------- the deck of cards ---------- */
  const work = window.CA?.work;
  const deck = [];
  (work?.CASES || []).forEach((c, i) => deck.push({ kind: 'case', i, html: work.cover(c) }));
  const CHAPTERS = [['01', 'The drive', '#road'], ['02', 'By the numbers', '#work'], ['03', 'The work', '#projects'],
    ['04', 'In a few words', '#clouds'], ['05', 'The interview', '#proof'], ['06', 'Off the clock', '#otc'], ['07', 'Letters', '#contact']];
  CHAPTERS.forEach(([n, t, h]) => deck.push({ kind: 'chapter', href: h, html: `<div class="tc-ch"><span>${n}</span><b>${t}</b><i>Read →</i></div>` }));
  [['I speak boardroom', 'and I actually ship.'], ['Strategy × AI', 'Sydney, 2026'], ['Open to roles', 'consulting · strategy · product · AI'],
    ['The bilingual builder.', 'Issue 01']].forEach(([a, b]) => deck.push({ kind: 'quote', html: `<div class="tc-q"><b>${a}</b><span>${b}</span></div>` }));
  // deterministic shuffle so neighbouring cards differ
  const rnd = (s => () => (s = (s * 9301 + 49297) % 233280) / 233280)(42);
  const order = deck.map((d, i) => [rnd(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

  /* ---------- build rings ---------- */
  const rings = [];
  const arcFrom = 42, arcTo = 318; // leave the floor (around 0deg) open
  let n = 0;
  for (let k = 0; k < G.rings; k++) {
    const ring = document.createElement('div');
    ring.className = 't-ring';
    const z = -k * G.S - 200;
    ring.style.transform = `translate3d(${bendX(-z)}px,0,${z}px) rotateY(${bendA(-z)}rad)`;
    for (let j = 0; j < G.per; j++) {
      const th = arcFrom + (arcTo - arcFrom) * (j + 0.5) / G.per + (k % 2 ? 6 : -6);
      const d = deck[order[n++ % order.length]];
      const card = document.createElement(d.kind === 'chapter' ? 'a' : 'button');
      card.className = `t-card t-${d.kind}`;
      if (d.kind === 'chapter') card.href = d.href;
      if (d.kind === 'case') card.dataset.case = d.i;
      card.style.width = `${G.W}px`; card.style.height = `${G.H}px`;
      card.style.margin = `${-G.H / 2}px 0 0 ${-G.W / 2}px`;
      // face the tunnel axis, lean toward the viewer, and turn in-plane so the card's top points to the ceiling
      const TILT = small ? 70 : 74;
      let best = 0, bestScore = -Infinity;
      [0, 90, 180, 270].forEach(rot => {
        const m = new DOMMatrix().rotate(0, 0, th).translate(0, G.R, 0).rotate(TILT, 0, 0).rotate(0, 0, rot);
        const o = m.transformPoint(new DOMPoint(0, 0, 0)), u = m.transformPoint(new DOMPoint(0, -1, 0));
        const score = -(u.y - o.y) + 0.35 * -(u.z - o.z);
        if (score > bestScore) { bestScore = score; best = rot; }
      });
      card.style.transform = `rotateZ(${th}deg) translateY(${G.R}px) rotateX(${TILT}deg) rotateZ(${best}deg)`;
      card.innerHTML = d.html;
      card.tabIndex = -1;
      ring.appendChild(card);
    }
    world.appendChild(ring);
    rings.push({ el: ring, z });
  }
  // a small red car driving on the floor ahead of you
  const car = document.createElement('div');
  car.className = 't-car';
  car.innerHTML = `<svg viewBox="0 0 80 44"><ellipse cx="40" cy="40" rx="34" ry="4" fill="rgba(0,0,0,.45)"/><path d="M8 34 V20 Q8 14 16 13 L22 4 Q40 0 58 4 L64 13 Q72 14 72 20 V34 Z" fill="#9e1b2a"/><path d="M24 7 L20 14 H60 L56 7 Q40 4 24 7Z" fill="#1e2129"/><rect x="11" y="19" width="10" height="5" rx="2" fill="#ff5a4f"/><rect x="59" y="19" width="10" height="5" rx="2" fill="#ff5a4f"/><rect x="30" y="24" width="20" height="6" rx="1" fill="#e6cf9c"/><rect x="6" y="32" width="12" height="9" rx="3" fill="#15161a"/><rect x="62" y="32" width="12" height="9" rx="3" fill="#15161a"/></svg>`;
  if (!small) world.appendChild(car); // on phones the car would sit on the caption

  /* ---------- clicks ---------- */
  world.addEventListener('click', e => {
    const c = e.target.closest('.t-card'); if (!c) return;
    if (c.dataset.case) { e.preventDefault(); window.CA?.work?.open(+c.dataset.case); }
  });

  /* ---------- camera ---------- */
  const total = G.rings * G.S - G.persp * 0.6;
  let target = 0, depth = 0, mx = 0, my = 0, cmx = 0, cmy = 0, visible = true, stageIdx = -1;
  function measure() {
    const r = sec.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (sec.offsetHeight - innerHeight)));
    target = p * total;
    const s = Math.min(caps.length - 1, Math.floor(p * caps.length * 0.999));
    if (s !== stageIdx) {
      stageIdx = s;
      caps.forEach((c, i) => c.classList.toggle('on', i === s));
      counter.textContent = String(s + 1).padStart(2, '0');
    }
    root.classList.toggle('in-tunnel', r.bottom > innerHeight * 0.35);
    sec.classList.toggle('t-done', p > 0.97);
  }
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', measure);
  if (matchMedia('(hover: hover)').matches) {
    stage.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(stage);

  let t0 = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    if (visible) {
      depth += (target - depth) * (1 - Math.exp(-dt * 5));
      cmx += (mx - cmx) * (1 - Math.exp(-dt * 4)); cmy += (my - cmy) * (1 - Math.exp(-dt * 4));
      const idle = Math.sin(now / 2600) * 0.6;
      cam.style.transform = `rotateY(${cmx * 9 + idle}deg) rotateX(${-cmy * 6}deg)`;
      world.style.transform = `translate3d(${-bendX(depth)}px,0,${depth}px) rotateY(${-bendA(depth) * 0.6}rad)`;
      // fog + cull rings by distance from the camera
      rings.forEach(r => {
        const rel = r.z + depth; // 0 = at the camera, negative = ahead
        const hidden = rel > G.persp * 0.55 || rel < -G.S * 9.5;
        r.el.style.visibility = hidden ? 'hidden' : '';
        if (!hidden) r.el.style.opacity = String(Math.max(0, Math.min(1, 1 + (rel + G.S * 6) / (G.S * 3.5))) * Math.min(1, (G.persp * 0.55 - rel) / 260));
      });
      // the car keeps a steady distance ahead, bobbing slightly
      if (small) { requestAnimationFrame(frame); return; }
      const cz = -depth - G.persp * 0.9;
      car.style.transform = `translate3d(${bendX(-cz) - 40}px, ${G.R - 46 + Math.sin(now / 140) * 0.8}px, ${cz}px) rotateY(${bendA(-cz)}rad)`;
    }
    requestAnimationFrame(frame);
  }
  measure();
  requestAnimationFrame(frame);
})();
