/* Slido-style word clouds: spiral layout, hover notes, and a "describe Chirag" poll */
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  // [word, weight 1-5, story]
  const DATA = {
    you: [
      ['builder', 5, 'Ships things end to end, from a 1,000-person KPI system to a live Chrome extension.'],
      ['entrepreneurial', 4, 'Always circling digital business models, app ideas and platform strategy.'],
      ['collaborative', 4, 'Works across C-suite, delivery directors, PMs and early-stage founders.'],
      ['analytical', 4, '4.5 years in analytics: churn models, margin systems, KPI frameworks.'],
      ['bilingual', 3, 'Speaks business and code: CS (AI/ML) degree plus a Master of Commerce.'],
      ['warm', 3, 'People-first, whether it\'s a client connect or a new teammate.'],
      ['upbeat', 3, 'The energy you want in a messy, early-stage room.'],
      ['shipper', 3, 'Visual Product Finder went from idea to live product, solo.'],
      ['no-playbook', 2, 'Thrives in early, unstructured environments where there isn\'t a playbook yet.'],
      ['curious', 2, 'From AI video channels to hospital digital records, always learning something new.'],
    ],
    bring: [
      ['strategy', 5, 'Pricing, market expansion and roadmaps at Well.AI and in the Swysh case comp.'],
      ['AI', 5, 'CS degree in AI & ML, plus a live AI-vision product.'],
      ['analytics', 4, 'Churn forecasting, capacity models, margin systems at Highradius.'],
      ['product', 4, 'Solo founder & PM of Visual Product Finder.'],
      ['C-suite', 3, 'Exec sessions alongside the CEO, CTO and Consulting SVP.'],
      ['consulting', 3, 'Client-facing analyst work for $0.5M+ subscribers.'],
      ['growth', 3, 'Google Ads, affiliate systems and launch content for VPF.'],
      ['MVPs', 3, 'Rapid prototypes: Wellbeing Buddy, a nutrient tracker, RankUp.'],
      ['measurement', 3, 'Performance systems tracking KPIs for 1,000+ resources.'],
      ['change mgmt', 2, 'FinancialForce rollout and the SCHN digital-records placement.'],
      ['UI/UX', 2, 'Designed Wellbeing Buddy\'s experience for Well.AI.'],
      ['exec reporting', 2, 'Quarterly Business Reports and board decks.'],
      ['pricing', 2, 'Pricing models at Well.AI and tiered pricing for Swysh.'],
      ['process', 2, 'Process implementation that cut change-request tickets by 60%.'],
    ],
    numbers: [
      ['$17M', 5, 'Revenue at risk identified by his churn forecasting model.'],
      ['$30M', 5, 'Revenue-recognition opportunities surfaced by his timeline tracker.'],
      ['+43% NPS', 4, 'NPS lift on a program he ran end to end.'],
      ['1,000+', 3, 'Resources tracked by the performance measurement systems he designed.'],
      ['3,000+', 3, 'Projects overseen by the project management system he built.'],
      ['−60%', 3, 'Drop in change-request tickets.'],
      ['4.5 yrs', 3, 'At Highradius, Jul 2021 – Dec 2025.'],
      ['1 live product', 3, 'Visual Product Finder, a live AI Chrome extension.'],
      ['−7 → 34', 2, 'A CSAT metric he turned around.'],
      ['4 roles', 2, 'Intern → Associate BA → Senior Analyst → Principal Analyst.'],
      ['3 marketplaces', 2, 'Amazon US, India and Australia affiliate setup.'],
      ['$0.5M+', 2, 'Client subscription size for the exec sessions he ran.'],
      ['3 awards', 2, 'Award of Applause, Star Team Award, "Highako of the Quarter".'],
    ],
    places: [
      ['Sydney', 5, 'Home now: UNSW, Well.AI and building AI products.'],
      ['Highradius', 5, 'Global SaaS company where he went from intern to Principal Analyst.'],
      ['Hyderabad', 4, 'Where the Highradius years happened.'],
      ['UNSW', 4, 'Master of Commerce (Extension): Business Analytics + Digital Transformation.'],
      ['Chandigarh', 3, 'B.E. Computer Science (AI & ML), 2018–2022.'],
      ['Well.AI', 3, 'Business Growth & Strategy Executive at an early-stage startup.'],
      ['SCHN', 2, 'Sydney Children\'s Hospital Network placement, Summer Term 2027.'],
      ['NSW Health', 2, 'The Single Digital Patient Record transformation program.'],
      ['India', 2, 'Where it started.'],
      ['Australia', 2, 'Where it\'s going.'],
    ],
    tools: [
      ['Claude Code', 5, 'How he builds products and prototypes, including this website.'],
      ['TypeScript', 4, 'VPF\'s Express backend.'],
      ['SQL', 4, 'Day-to-day analytics work.'],
      ['Python', 3, 'Data analysis and modelling.'],
      ['Excel', 3, 'Advanced modelling: margins, capacity, forecasts.'],
      ['Salesforce', 3, 'Platform behind the FinancialForce rollout.'],
      ['Chrome MV3', 3, 'The extension platform VPF runs on.'],
      ['Google Ads', 3, 'Search and video campaigns for VPF.'],
      ['FinancialForce', 2, 'Implementation he directed at Highradius.'],
      ['Express', 2, 'VPF backend framework.'],
      ['Render', 2, 'Where VPF and this site are deployed.'],
      ['React', 2, 'The nutrient-tracking prototype.'],
      ['Apps Script', 2, 'Google Apps Script automations.'],
      ['ElevenLabs', 2, 'AI voice for his content experiments.'],
      ['Google Flow', 2, 'AI video for his content experiments.'],
    ],
    life: [
      ['Punjabi music', 5, 'Always on. Recently saw Karan Aujla live.'],
      ['fitness', 4, 'Gym keeps the brain sharp.'],
      ['Mazda 2', 4, 'The daily driver, and the car in the game above.'],
      ['cars', 3, 'Small car, big opinions.'],
      ['POV videos', 3, 'Self-aware content about the international-student life in Australia.'],
      ['startups', 3, 'Digital business models and platform strategy, always.'],
      ['Karan Aujla', 3, 'Recent concert. Worth it.'],
      ['content', 2, 'Social media creator on the side.'],
      ['app ideas', 2, 'There\'s always another one in the notes app.'],
      ['AI Shorts', 2, 'Car-to-robot transformation Shorts and kids\' animations.'],
    ],
  };

  const BLOCK = /(fuck|shit|bitch|cunt|dick|porn|nigg|fag|slut|whore|retard)/i;
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem('ca_words') || '[]'); } catch {}

  /* ---- live poll (Supabase). The publishable key is meant to be public; row-level security
         only lets visitors read the counts view and insert one short, clean word. ---- */
  const LIVE = { url: 'https://ivacgleyzoxbsdhopbqn.supabase.co', key: 'sb_publishable_RKbMUl2e5MmZvEdBPreN4g_FGLA3k3O' };
  const liveOn = !!LIVE.url;
  let live = null, liveTotal = 0;
  const esc = t => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const H = () => ({ apikey: LIVE.key, Authorization: `Bearer ${LIVE.key}`, 'Content-Type': 'application/json' });
  async function fetchLive() {
    if (!liveOn) return false;
    try {
      const r = await fetch(`${LIVE.url}/rest/v1/word_counts?select=word,n&limit=30`, { headers: H() });
      if (!r.ok) throw new Error(r.status);
      live = await r.json();
      liveTotal = live.reduce((a, w) => a + w.n, 0);
      return true;
    } catch { return false; }
  }
  async function sendLive(word) {
    if (!liveOn) return false;
    try {
      const r = await fetch(`${LIVE.url}/rest/v1/words`, { method: 'POST', headers: { ...H(), Prefer: 'return=minimal' }, body: JSON.stringify({ word }) });
      return r.ok;
    } catch { return false; }
  }

  function wordsFor(key) {
    if (key !== 'you') return DATA[key];
    const list = DATA.you.map(w => [...w]);
    const isMine = w => mine.some(m => m.toLowerCase() === w.toLowerCase());
    if (live) {
      live.forEach(({ word, n }) => {
        const wt = Math.min(6, 2 + Math.round(Math.log2(n + 1)));
        const hit = list.find(w => w[0].toLowerCase() === word);
        const note = `${n} visitor${n > 1 ? 's' : ''} said this.`;
        if (hit) { hit[1] = Math.min(6, Math.max(hit[1], wt) + 1); hit[2] = `${hit[2]} ${note}`; hit[3] = isMine(word); }
        else list.push([word, wt, note, isMine(word)]);
      });
      return list;
    }
    mine.forEach(m => {
      const hit = list.find(w => w[0].toLowerCase() === m.toLowerCase());
      if (hit) hit[1] = Math.min(6, hit[1] + 1);
      else list.push([m, 3, 'Added by you. Thank you!', true]);
    });
    return list;
  }

  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function layout(el, fresh) {
    const key = el.dataset.cloud;
    const W = el.clientWidth, H = el.clientHeight;
    if (!W || !H) return;
    const words = [...wordsFor(key)].sort((a, b) => b[1] - a[1]);
    const base = Math.max(10, Math.min(22, W / 23, H / 11));
    for (let scale = 1.15; scale > 0.5; scale -= 0.07) {
      el.innerHTML = '';
      const placed = [];
      let ok = true;
      words.forEach(([w, wt, note, isMine], i) => {
        const span = document.createElement('button');
        span.type = 'button';
        span.className = `w w${Math.min(5, wt)}${isMine ? ' mine' : ''}${fresh && fresh.toLowerCase() === w.toLowerCase() ? ' pop' : ''}`;
        span.textContent = w;
        span.dataset.note = note;
        const serif = wt >= 5 && document.documentElement.dataset.mode === 'biz' ? 1.3 : 1;
        span.style.fontSize = `${base * scale * serif * (0.75 + Math.min(5, wt) * 0.42)}px`;
        span.style.left = '0px'; span.style.top = '0px';
        el.appendChild(span);
        const bw = span.offsetWidth + 5, bh = span.offsetHeight;
        let spot = null;
        for (let t = 0; t < 420; t += 0.18) {
          const r = 2.4 * t;
          const x = W / 2 + r * Math.cos(t + i) * 1.7 - bw / 2;
          const y = H / 2 + r * Math.sin(t + i) - bh / 2;
          if (x < 0 || y < 0 || x + bw > W || y + bh > H) { if (r > Math.max(W, H)) break; continue; }
          const box = { x, y, w: bw, h: bh };
          if (!placed.some(p => overlaps(p, box))) { spot = box; break; }
        }
        if (!spot) { span.remove(); ok = false; return; }
        placed.push(spot);
        span.style.left = `${spot.x + 3}px`; span.style.top = `${spot.y + 1}px`;
      });
      if (ok) break;
    }
    if (key === 'you') $('#pollCount').textContent = live ? liveTotal : el.children.length;
  }

  const clouds = [...document.querySelectorAll('.cloud')];
  const all = fresh => clouds.forEach(el => layout(el, el.dataset.cloud === 'you' ? fresh : null));

  // hover / tap → story in the card's note line
  clouds.forEach(el => {
    const note = el.closest('.poll').querySelector('.poll-note');
    const def = note.innerHTML;
    const show = e => {
      const w = e.target.closest('.w'); if (!w) return;
      el.querySelectorAll('.w.on').forEach(x => x.classList.remove('on'));
      w.classList.add('on');
      note.innerHTML = `<b>${esc(w.textContent)}</b> · ${esc(w.dataset.note)}`;
    };
    el.addEventListener('pointerover', show);
    el.addEventListener('click', show);
    el.addEventListener('pointerleave', () => { el.querySelectorAll('.w.on').forEach(x => x.classList.remove('on')); note.innerHTML = def; });
  });

  // the poll
  $('#pollForm').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = $('#pollInput');
    const word = (inp.value.trim().split(/\s+/)[0] || '').replace(/[^\p{L}\p{N}'\-]/gu, '').slice(0, 18);
    const note = $('#noteYou');
    if (!word) { note.textContent = 'One word, letters or numbers only.'; return; }
    if (BLOCK.test(word)) { note.textContent = 'Let\'s keep it friendly, try another word.'; inp.value = ''; return; }
    mine.push(word);
    localStorage.setItem('ca_words', JSON.stringify(mine.slice(-12)));
    inp.value = '';
    const btn = $('#pollForm button'); btn.disabled = true;
    const sent = await sendLive(word.toLowerCase());
    if (sent) await fetchLive(); else live = null;
    btn.disabled = false;
    layout($('#cloudYou'), word);
    note.innerHTML = sent
      ? `<b>${esc(word)}</b> · added to the live cloud. Everyone visiting can see it now.`
      : `<b>${esc(word)}</b> · added on this device (live poll is offline right now).`;
    window.CA?.toast?.('💬', `"${esc(word)}" added to the cloud`, sent ? 'Live for every visitor' : 'Saved on this device');
  });

  // live: load shared words, then refresh while the poll is on screen
  if (liveOn) {
    let onScreen = false;
    new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; }).observe($('#cloudYou'));
    const refresh = async () => {
      const before = JSON.stringify(live);
      if (await fetchLive()) {
        $('#noteYou').textContent = `Live poll · ${liveTotal} response${liveTotal === 1 ? '' : 's'} from visitors so far. Add yours.`;
        if (JSON.stringify(live) !== before) layout($('#cloudYou'));
      }
    };
    refresh();
    setInterval(() => { if (onScreen && !document.hidden) refresh(); }, 15000);
  }

  // keep layouts right across resizes, font loads and Suit/Code switches
  let rt; const relayout = () => { clearTimeout(rt); rt = setTimeout(() => all(), 120); };
  addEventListener('resize', relayout);
  document.fonts?.ready.then(relayout);
  new MutationObserver(relayout).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
  all();
})();
