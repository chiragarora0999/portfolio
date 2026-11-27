/* Work index: an editorial, filterable wall of case studies (idea adapted from studio portfolios) */
(() => {
  const $ = s => document.querySelector(s);
  const grid = $('#workIndex'); if (!grid) return;

  // Covers are typographic posters: bg, fg, big text, motif, size (tall | mid | short)
  const CASES = [
    { id: 'vpf', cat: 'product', size: 'tall', bg: '#15161a', fg: '#e6cf9c', big: 'VPF', motif: 'scan',
      title: 'Visual Product Finder', meta: 'Solo founder & PM · 2026 · Live',
      hook: 'An AI Chrome extension that finds any product you see in an image or video.',
      ctx: 'You see something you like in a video or on a webpage, and there\'s no easy way to find where to buy it. I wanted to close that gap with AI vision.',
      did: ['Directed the full build with AI-assisted development: a Manifest V3 extension, an Express/TypeScript backend on Render, and a landing page.',
        'Built a region-aware affiliate setup across Amazon US, India and Australia (incl. W-8BEN registration), plus Cuelinks and Impact.com.',
        'Ran Google Ads (search + video) and made launch content for YouTube, TikTok, Instagram and LinkedIn.',
        'Read live analytics to find product and funnel issues, then shipped the fixes.'],
      out: 'A live product, built and launched solo. It only ever shows real marketplace results.',
      links: [['Visit live site ↗', 'https://visual-product-finder-site.onrender.com/'], ['Watch demo ↗', 'https://lnkd.in/p/gix2mAcM']] },

    { id: 'churn', cat: 'highradius', size: 'mid', bg: '#3f5e57', fg: '#f6f5f1', big: '$17M', motif: 'bars',
      title: 'Churn forecaster', meta: 'Highradius · Analytics',
      hook: 'Spotting revenue at risk before it walks out the door.',
      ctx: 'At a global SaaS company, revenue lost to churn is far cheaper to prevent than to win back.',
      did: ['Built a churn forecasting model to flag accounts showing risk early.'],
      out: 'Identified $17M of revenue at risk, so the team could mitigate it proactively.' },

    { id: 'nps', cat: 'highradius', size: 'short', bg: '#8c6d3f', fg: '#f6f5f1', big: '+43%', motif: 'rings',
      title: 'Voice of the customer', meta: 'Highradius · NPS program',
      hook: 'Running the NPS program end to end, from surveys to client conversations.',
      ctx: 'Customer sentiment needed an owner and a repeatable way to measure it and act on it.',
      did: ['Led the NPS program end to end: surveys, dashboards and client connects.', 'Earlier, worked on a CSAT metric that was sitting at −7.'],
      out: 'NPS improved by 43%. The CSAT metric moved from −7 to 34.' },

    { id: 'timeline', cat: 'highradius', size: 'tall', bg: '#1f2a3a', fg: '#c8d6e5', big: '$30M', motif: 'timeline',
      title: 'Timeline tracker', meta: 'Highradius · Delivery systems',
      hook: 'A project system for 3,000+ projects that turned up $30M.',
      ctx: 'With thousands of implementation projects running, timelines had a direct effect on when revenue could be recognised.',
      did: ['Built a project management system overseeing 3,000+ projects.', 'Added a timeline tracker on top of it to surface where revenue recognition could happen.'],
      out: 'Surfaced $30M in revenue-recognition opportunities.' },

    { id: 'kpi', cat: 'highradius', size: 'mid', bg: '#e9e4d8', fg: '#15161a', big: '1,000+', motif: 'dots',
      title: 'Measurement architecture', meta: 'Highradius · Performance & profitability',
      hook: 'Measurement systems for KPIs across 1,000+ resources.',
      ctx: 'Leadership needed a clear, consistent read on performance, margins and capacity across a large delivery organisation.',
      did: ['Designed performance measurement systems tracking KPIs for 1,000+ resources.', 'Built a project margin system and a capacity model.'],
      out: 'Helped leadership optimise resource allocation and profitability.' },

    { id: 'ff', cat: 'highradius', size: 'short', bg: '#9e1b2a', fg: '#f6f5f1', big: 'FF', motif: 'arc',
      title: 'FinancialForce rollout', meta: 'Highradius · Change management',
      hook: 'Rolling out a new platform, and getting directors to actually use it.',
      ctx: 'A Salesforce-based platform (FinancialForce) was coming in for the delivery organisation.',
      did: ['Directed the implementation of FinancialForce.', 'Trained Program Directors, Delivery Directors and Project Managers to adopt it.', 'Separately, drove a 60% reduction in change-request tickets through analytical problem-solving.'],
      out: 'Platform implemented and adopted by delivery leadership, with change-request tickets down 60%.' },

    { id: 'board', cat: 'highradius', size: 'mid', bg: '#d9c7a3', fg: '#15161a', big: 'C-suite', motif: 'lines',
      title: 'In the boardroom', meta: 'Highradius · Executive reporting',
      hook: 'Board decks, QBRs and sessions with $0.5M+ clients.',
      ctx: 'Executive relationships with high-value clients needed sharp reporting and preparation.',
      did: ['Produced Quarterly Business Reports and board decks.', 'Ran executive relationship sessions with clients subscribed at $0.5M+, alongside the CEO, CTO and Consulting SVP.'],
      out: 'Performance awards along the way: Award of Applause, Star Team Award, and "Highako of the Quarter".' },

    { id: 'wellai', cat: 'strategy', size: 'tall', bg: '#2f4a44', fg: '#e6cf9c', big: 'Grow', motif: 'bars',
      title: 'Well.AI growth & strategy', meta: 'Well.AI · Feb 2026 – now',
      hook: 'Pricing, acquisition and market expansion at an early-stage startup.',
      ctx: 'An early-stage wellbeing startup in Sydney with no playbook yet for pricing or go-to-market.',
      did: ['Lead business strategy and operations across pricing, client acquisition and market expansion.', 'Built pricing models, onboarding frameworks and project plans.', 'Market research and business development, e.g. identifying school clients.'],
      out: 'Ongoing: the strategy and operating foundations the startup grows on.' },

    { id: 'buddy', cat: 'product', size: 'short', bg: '#f0e6da', fg: '#8c6d3f', big: 'Buddy', motif: 'rings',
      title: 'Wellbeing Buddy', meta: 'Well.AI · UI/UX + prototype',
      hook: 'Designing a wellbeing app, then building it for real.',
      ctx: 'Well.AI needed its wellbeing app experience designed and tested.',
      did: ['Designed the UI/UX for "Wellbeing Buddy".', 'Built a working prototype using AI-assisted development (Claude Code).'],
      out: 'A working prototype rather than just a mock-up.' },

    { id: 'schn', cat: 'strategy', size: 'mid', bg: '#c8d6e5', fg: '#1f2a3a', big: 'SDPR', motif: 'lines',
      title: 'Sydney Children\'s Hospital Network', meta: 'UNSW CDEV6000 · Summer Term 2027',
      hook: 'Getting a hospital ready for a statewide digital patient record.',
      ctx: 'NSW Health\'s Single Digital Patient Record is a statewide digital transformation program.',
      did: ['Selected for a UNSW industry placement with SCHN.', 'Workflow analysis and change management to support SDPR readiness.'],
      out: 'Up next: placement in Summer Term 2027.' },

    { id: 'swysh', cat: 'strategy', size: 'mid', bg: '#15161a', fg: '#f6f5f1', big: '5 yrs', motif: 'timeline',
      title: 'Swysh strategy deck', meta: '180 Degrees Consulting × Altman Solon',
      hook: 'A 12-slide strategy for an Australian sports fan-engagement platform.',
      ctx: 'Case competition: build a growth strategy for Swysh, an Australian fan-engagement platform.',
      did: ['Designed a two-engine subscription model with tiered pricing and loyalty mechanics.', 'Laid out a phased five-year roadmap.', 'Applied a social-impact and unit-economics lens throughout.'],
      out: 'A complete 12-slide strategy deck.' },

    { id: 'nutri', cat: 'product', size: 'mid', bg: '#b9a07a', fg: '#15161a', big: 'Dal', motif: 'dots',
      title: 'Nutrient tracker', meta: 'Prototype · React',
      hook: 'Nutrition tracking that actually understands home-cooked South Asian food.',
      ctx: 'Most nutrition apps barely cover South Asian home-cooked meals, which is a real market gap.',
      did: ['Built a React prototype targeting that gap.'],
      out: 'Prototype built to explore the idea.' },

    { id: 'rankup', cat: 'product', size: 'short', bg: '#3f5e57', fg: '#d9e6df', big: 'RankUp', motif: 'arc',
      title: 'RankUp', meta: 'Concept · Solo founder exploration',
      hook: 'Verified athletic portfolios for amateur sport.',
      ctx: 'Everyday athletes have no credible, verified record of how they perform.',
      did: ['Explored the concept as a solo founder: a verified athletic portfolio platform.'],
      out: 'A concept under exploration.' },

    { id: 'aivideo', cat: 'experiment', size: 'tall', bg: '#2a1f3a', fg: '#e6cf9c', big: 'AI', motif: 'wave',
      title: 'AI content channels', meta: 'Creative experiments',
      hook: 'Car-to-robot transformation Shorts and kids\' animations, made with generative AI.',
      ctx: 'Testing how far generative tools can take a solo content channel.',
      did: ['Created AI-generated video channels, including car-to-robot transformation Shorts and kids\' animated Shorts.', 'Used ElevenLabs, Google Flow and Viblo.'],
      out: 'Hands-on experience with generative video, image and audio.' },
  ];

  /* ---- generative poster motifs ---- */
  const MOTIF = {
    scan: c => `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><path d="M14 30V14h16M70 14h16v16M86 70v16H70M30 86H14V70"/></g><circle cx="50" cy="50" r="3" fill="${c}"/><line class="m-scan" x1="18" x2="82" y1="50" y2="50" stroke="${c}" stroke-width="1" opacity=".7"/></svg>`,
    bars: c => `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="${c}" opacity=".22">${[18, 30, 26, 44, 40, 62, 58, 80].map((h, i) => `<rect x="${4 + i * 12}" y="${100 - h}" width="8" height="${h}" rx="2"/>`).join('')}</g></svg>`,
    rings: c => `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" opacity=".25">${[10, 20, 30, 40, 50].map(r => `<circle cx="80" cy="20" r="${r}"/>`).join('')}</g></svg>`,
    timeline: c => `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="6" x2="94" y1="80" y2="80" stroke="${c}" opacity=".35"/>${[12, 30, 48, 66, 84].map((x, i) => `<line x1="${x}" x2="${x}" y1="80" y2="80" stroke="${c}" stroke-linecap="round" stroke-width="${i === 4 ? 14 : 8}" vector-effect="non-scaling-stroke" opacity="${i === 4 ? .9 : .4}"/>`).join('')}</svg>`,
    dots: c => `<svg viewBox="0 0 100 100"><g fill="${c}" opacity=".18">${Array.from({ length: 64 }, (_, i) => `<circle cx="${8 + (i % 8) * 12}" cy="${8 + Math.floor(i / 8) * 12}" r="1.6"/>`).join('')}</g></svg>`,
    arc: c => `<svg viewBox="0 0 100 100"><path d="M-10 95 Q 50 10 110 95" fill="none" stroke="${c}" stroke-width="10" opacity=".14"/><path d="M-10 95 Q 50 30 110 95" fill="none" stroke="${c}" stroke-width="2" opacity=".35"/></svg>`,
    lines: c => `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="${c}" opacity=".16">${Array.from({ length: 14 }, (_, i) => `<line x1="0" x2="100" y1="${i * 7.5}" y2="${i * 7.5}"/>`).join('')}</g></svg>`,
    wave: c => `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke="${c}" opacity=".3">${[0, 1, 2, 3, 4].map(k => `<path d="M0 ${60 + k * 8} C 25 ${40 + k * 8}, 50 ${80 + k * 8}, 100 ${55 + k * 8}"/>`).join('')}</g></svg>`,
  };
  const cover = c => `<div class="wi-cover" style="--cbg:${c.bg};--cfg:${c.fg}"><div class="wi-motif">${MOTIF[c.motif](c.fg)}</div><span class="wi-big">${c.big}</span><span class="wi-open">Read case →</span></div>`;

  grid.innerHTML = CASES.map((c, i) => `
    <article class="wi-card wi-${c.size} reveal" data-cat="${c.cat}" data-i="${i}" tabindex="0" role="button" aria-label="Open case study: ${c.title}">
      ${cover(c)}
      <h4>${c.title}</h4>
      <p>${c.hook}</p>
    </article>`).join('');
  // let app.js's reveal observer pick these up if present, otherwise just show them
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
  grid.querySelectorAll('.wi-card').forEach(el => io.observe(el));

  /* ---- filters ---- */
  document.querySelectorAll('.wi-pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('.wi-pill').forEach(x => x.classList.toggle('active', x === p));
    const f = p.dataset.f;
    grid.querySelectorAll('.wi-card').forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.hidden = !show;
      if (show) { card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
    });
  }));

  /* ---- case modal ---- */
  const dlg = $('#caseModal');
  let cur = 0;
  const visible = () => [...grid.querySelectorAll('.wi-card:not([hidden])')].map(el => +el.dataset.i);
  function open(i) {
    cur = i; const c = CASES[i];
    $('#caseCover').innerHTML = cover(c);
    $('#caseMeta').textContent = c.meta;
    $('#caseTitle').textContent = c.title;
    $('#caseHook').textContent = c.hook;
    $('#caseCtx').textContent = c.ctx;
    $('#caseDid').innerHTML = c.did.map(d => `<li>${d}</li>`).join('');
    $('#caseOut').textContent = c.out;
    $('#caseLinks').innerHTML = (c.links || []).map(([t, u]) => `<a class="btn btn-primary btn-sm" href="${u}" target="_blank" rel="noopener">${t}</a>`).join('')
      + `<a class="btn btn-ghost btn-sm" href="#contact" data-close>Talk to me about this →</a>`;
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    history.replaceState(null, '', `#case-${c.id}`);
  }
  const close = () => { dlg.close(); };
  dlg.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));
  grid.addEventListener('click', e => { const card = e.target.closest('.wi-card'); if (card) open(+card.dataset.i); });
  grid.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('wi-card')) { e.preventDefault(); open(+e.target.dataset.i); } });
  $('#caseClose').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) close(); });
  const step = d => { const v = visible(); const k = v.indexOf(cur); open(v[(k + d + v.length) % v.length]); };
  $('#casePrev').addEventListener('click', () => step(-1));
  $('#caseNext').addEventListener('click', () => step(1));
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

  window.CA = Object.assign(window.CA || {}, { work: { CASES, cover, open } });

  // deep links: /#case-churn opens that case
  const m = location.hash.match(/^#case-(.+)$/);
  if (m) { const i = CASES.findIndex(c => c.id === m[1]); if (i >= 0) setTimeout(() => { $('#projects').scrollIntoView(); open(i); }, 400); }
})();
