/* Chirag Arora — portfolio interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#yr').textContent = new Date().getFullYear();

  /* ================= SECRETS ================= */
  const SECRETS = [
    { id: 'dev', icon: '🌙', name: 'Night shift', hint: 'Flip the Suit/Code switch' },
    { id: 'term', icon: '💻', name: "I'm in", hint: 'Press / anywhere' },
    { id: 'hire', icon: '🔑', name: 'Root access', hint: 'Try a sudo command in the terminal' },
    { id: 'scan', icon: '🔍', name: 'Product detective', hint: 'Use the Visual Product Finder demo' },
    { id: 'road', icon: '🏁', name: 'Road tripper', hint: 'Reach the finish line in the driving game' },
    { id: 'vroom', icon: '🚗', name: 'Zoom-zoom', hint: 'Something off the clock has an engine' },
    { id: 'reps', icon: '🏋️', name: 'Gym buddy', hint: 'Finish a full set' },
    { id: 'konami', icon: '🕹️', name: 'Old-school', hint: '↑ ↑ ↓ ↓ ← → ← → B A' },
  ];
  let found = new Set();
  try { found = new Set(JSON.parse(localStorage.getItem('ca_secrets') || '[]')); } catch {}
  $('#secretTotal').textContent = SECRETS.length;

  function renderSecrets() {
    const n = found.size;
    $('#secretCount').textContent = n;
    $('#footSecrets').textContent = n;
    $('.secrets-badge .lock').textContent = n === SECRETS.length ? '🏆' : n ? '🔓' : '🔒';
    $('#secretList').innerHTML = SECRETS.map(s => found.has(s.id)
      ? `<li class="found"><span>${s.icon}</span><div><b>${s.name}</b><small>${s.hint}</small></div></li>`
      : `<li><span>❔</span><div><b>???</b><small>Hint: ${s.hint}</small></div></li>`).join('');
  }
  function unlock(id) {
    if (found.has(id)) return;
    const s = SECRETS.find(x => x.id === id); if (!s) return;
    found.add(id);
    localStorage.setItem('ca_secrets', JSON.stringify([...found]));
    renderSecrets();
    toast(s.icon, `Secret found: ${s.name}`, `${found.size}/${SECRETS.length} discovered`);
    const b = $('#secretsBadge'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
    if (found.size === SECRETS.length) {
      setTimeout(() => {
        confetti(220);
        toast('🏆', 'You found every secret!', "That's real attention to detail. Chirag would love to hear from you.");
      }, 900);
    }
  }
  renderSecrets();
  $('#secretsBadge').addEventListener('click', e => { e.stopPropagation(); const p = $('#secretsPop'); p.hidden = !p.hidden; });
  document.addEventListener('click', e => { if (!e.target.closest('#secretsPop')) $('#secretsPop').hidden = true; });

  function toast(icon, title, sub = '') {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="t-ic">${icon}</span><div><b>${title}</b><small>${sub}</small></div>`;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  /* ================= MODE (Suit / Code) ================= */
  const devEls = $$('[data-dev]');
  devEls.forEach(el => { el.dataset.biz = el.innerHTML; });
  function applyMode(m) {
    root.dataset.mode = m;
    devEls.forEach(el => { el.innerHTML = m === 'dev' ? el.dataset.dev : el.dataset.biz; });
    $('meta[name="theme-color"]').setAttribute('content', m === 'dev' ? '#0d0e11' : '#f6f5f1');
    localStorage.setItem('ca_mode', m);
    restartRotator();
  }
  function setMode(m, x, y) {
    if (m === root.dataset.mode) return;
    if (m === 'dev') unlock('dev');
    if (!document.startViewTransition || reduced) return applyMode(m);
    x ??= innerWidth - 80; y ??= 30;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyMode(m));
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 750, easing: 'cubic-bezier(.7,0,.3,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
  }
  const toggle = $('#modeToggle');
  toggle.addEventListener('click', e => setMode(root.dataset.mode === 'dev' ? 'biz' : 'dev', e.clientX, e.clientY));
  if (!found.has('dev')) toggle.classList.add('nudge');

  /* ================= HERO ================= */
  const WORDS = {
    biz: ['boardroom', 'spreadsheet', 'strategy', 'Python', 'product', 'AI'],
    dev: ['TypeScript', 'SQL', 'Python', 'prompt', 'stakeholder', 'business'],
  };
  let rotTimer, rotI = 0;
  function restartRotator() {
    clearInterval(rotTimer);
    const el = $('#rotator'); const list = WORDS[root.dataset.mode];
    rotI = 0; el.textContent = list[0];
    rotTimer = setInterval(() => {
      el.classList.add('out');
      setTimeout(() => { rotI = (rotI + 1) % list.length; el.textContent = list[rotI]; el.classList.remove('out'); }, 260);
    }, 2000);
  }
  restartRotator();

  const hero = $('#hero');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hero.style.setProperty('--my', `${e.clientY - r.top}px`);
  });

  /* ================= REVEAL + COUNTERS ================= */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll?.('[data-count]').forEach(countUp);
      if (en.target.id === 'xp') lightLevels();
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal, .lang-meter').forEach(el => io.observe(el));

  function countUp(el) {
    const end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const dur = 1400, t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + v.toLocaleString('en-US') + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function lightLevels() {
    $$('.xp-levels li').forEach((li, i) => setTimeout(() => li.classList.add('on'), 250 + i * 520));
  }

  /* ================= VPF DEMO ================= */
  let scanning = false;
  $$('.item').forEach(btn => btn.addEventListener('click', () => {
    if (scanning) return; scanning = true;
    $$('.item').forEach(b => b.classList.remove('picked'));
    btn.classList.add('scanning');
    const res = $('#vpfResult');
    res.innerHTML = `<span class="vr-label">AI VISION</span><p class="typing">Analyzing the image</p>`;
    setTimeout(() => {
      btn.classList.remove('scanning'); btn.classList.add('picked');
      const q = encodeURIComponent(btn.dataset.q);
      res.innerHTML = `<span class="vr-label">IDENTIFIED · ${btn.textContent}</span>
        <p class="vr-name">${btn.dataset.name}</p>
        <div class="vr-links">
          <a href="https://www.amazon.com.au/s?k=${q}" target="_blank" rel="noopener">Amazon AU ↗</a>
          <a href="https://www.amazon.com/s?k=${q}" target="_blank" rel="noopener">Amazon US ↗</a>
          <a href="https://www.amazon.in/s?k=${q}" target="_blank" rel="noopener">Amazon IN ↗</a>
          <a href="https://www.flipkart.com/search?q=${q}" target="_blank" rel="noopener">Flipkart ↗</a>
        </div>`;
      scanning = false;
      unlock('scan');
    }, 1300);
  }));

  /* ================= PROJECT FILTERS + TILT ================= */
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('active', x === c));
    const f = c.dataset.filter;
    $$('.proj').forEach(p => p.classList.toggle('hide', f !== 'all' && p.dataset.kind !== f));
  }));
  if (!reduced && matchMedia('(hover: hover)').matches) {
    $$('.proj, .vpf-demo .browser').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ================= PROOF FINDER ================= */
  const NEEDS = [
    { k: 'Turn messy data into decisions', ev: [
      ['Highradius', 'Churn forecasting model that identified $17M of revenue at risk.'],
      ['Highradius', 'Timeline tracker that surfaced $30M in revenue-recognition opportunities.'],
      ['Highradius', 'Project margin system + capacity model for resource allocation and profitability.'],
    ]},
    { k: 'Ship a product end to end', ev: [
      ['Visual Product Finder', 'Solo-built and launched a live AI Chrome extension, backend, and landing page.'],
      ['Well.AI', 'Designed the UI/UX for Wellbeing Buddy and built a working prototype.'],
      ['Side project', 'React nutrition-tracking prototype for South Asian home-cooked food.'],
    ]},
    { k: 'Hold the room with the C-suite', ev: [
      ['Highradius', 'Quarterly Business Reports and board decks.'],
      ['Highradius', 'Executive relationship sessions with $0.5M+ clients, with the CEO, CTO and Consulting SVP.'],
      ['Highradius', 'Trained Program Directors, Delivery Directors and PMs on FinancialForce.'],
    ]},
    { k: 'Fix customer experience', ev: [
      ['Highradius', 'Ran the NPS program end to end and lifted NPS by 43%.'],
      ['Highradius', 'Moved a CSAT metric from −7 to 34.'],
      ['Highradius', 'Drove a 60% reduction in change-request tickets.'],
    ]},
    { k: 'Grow users & revenue', ev: [
      ['Visual Product Finder', 'Ran Google Ads (search + video) and launch content across 4 social platforms.'],
      ['Visual Product Finder', 'Region-aware affiliate system across Amazon US, India & Australia + Cuelinks + Impact.com.'],
      ['Well.AI', 'Pricing models, client acquisition and market expansion strategy.'],
      ['Swysh case comp', 'Two-engine subscription model, tiered pricing and loyalty mechanics.'],
    ]},
    { k: 'Build systems that scale', ev: [
      ['Highradius', 'Performance measurement systems tracking KPIs for 1,000+ resources.'],
      ['Highradius', 'Project management system overseeing 3,000+ projects.'],
      ['Highradius', 'Directed the FinancialForce (Salesforce) implementation.'],
    ]},
    { k: 'Lead digital transformation', ev: [
      ['Sydney Children\'s Hospital Network', 'UNSW placement supporting readiness for NSW Health\'s Single Digital Patient Record.'],
      ['Highradius', 'Directed the FinancialForce rollout and drove adoption across delivery leadership.'],
      ['UNSW', 'MCom specialisation in Digital Transformation & Technology Management.'],
    ]},
    { k: 'Actually use AI (not just talk about it)', ev: [
      ['Visual Product Finder', 'AI vision identifies products from any image or paused video frame.'],
      ['AI-assisted dev', 'Builds working products and prototypes with Claude Code.'],
      ['Content experiments', 'AI video channels using ElevenLabs, Google Flow and Viblo.'],
      ['Foundation', 'B.E. Computer Science specialising in AI & Machine Learning.'],
    ]},
  ];
  const needsEl = $('#needs'), evEl = $('#evidence');
  needsEl.innerHTML = NEEDS.map((n, i) => `<button class="need" data-i="${i}">${n.k}</button>`).join('');
  function showNeed(i) {
    $$('.need').forEach(b => b.classList.toggle('active', +b.dataset.i === i));
    evEl.innerHTML = NEEDS[i].ev.map(([src, t], j) =>
      `<div class="ev" style="animation-delay:${j * 90}ms"><small>${src}</small><p>${t}</p></div>`).join('');
  }
  needsEl.addEventListener('click', e => { const b = e.target.closest('.need'); if (b) showNeed(+b.dataset.i); });
  showNeed(0);

  /* ================= OFF THE CLOCK ================= */
  const mazda = $('#mazda');
  mazda.addEventListener('click', () => {
    mazda.classList.remove('rev'); void mazda.offsetWidth; mazda.classList.add('rev');
    setTimeout(() => mazda.classList.remove('rev'), 1000);
    unlock('vroom');
  });
  let reps = 0;
  const gym = $('#gym');
  gym.addEventListener('click', () => {
    reps = reps >= 10 ? 1 : reps + 1;
    $('#reps').textContent = reps;
    gym.classList.remove('rep'); void gym.offsetWidth; gym.classList.add('rep');
    if (reps === 10) { unlock('reps'); confetti(60); }
  });
  $('#music').addEventListener('click', e => e.currentTarget.classList.toggle('playing'));

  /* ================= CONTACT ================= */
  $('#copyEmail').addEventListener('click', async e => {
    const btn = e.currentTarget, email = btn.dataset.email, txt = $('.ce-text', btn);
    try { await navigator.clipboard.writeText(email); txt.textContent = 'Copied to clipboard ✓'; }
    catch { location.href = `mailto:${email}`; }
    setTimeout(() => { txt.textContent = email; }, 2000);
  });

  /* ================= TERMINAL ================= */
  const overlay = $('#termOverlay'), out = $('#termOut'), input = $('#termInput');
  let booted = false; const hist = []; let hIdx = 0;
  const print = (html, cls = '') => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; };
  function openTerm() {
    overlay.hidden = false; unlock('term');
    if (!booted) {
      booted = true;
      print(`<span class="t-acc">ChiragOS v26.11</span> <span class="t-dim">· Sydney node · strategy + AI kernel loaded</span>`);
      print(`Type <span class="t-acc">help</span> to see what you can do. <span class="t-dim">(There are hidden commands too.)</span>\n`);
    }
    setTimeout(() => input.focus(), 30);
  }
  const closeTerm = () => { overlay.hidden = true; };
  $('#openTerm').addEventListener('click', openTerm);
  $('#termClose').addEventListener('click', closeTerm);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeTerm(); });

  const go = id => { closeTerm(); setTimeout(() => $(id)?.scrollIntoView({ behavior: 'smooth' }), 120); };
  const FILES = {
    'about.txt': 'Engineer-turned-business builder. CS (AI/ML) → 4.5 yrs at Highradius (intern → Principal Analyst) → UNSW MCom in Sydney → shipping AI products on the side.',
    'resume.pdf': '<span class="t-warn">Binary file.</span> Easier option: email chiragarora0999@gmail.com and I\'ll send it over.',
    'secrets.txt': 'Nice try. Run <span class="t-acc">secrets</span> instead.',
    'mazda.cfg': 'model=Mazda2\ncolour=red (on this website at least)\nzoom_zoom=true',
  };
  const CMDS = {
    help: () => `<span class="t-acc">Commands</span>
  whoami        who is this guy?
  experience    the Highradius run, in numbers
  projects      things I've built
  vpf           open Visual Product Finder (live)
  skills        the toolbox
  education     degrees
  contact       how to reach me
  mode [suit|code]  flip the whole website
  secrets       your secret-hunting progress
  ls · cat <file> · clear · exit
<span class="t-dim">…and a few that aren't listed. Admins usually start with "sudo".</span>`,
    whoami: () => `<span class="t-acc">Chirag Arora</span> · Sydney, AU
MCom @ UNSW · ex-Principal Analyst @ Highradius · solo founder of Visual Product Finder
Speaks: boardroom, spreadsheet, Python, TypeScript, Punjabi.
Currently looking for internships & grad roles in consulting, strategy, product and AI.`,
    experience: () => `<span class="t-acc">Highradius</span> · Jul 2021 – Dec 2025 · Intern → Associate BA → Senior Analyst → Principal Analyst
  ▸ $17M revenue at risk identified (churn model)
  ▸ $30M revenue-recognition opportunities surfaced
  ▸ +43% NPS · CSAT −7 → 34
  ▸ KPIs for 1,000+ resources · PM system for 3,000+ projects
  ▸ −60% change-request tickets · FinancialForce rollout
<span class="t-acc">Well.AI</span> · Feb 2026 – now · Business Growth & Strategy Executive
<span class="t-acc">SCHN × UNSW</span> · Summer 2027 · Single Digital Patient Record readiness
<span class="t-dim">→ type "goto work" to scroll there</span>`,
    projects: () => `  <span class="t-acc">vpf</span>            Visual Product Finder · LIVE · AI Chrome extension
  wellbeing-buddy UI/UX + prototype (Well.AI)
  nutrient-app    React prototype · South Asian home cooking
  rankup          concept · verified athletic portfolios
  ai-channels     generative video experiments
  swysh           case comp strategy deck (180DC × Altman Solon)
<span class="t-dim">→ type "vpf" to open the live one</span>`,
    vpf: () => { window.open('https://visual-product-finder-site.onrender.com/', '_blank', 'noopener'); return 'Opening <a href="https://visual-product-finder-site.onrender.com/" target="_blank" rel="noopener">visual-product-finder-site.onrender.com</a> ↗'; },
    skills: () => `<span class="t-acc">AI</span>        prompt engineering · AI-assisted dev · gen-AI content · UI/UX · rapid MVPs
<span class="t-acc">Business</span>  analysis · strategy · consulting · product · paid acquisition · C-suite stakeholders
<span class="t-acc">Tech</span>      SQL · Python · JS/TS · Chrome MV3 · Express/Node · Excel · Salesforce · Apps Script`,
    education: () => `UNSW Sydney · Master of Commerce (Extension) · Business Analytics + Digital Transformation · 2026–
Chandigarh University · B.E. Computer Science (AI & ML) · 2018–2022`,
    contact: () => `email     <a href="mailto:chiragarora0999@gmail.com">chiragarora0999@gmail.com</a>
linkedin  <a href="https://www.linkedin.com/in/chirag-arora-034a22123/" target="_blank" rel="noopener">linkedin.com/in/chirag-arora-034a22123</a>`,
    email: () => CMDS.contact(),
    linkedin: () => { window.open('https://www.linkedin.com/in/chirag-arora-034a22123/', '_blank', 'noopener'); return 'Opening LinkedIn ↗'; },
    ls: () => Object.keys(FILES).join('    '),
    cat: a => FILES[a] ?? `cat: ${a || ''}: No such file. Try <span class="t-acc">ls</span>.`,
    mode: a => {
      const m = /code|dev/.test(a) ? 'dev' : /suit|biz/.test(a) ? 'biz' : (root.dataset.mode === 'dev' ? 'biz' : 'dev');
      setMode(m); return `Switched to <span class="t-acc">${m === 'dev' ? 'Code' : 'Suit'}</span> mode.`;
    },
    secrets: () => `${found.size}/${SECRETS.length} found\n` + SECRETS.map(s => found.has(s.id) ? `  ${s.icon} ${s.name}` : `  ❔ ??? <span class="t-dim">(${s.hint})</span>`).join('\n'),
    goto: a => { const map = { road: '#road', work: '#work', projects: '#projects', proof: '#proof', contact: '#contact', top: '#top' }; if (map[a]) { go(map[a]); return ''; } return 'goto: road | work | projects | proof | contact | top'; },
    sudo: a => {
      if (/hire/.test(a)) { unlock('hire'); setTimeout(() => confetti(160), 200); return `<span class="t-acc">[sudo] password for recruiter: ********</span>
Access granted. Excellent decision.
Next step: <a href="mailto:chiragarora0999@gmail.com?subject=Let's%20talk">email Chirag</a> or <a href="https://www.linkedin.com/in/chirag-arora-034a22123/" target="_blank" rel="noopener">connect on LinkedIn</a>.`; }
      return `sudo: "${a}" isn't something even root can do here. Maybe try <span class="t-acc">sudo hire-chirag</span>?`;
    },
    hire: () => `Permission denied. You need admin rights. <span class="t-dim">(hint: sudo)</span>`,
    drive: () => { go('#road'); setTimeout(() => window.CA?.startGame?.(), 700); return 'Starting the Mazda… 🚗'; },
    coffee: () => `☕ Brewing… Happy to grab a real one in Sydney. Type <span class="t-acc">contact</span>.`,
    punjabi: () => `🎶 Volume set to "loud". Recently: Karan Aujla, live.`,
    rm: () => `<span class="t-warn">Nice try.</span> This portfolio is protected by strong opinions and version control.`,
    date: () => new Date().toString(),
    echo: a => a.replace(/</g, '&lt;'),
    history: () => hist.map((h, i) => `  ${i + 1}  ${h.replace(/</g, '&lt;')}`).join('\n'),
    clear: () => { out.innerHTML = ''; return ''; },
    exit: () => { closeTerm(); return ''; },
  };
  $('#termForm').addEventListener('submit', e => {
    e.preventDefault();
    const raw = input.value.trim(); input.value = '';
    if (!raw) return;
    hist.push(raw); hIdx = hist.length;
    print(raw.replace(/</g, '&lt;'), 't-cmd');
    const [cmd, ...rest] = raw.split(/\s+/); const arg = rest.join(' ');
    const fn = CMDS[cmd.toLowerCase()];
    const res = fn ? fn(arg) : `command not found: ${cmd.replace(/</g, '&lt;')}. Type <span class="t-acc">help</span>.`;
    if (res) print(res + '\n');
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { hIdx = Math.max(0, hIdx - 1); input.value = hist[hIdx] || ''; e.preventDefault(); }
    if (e.key === 'ArrowDown') { hIdx = Math.min(hist.length, hIdx + 1); input.value = hist[hIdx] || ''; e.preventDefault(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const m = Object.keys(CMDS).filter(c => c.startsWith(input.value));
      if (m.length === 1) input.value = m[0] + ' ';
      else if (m.length) print(m.join('  '), 't-dim');
    }
  });

  /* ================= KEYBOARD ================= */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kI = 0;
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (e.key === 'Escape' && !overlay.hidden) return closeTerm();
    if (!typing && (e.key === '/' || e.key === '`')) { e.preventDefault(); return openTerm(); }
    if (typing) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kI = k === KONAMI[kI] ? kI + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kI === KONAMI.length) { kI = 0; unlock('konami'); confetti(200); }
  });

  /* ================= CONFETTI ================= */
  const cv = $('#confetti'), ctx = cv.getContext('2d');
  let parts = [], raf = 0;
  function confetti(n = 120) {
    if (reduced) return;
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const cols = root.dataset.mode === 'dev' ? ['#c8a86b', '#ecebe6', '#7fa89b', '#e6d3a8'] : ['#8c6d3f', '#15161a', '#3f5e57', '#d9c7a3', '#b8b2a5'];
    for (let i = 0; i < n; i++) parts.push({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
      vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4, g: .4 + Math.random() * .2,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: cols[i % cols.length], life: 0,
    });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.y < innerHeight + 40 && p.life < 260);
    parts.forEach(p => {
      p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* ================= MAGAZINE: contents panel + reading progress ================= */
  const cBtn = $('#contentsBtn'), cPanel = $('#contentsPanel');
  if (cBtn && cPanel) {
    const setC = open => { cPanel.hidden = !open; cBtn.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; };
    cBtn.addEventListener('click', () => setC(cPanel.hidden));
    cPanel.addEventListener('click', e => { if (e.target.closest('a')) setC(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !cPanel.hidden) setC(false); });
  }
  const prog = $('#progress');
  if (prog) {
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  window.CA = Object.assign(window.CA || {}, { unlock, confetti, toast });

  /* restore saved mode last, once everything above is initialised */
  if (localStorage.getItem('ca_mode') === 'dev') applyMode('dev');
})();
