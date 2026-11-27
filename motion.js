/* Motion layer: split-text reveals, scroll parallax, page-turn transitions, cursor ring, magnetic buttons.
   Everything is skipped for prefers-reduced-motion. */
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('motion');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- split text into masked words ---------------- */
  const SPLIT = '.cv-the, .cv-l1, .cv-l2, .ch-title, .toc-title, .contact-big, .wi-title';
  function split(el) {
    if (el.dataset.splitHtml === el.innerHTML) return; // already split, unchanged
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement('span'); w.className = 'mw';
            const inner = document.createElement('span'); inner.className = 'mw-i'; inner.style.setProperty('--i', i++);
            inner.textContent = p; w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('mw')) walk(n);
      });
    };
    walk(el);
    el.dataset.splitHtml = el.innerHTML;
  }
  const splitIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('split-in'); splitIO.unobserve(e.target); }
  }), { threshold: 0.2 });
  function splitAll(instant) {
    $$(SPLIT).forEach(el => {
      split(el);
      if (instant || el.classList.contains('split-in')) el.classList.add('split-in');
      else splitIO.observe(el);
    });
  }
  splitAll(false);
  // Suit/Code swaps heading HTML; re-split and show at once
  new MutationObserver(() => requestAnimationFrame(() => {
    $$(SPLIT).forEach(el => { delete el.dataset.splitHtml; });
    splitAll(true);
  })).observe(root, { attributes: true, attributeFilter: ['data-mode'] });

  // cover intro choreography
  const heroEl = $('#hero');
  new IntersectionObserver(([en], o) => { if (en.isIntersecting) { root.classList.add('cover-in'); heroEl.querySelector('.cv-title')?.querySelectorAll('.cv-the, .cv-l1, .cv-l2').forEach(x => x.classList.add('split-in')); o.disconnect(); } }, { threshold: 0.35 }).observe(heroEl);

  /* ---------------- scroll-linked parallax ---------------- */
  const coverTitle = $('.cv-title'), sticker = $('.sticker svg');
  let ticking = false;
  function onScroll() {
    const vh = innerHeight, y = scrollY - (heroEl ? heroEl.offsetTop : 0);
    if (coverTitle && y > -vh && y < vh * 1.2) {
      coverTitle.style.translate = `0 ${Math.max(0, y) * 0.22}px`;
      coverTitle.style.opacity = String(Math.max(0.15, 1 - Math.max(0, y) / (vh * 1.1)));
    }
    if (sticker) sticker.style.rotate = `${y * 0.25}deg`;
    $$('.ch-no').forEach(n => {
      const r = n.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      n.style.translate = `0 ${(r.top - vh * 0.5) * -0.12}px`;
    });
    if (innerWidth > 760) {
      const cards = $$('.wi-card:not([hidden])');
      if (cards.length) {
        const g = $('#workIndex').getBoundingClientRect();
        if (g.bottom > 0 && g.top < vh) {
          const colW = g.width / 3, speed = [0, -0.07, 0.05];
          cards.forEach(c => {
            const col = Math.min(2, Math.floor((c.offsetLeft + 4) / colW));
            c.style.translate = `0 ${(g.top - vh * 0.3) * speed[col]}px`;
          });
        }
      }
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- page-turn transition between chapters ---------------- */
  const NAMES = {
    '#top': ['00', 'Cover'], '#hero': ['00', 'Cover'], '#about': ['—', 'Contents'], '#road': ['01', 'The drive'], '#work': ['02', 'By the numbers'],
    '#projects': ['03', 'The work'], '#clouds': ['04', 'In a few words'], '#proof': ['05', 'The interview'],
    '#otc': ['06', 'Off the clock'], '#contact': ['07', 'Letters'],
  };
  const turn = document.createElement('div');
  turn.className = 'turn'; turn.setAttribute('aria-hidden', 'true');
  turn.innerHTML = '<span class="turn-no"></span><span class="turn-title"></span>';
  document.body.appendChild(turn);
  let turning = false;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || turning) return;
    const hash = a.getAttribute('href');
    const target = hash === '#top' ? document.body : $(hash);
    if (!NAMES[hash] || !target) return;
    // only for real jumps (not when the target is already on screen)
    const r = (hash === '#top' ? $('#hero') : target).getBoundingClientRect();
    if (Math.abs(r.top) < innerHeight * 0.6) return;
    e.preventDefault();
    turning = true;
    turn.querySelector('.turn-no').textContent = NAMES[hash][0];
    turn.querySelector('.turn-title').textContent = NAMES[hash][1];
    turn.className = 'turn in';
    setTimeout(() => {
      root.style.scrollBehavior = 'auto';
      if (hash === '#top') scrollTo(0, 0); else target.scrollIntoView();
      root.style.scrollBehavior = '';
      history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
      turn.className = 'turn out';
      setTimeout(() => { turn.className = 'turn'; turning = false; }, 650);
    }, 620);
  }, true);

  /* ---------------- cursor ring + magnetic buttons (mouse only) ---------------- */
  if (!fine) return;
  const ring = document.createElement('div');
  ring.className = 'cring'; ring.innerHTML = '<span></span>';
  document.body.appendChild(ring);
  const label = ring.firstChild;
  let mx = -100, my = -100, rx = -100, ry = -100, shown = false;
  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    if (!shown) { shown = true; rx = mx; ry = my; ring.classList.add('on'); }
    const t = e.target;
    let state = '';
    if (t.closest('input, textarea, .term-overlay, .case')) state = 'hide';
    else if (t.closest('.wi-card')) state = 'read';
    else if (t.closest('#game')) state = 'play';
    else if (t.closest('.cloud .w')) state = 'word';
    else if (t.closest('a, button, [role="button"], .item')) state = 'link';
    ring.dataset.state = state;
    label.textContent = state === 'read' ? 'Read' : state === 'play' ? 'Play' : '';
  }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('on'));
  document.addEventListener('pointerenter', () => ring.classList.add('on'));
  (function loop() {
    rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

  $$('.btn, .sticker, .mh-contents, .wi-pill').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.translate = `${x}px ${y}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
})();
