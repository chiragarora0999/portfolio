/* "Drive through my story": a small hill-driving game. Pass each flag to unlock a chapter. */
(() => {
  const $ = s => document.querySelector(s);
  const game = $('#game'), cv = $('#gameCanvas');
  if (!game || !cv) return;
  const ctx = cv.getContext('2d');

  /* ---------------- story chapters ---------------- */
  const CP_X = [1200, 3000, 4800, 6600, 8400, 10200, 12000];
  const FINISH = CP_X[CP_X.length - 1];
  const STOPS = [
    { when: '2018 · Chandigarh, India', title: 'Boot sequence', place: 'Chandigarh, India',
      text: 'B.E. Computer Science, <b>Artificial Intelligence &amp; Machine Learning</b> at Chandigarh University (2018–2022). I learned how machines learn, and that most real problems aren\'t purely technical.' },
    { when: 'Jul 2021 · Hyderabad, India', title: 'Joins Highradius as an intern', place: 'Hyderabad, India',
      text: 'Business Analyst Intern at a global SaaS company. This is where I found out I liked the place where data meets decisions.' },
    { when: '2021 → 2025 · Highradius', title: 'The climb: four roles', place: 'Hyderabad, India',
      text: 'Intern → Associate Business Analyst → Senior Analyst → <b>Principal Analyst</b>, on a double-promotion trajectory. Churn models ($17M at risk flagged), NPS +43%, board decks, and sessions with the CEO, CTO and Consulting SVP.' },
    { when: 'Feb 2026 · Sydney, Australia', title: 'New city, new chapter', place: 'Sydney, Australia',
      text: '<b>UNSW Master of Commerce (Extension)</b>, specialising in Business Analytics and Digital Transformation. Joined startup <b>Well.AI</b> as Business Growth &amp; Strategy Executive.' },
    { when: '2026 · Solo founder', title: 'Ships Visual Product Finder', place: 'Sydney, Australia',
      text: 'A live AI Chrome extension that identifies products in any image. I ran it end to end: product, backend, an affiliate system across 3 marketplaces, paid ads and launch content.' },
    { when: 'Summer Term 2027 · Up next', title: 'Sydney Children\'s Hospital Network', place: 'Sydney, Australia',
      text: 'Selected for a UNSW industry placement supporting readiness for the <b>Single Digital Patient Record</b>, NSW Health\'s statewide digital transformation.' },
    { when: 'Next stop · ???', title: 'Your team?', place: 'Finish line',
      text: 'Looking for internships &amp; graduate roles in <b>consulting, strategy, product and AI</b>. <a href="#contact">Let\'s talk →</a>' },
  ];

  /* ---------------- terrain ---------------- */
  const hills = x => {
    const k = 0.5 + 0.5 * Math.min(1, x / 10000);
    return -k * (60 * Math.sin(x * 0.004 + 1) + 18 * Math.sin(x * 0.011 + 2) + 90 * Math.sin(x * 0.0021 + 4) + 4 * Math.sin(x * 0.03));
  };
  // kicker ramps: a smooth rise followed by a sharp drop, so you get air
  const RAMPS = [];
  [0, ...CP_X.slice(0, -1)].forEach((c, i) => {
    const h1 = i === 0 ? 26 : 32 + i * 6, h2 = 30 + i * 7;
    RAMPS.push({ x: c + 520, h: h1, len: h1 * 4.6 });
    if (i > 0) RAMPS.push({ x: c + 1250, h: h2, len: h2 * 4.6 });
  });
  const ramps = x => {
    let y = 0;
    for (const r of RAMPS) {
      const u = x - r.x;
      if (u > 0 && u < r.len) { const t = u / r.len; y -= r.h * t * t; }
      else if (u >= r.len && u < r.len + 36) y -= r.h * (1 - (u - r.len) / 36);
    }
    return y;
  };
  const raw = x => hills(x) + ramps(x);
  const PLATEAUS = [0, ...CP_X];
  const PV = PLATEAUS.map(raw);
  function G(x) {
    if (x <= 0) return PV[0];
    if (x >= FINISH) return PV[PV.length - 1];
    let bi = 0, bd = Infinity;
    for (let i = 0; i < PLATEAUS.length; i++) { const d = Math.abs(x - PLATEAUS[i]); if (d < bd) { bd = d; bi = i; } }
    let t = Math.min(1, Math.max(0, (bd - 80) / 280)); t = t * t * (3 - 2 * t);
    return PV[bi] + (raw(x) - PV[bi]) * t;
  }

  /* ---------------- pickups ---------------- */
  let coins = [], cans = [];
  function makePickups() {
    coins = []; cans = [];
    for (let x = 380; x < FINISH - 200; x += 260) {
      if (CP_X.some(c => Math.abs(c - x) < 170)) continue;
      for (let j = 0; j < 3; j++) coins.push({ x: x + j * 32, y: G(x + j * 32) - 52, got: false });
    }
    [0, ...CP_X.slice(0, -1)].forEach(c => { const x = c + 950; cans.push({ x, y: G(x) - 30, got: false }); });
  }

  /* ---------------- vehicles ---------------- */
  const RIDES = {
    car: { L: 64, R: 14, power: 520, brake: 700, rot: 10, roof: 34, vmax: 590 },
    bike: { L: 52, R: 13, power: 560, brake: 760, rot: 13, roof: 40, vmax: 630 },
  };
  let ride = 'car', P = RIDES.car;
  const GRAV = 1500;

  /* ---------------- state ---------------- */
  let W = 0, H = 0, dpr = 1;
  let state = 'menu'; // menu | play | crash | done
  const car = { x: 60, y: 0, vx: 0, vy: 0, s: 0, a: 0, av: 0, ground: true, airRot: 0, wheel: 0 };
  let fuel = 100, coinCount = 0, cpIdx = 0, lastCpX = 60, camX = 0, camY = 0, emptyT = 0, airT = 0;
  const keys = { gas: false, brake: false };
  const dust = [];
  let visible = false;

  let chapters = new Set();
  try { chapters = new Set(JSON.parse(localStorage.getItem('ca_chapters') || '[]')); } catch {}

  const slopeAt = x => Math.atan2(G(x + P.L / 2) - G(x - P.L / 2), P.L);
  const groundY = x => (G(x - P.L / 2) + G(x + P.L / 2)) / 2 - P.R;
  const wrap = a => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

  function place(x) {
    Object.assign(car, { x, s: 0, vx: 0, vy: 0, av: 0, ground: true, airRot: 0 });
    car.a = slopeAt(x); car.y = groundY(x);
    fuel = 100; emptyT = 0;
  }
  function snapCamera() { camX = car.x - W * 0.3; camY = car.y - H * 0.6; }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = game.clientWidth; H = game.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state === 'menu') snapCamera();
  }

  /* ---------------- UI ---------------- */
  const msgEl = $('#gMsg'); let msgTimer;
  function msg(html, ms = 1600) {
    msgEl.innerHTML = html; msgEl.hidden = false;
    clearTimeout(msgTimer);
    if (ms) msgTimer = setTimeout(() => { msgEl.hidden = true; }, ms);
  }
  const unlockEl = $('#gUnlock'); let unlockTimer;
  function showUnlock(i) {
    const s = STOPS[i];
    $('#guWhen').textContent = s.when; $('#guTitle').textContent = s.title; $('#guText').innerHTML = s.text;
    unlockEl.hidden = false; unlockEl.classList.remove('pop'); void unlockEl.offsetWidth; unlockEl.classList.add('pop');
    clearTimeout(unlockTimer); unlockTimer = setTimeout(() => { unlockEl.hidden = true; }, 7000);
  }
  function renderJournal() {
    $('#journal').innerHTML = STOPS.map((s, i) => chapters.has(i)
      ? `<article class="jc open"><span class="jc-n">Chapter ${i + 1}</span><span class="jc-when">${s.when}</span><h3>${s.title}</h3><p>${s.text}</p></article>`
      : `<article class="jc"><span class="jc-n">Chapter ${i + 1}</span><span class="jc-lock">🔒</span><h3>${s.when}</h3><p class="muted">Drive past flag ${i + 1} to unlock.</p></article>`).join('')
      + (chapters.size < STOPS.length ? '' : '');
  }
  function unlockChapter(i, silent) {
    const fresh = !chapters.has(i);
    chapters.add(i);
    localStorage.setItem('ca_chapters', JSON.stringify([...chapters]));
    renderJournal();
    if (!silent) showUnlock(i);
    return fresh;
  }
  const hud = { fuel: $('#gFuel'), coins: $('#gCoins'), dist: $('#gDist'), cp: $('#gCp') };
  let lastHud = '';
  function updateHud() {
    const key = `${Math.round(fuel)}|${coinCount}|${Math.round(car.x / 10)}|${cpIdx}`;
    if (key === lastHud) return; lastHud = key;
    hud.fuel.style.width = `${fuel}%`;
    hud.fuel.classList.toggle('low', fuel < 25);
    hud.coins.textContent = coinCount;
    hud.dist.textContent = `${Math.max(0, Math.round(car.x / 10))} m`;
    hud.cp.textContent = `${cpIdx}/${STOPS.length}`;
  }

  function start() {
    $('#gStart').hidden = true; msgEl.hidden = true;
    state = 'play'; cpIdx = 0; lastCpX = 60; coinCount = 0;
    makePickups(); place(60); snapCamera();
    game.classList.add('playing');
    game.focus({ preventScroll: true });
    msg('Hold <kbd>→</kbd> or <b>GAS</b> to drive', 2200);
  }
  window.CA = Object.assign(window.CA || {}, { startGame: start, _car: car, _slope: x => slopeAt(x) });

  document.querySelectorAll('.ride').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.ride').forEach(x => x.classList.toggle('active', x === b));
    ride = b.dataset.ride; P = RIDES[ride]; place(60); snapCamera();
  }));
  $('#gGo').addEventListener('click', start);
  $('#gSkip').addEventListener('click', () => {
    STOPS.forEach((_, i) => unlockChapter(i, true));
    $('#journal').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  msgEl.addEventListener('click', e => {
    if (e.target.closest('[data-act="again"]')) { start(); }
  });

  /* ---------------- input ---------------- */
  const GAS = ['ArrowRight', 'ArrowUp', 'd', 'D', 'w', 'W'], BRK = ['ArrowLeft', 'ArrowDown', 'a', 'A', 's', 'S'];
  const active = () => state === 'play' && visible && !document.querySelector('#termOverlay:not([hidden])');
  addEventListener('keydown', e => {
    if (!active() || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    if (GAS.includes(e.key)) { keys.gas = true; e.preventDefault(); }
    if (BRK.includes(e.key)) { keys.brake = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => {
    if (GAS.includes(e.key)) keys.gas = false;
    if (BRK.includes(e.key)) keys.brake = false;
  });
  addEventListener('blur', () => { keys.gas = keys.brake = false; });
  const pedal = (el, k) => {
    const on = e => { e.preventDefault(); keys[k] = true; el.classList.add('down'); if (state === 'menu') start(); };
    const off = () => { keys[k] = false; el.classList.remove('down'); };
    el.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, off));
    el.addEventListener('contextmenu', e => e.preventDefault());
  };
  pedal($('#pGas'), 'gas'); pedal($('#pBrake'), 'brake');

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (!visible) keys.gas = keys.brake = false; }, { threshold: 0.35 }).observe(game);

  /* ---------------- physics ---------------- */
  function crash(text) {
    if (state !== 'play') return;
    state = 'crash'; crashT = 1.4;
    msg(text, 0);
  }
  let crashT = 0;

  function step(dt) {
    if (state === 'crash') {
      crashT -= dt;
      if (crashT <= 0) { place(lastCpX + 40); state = 'play'; msgEl.hidden = true; }
      return;
    }
    const playing = state === 'play';
    const gasOn = playing && keys.gas && fuel > 0;
    const brk = playing && keys.brake;
    if (playing) fuel = Math.max(0, fuel - (gasOn ? 7.5 : 0.5 * (Math.abs(car.s) > 20)) * dt);

    if (car.ground) {
      const a = slopeAt(car.x);
      let acc = GRAV * 0.55 * Math.sin(a);
      if (gasOn) acc += P.power;
      if (brk) acc -= car.s > 5 ? P.brake : P.power * 0.45;
      if (state === 'done') acc -= car.s > 0 ? 500 : 0;
      car.s += acc * dt;
      car.s *= 1 - (gasOn || brk ? 0.1 : 0.45) * dt;
      car.s = Math.max(-240, Math.min(P.vmax, car.s));
      if (state === 'done' && car.s < 0) car.s = 0;
      const nx = Math.max(-140, car.x + car.s * Math.cos(a) * dt);
      if (nx === -140 && car.s < 0) car.s = 0;
      const ny = groundY(nx);
      const vy = car.s * Math.sin(a), vx = car.s * Math.cos(a);
      const by = car.y + vy * dt + 0.5 * GRAV * dt * dt;
      if (ny > by + 1.5 && car.s > 120) {
        // launch along the ramp the rear wheel is on, so lips actually throw you
        const ar = Math.min(a, Math.atan2(G(car.x) - G(car.x - P.L / 2), P.L / 2));
        Object.assign(car, { ground: false, vx: car.s * Math.cos(ar), vy: car.s * Math.sin(ar), av: 0, airRot: 0, a: ar, x: nx, y: by });
        airT = 0;
      } else {
        car.x = nx; car.y = ny; car.a = slopeAt(nx);
      }
      car.wheel += car.s * dt / P.R;
      if (gasOn && Math.abs(car.s) > 60 && Math.random() < 0.6) {
        const c = Math.cos(car.a), sn = Math.sin(car.a);
        dust.push({ x: car.x - c * P.L / 2, y: car.y - sn * P.L / 2 + P.R, vx: -60 - Math.random() * 80, vy: -40 - Math.random() * 60, life: 0.6 });
      }
    } else {
      airT += dt;
      car.vy += GRAV * dt; car.x += car.vx * dt; car.y += car.vy * dt;
      if (gasOn) car.av -= P.rot * dt;
      if (brk) car.av += P.rot * dt;
      car.av *= 1 - 0.5 * dt;
      car.a += car.av * dt; car.airRot += car.av * dt;
      car.wheel += (gasOn ? 30 : 8) * dt;
      const c = Math.cos(car.a), sn = Math.sin(car.a);
      const roofX = car.x + sn * P.roof, roofY = car.y - c * P.roof;
      if (airT < 0.07) return;
      if (roofY >= G(roofX)) return crash('💥 Flipped! Back to the last flag…');
      const rx = car.x - c * P.L / 2, ry = car.y - sn * P.L / 2, fx = car.x + c * P.L / 2, fy = car.y + sn * P.L / 2;
      const pen = Math.max(ry + P.R - G(rx), fy + P.R - G(fx));
      if (pen > 0 && car.vy < 0) { car.y -= pen; return; } // still rising off a lip: ride over it
      if (pen >= 0) {
        const ga = slopeAt(car.x), diff = wrap(car.a - ga);
        if (Math.abs(diff) > 1.25) return crash('💥 Rough landing! Back to the last flag…');
        car.ground = true;
        car.s = (car.vx * Math.cos(ga) + car.vy * Math.sin(ga)) * (1 - Math.min(0.5, Math.abs(diff) * 0.45));
        car.a = ga; car.y = groundY(car.x); car.av = 0;
        const flips = Math.floor(Math.abs(car.airRot) / (2 * Math.PI) + 0.1);
        if (flips > 0 && playing) { coinCount += 25 * flips; msg(`🔄 ${flips > 1 ? flips + '× ' : ''}Flip! +${25 * flips}`, 1300); }
        else if (airT > 0.9 && playing) { coinCount += 10; msg('🪂 Big air! +10', 1100); }
      }
    }

    if (!playing) return;
    // pickups
    for (const k of coins) if (!k.got && Math.abs(k.x - car.x) < 30 && Math.abs(k.y - (car.y - 16)) < 42) { k.got = true; coinCount++; }
    for (const k of cans) if (!k.got && Math.abs(k.x - car.x) < 34 && Math.abs(k.y - car.y) < 50) { k.got = true; fuel = 100; msg('⛽ Refuelled', 900); }
    // checkpoints
    while (cpIdx < CP_X.length && car.x >= CP_X[cpIdx]) {
      unlockChapter(cpIdx); lastCpX = CP_X[cpIdx]; cpIdx++; fuel = Math.max(fuel, 45);
      if (cpIdx === CP_X.length) finish();
    }
    // out of fuel
    if (fuel <= 0 && car.ground && Math.abs(car.s) < 15) {
      emptyT += dt;
      if (emptyT > 1.2) crash('⛽ Out of fuel! Back to the last flag…');
    } else emptyT = 0;
  }

  function finish() {
    state = 'done'; keys.gas = keys.brake = false;
    window.CA?.unlock?.('road');
    window.CA?.confetti?.(200);
    msg(`<b class="gm-big">🏁 You made it!</b><span>${coinCount} coins · all ${STOPS.length} chapters unlocked</span>
      <span class="gm-row"><a class="btn btn-primary btn-sm" href="#contact">Next stop: your team →</a><button class="btn btn-ghost btn-sm" data-act="again">Drive again</button></span>`, 0);
  }

  /* ---------------- drawing ---------------- */
  const SKY = [ // x, top, bottom
    [0, [236, 226, 207], [246, 240, 228]],        // Chandigarh dawn
    [CP_X[1] - 600, [219, 205, 214], [241, 228, 222]], // Hyderabad dusk
    [CP_X[3] - 700, [196, 214, 226], [234, 239, 240]], // Sydney day
    [CP_X[5] + 300, [196, 214, 226], [234, 239, 240]],
    [FINISH, [31, 36, 52], [74, 70, 88]],          // finish night
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
  function skyAt(x) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const [x0, t0, b0] = SKY[i], [x1, t1, b1] = SKY[i + 1];
      if (x <= x1) { const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0))); const e = t * t * (3 - 2 * t); return [mix(t0, t1, e), mix(b0, b1, e)]; }
    }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
  }
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const zoneOf = x => x < CP_X[1] - 500 ? 0 : x < CP_X[3] - 500 ? 1 : x < FINISH - 400 ? 2 : 3;
  const ZONE_NAME = ['Chandigarh, India', 'Hyderabad, India', 'Sydney, Australia', 'Finish line'];
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  function drawBackground() {
    const [top, bot] = skyAt(car.x);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const night = car.x > FINISH - 1200 ? Math.min(1, (car.x - (FINISH - 1200)) / 1000) : 0;
    // sun / moon
    ctx.fillStyle = night > .5 ? 'rgba(240,232,210,.9)' : 'rgba(255,245,225,.85)';
    ctx.beginPath(); ctx.arc(W * 0.78, H * 0.22, 34, 0, Math.PI * 2); ctx.fill();
    if (night > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.7 * night})`;
      for (let i = 0; i < 60; i++) ctx.fillRect((hash(i) * W * 1.3 - camX * 0.02) % W, hash(i + 99) * H * 0.5, 1.5, 1.5);
    }
    // far hills (parallax .12)
    const tint = (a) => night > .5 ? `rgba(20,22,32,${a})` : `rgba(60,58,52,${a})`;
    ctx.fillStyle = tint(0.10);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let sx = 0; sx <= W + 20; sx += 20) {
      const wx = sx + camX * 0.12;
      ctx.lineTo(sx, H * 0.55 + Math.sin(wx * 0.004) * 40 + Math.sin(wx * 0.011) * 14);
    }
    ctx.lineTo(W, H); ctx.fill();
    // mid silhouettes (parallax .35)
    const par = 0.35, tile = 120;
    ctx.fillStyle = tint(0.16);
    const baseY = H * 0.7;
    const t0 = Math.floor((camX * par) / tile) - 1, t1 = t0 + Math.ceil(W / tile) + 2;
    for (let t = t0; t <= t1; t++) {
      const sx = t * tile - camX * par;
      const worldX = (t * tile) / par; // approx world position of this tile
      const z = zoneOf(worldX), r = hash(t);
      if (z === 0) { // trees & fields
        const h = 30 + r * 40;
        ctx.fillRect(sx + 40, baseY - h, 5, h);
        ctx.beginPath(); ctx.arc(sx + 42, baseY - h, 18 + r * 10, 0, Math.PI * 2); ctx.fill();
        if (r > .5) { ctx.beginPath(); ctx.arc(sx + 90, baseY - 20, 14, 0, Math.PI * 2); ctx.fill(); }
      } else if (z === 1) { // city blocks with domes
        const h = 50 + r * 110, w = 46 + hash(t + 7) * 40;
        ctx.fillRect(sx, baseY - h, w, h);
        if (r > .7) { ctx.beginPath(); ctx.arc(sx + w / 2, baseY - h, w / 2.4, Math.PI, 0); ctx.fill(); ctx.fillRect(sx + w / 2 - 2, baseY - h - w / 2.4 - 14, 4, 14); }
      } else if (z === 2) { // harbour city: towers, arch bridge, sails
        const m = ((t % 9) + 9) % 9;
        if (m === 0) { // arch bridge
          ctx.save(); ctx.strokeStyle = tint(0.2); ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(sx + 120, baseY + 40, 110, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
          ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + 10, baseY - 22); ctx.lineTo(sx + 230, baseY - 22); ctx.stroke(); ctx.restore();
        } else if (m === 4) { // sail-roof building
          for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(sx + k * 24, baseY); ctx.quadraticCurveTo(sx + k * 24 + 10, baseY - 60 + k * 8, sx + k * 24 + 40, baseY - 70 + k * 12); ctx.lineTo(sx + k * 24 + 40, baseY); ctx.fill(); }
        } else if (m !== 1) { const h = 40 + r * 140; ctx.fillRect(sx + 10, baseY - h, 34 + r * 20, h); }
      }
      ctx.fillRect(sx, baseY, tile + 1, H - baseY);
    }
  }

  function drawGround() {
    const step = 6;
    ctx.beginPath(); ctx.moveTo(-10, H + 10);
    for (let sx = -10; sx <= W + step; sx += step) ctx.lineTo(sx, G(camX + sx) - camY);
    ctx.lineTo(W + step, H + 10); ctx.closePath();
    const zone = zoneOf(car.x);
    const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
    if (zone === 3) { g.addColorStop(0, '#3b3a44'); g.addColorStop(1, '#1d1d24'); }
    else { g.addColorStop(0, '#b9a07a'); g.addColorStop(1, '#7a6247'); }
    ctx.fillStyle = g; ctx.fill();
    // grass / edge
    ctx.beginPath();
    for (let sx = -10; sx <= W + step; sx += step) { const y = G(camX + sx) - camY; sx === -10 ? ctx.moveTo(sx, y) : ctx.lineTo(sx, y); }
    ctx.strokeStyle = zone === 3 ? '#c8a86b' : '#6f8460'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawFlags() {
    CP_X.forEach((x, i) => {
      const sx = x - camX; if (sx < -100 || sx > W + 100) return;
      const gy = G(x) - camY, got = i < cpIdx || (state === 'menu' && chapters.has(i));
      const last = i === CP_X.length - 1;
      ctx.fillStyle = '#2a2b30'; ctx.fillRect(sx - 1.5, gy - 86, 3, 86);
      if (last) { // checkered banner
        for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { ctx.fillStyle = (r + c) % 2 ? '#15161a' : '#f6f5f1'; ctx.fillRect(sx + 1.5 + c * 8, gy - 86 + r * 8, 8, 8); }
      } else {
        ctx.fillStyle = got ? '#c8a86b' : '#15161a';
        ctx.beginPath(); ctx.moveTo(sx + 1.5, gy - 86); ctx.lineTo(sx + 44, gy - 76); ctx.lineTo(sx + 1.5, gy - 64); ctx.fill();
        ctx.fillStyle = got ? '#15161a' : '#f6f5f1'; ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.fillText(String(i + 1), sx + 10, gy - 72);
      }
      ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(21,22,26,.75)';
      if (zoneOf(x) === 3) ctx.fillStyle = 'rgba(246,245,241,.85)';
      ctx.textAlign = 'center'; ctx.fillText(STOPS[i].when.split(' · ')[0], sx, gy - 96); ctx.textAlign = 'left';
    });
  }

  function drawPickups() {
    for (const k of coins) {
      if (k.got) continue; const sx = k.x - camX, sy = k.y - camY; if (sx < -20 || sx > W + 20) continue;
      ctx.fillStyle = '#c8a86b'; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8c6d3f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.stroke();
    }
    for (const k of cans) {
      if (k.got) continue; const sx = k.x - camX, sy = k.y - camY; if (sx < -30 || sx > W + 30) continue;
      ctx.fillStyle = '#9e1b2a'; roundRect(sx - 11, sy - 14, 22, 28, 4); ctx.fill();
      ctx.fillStyle = '#f6f5f1'; ctx.font = '700 11px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('F', sx, sy + 4); ctx.textAlign = 'left';
      ctx.fillStyle = '#2a2b30'; ctx.fillRect(sx - 4, sy - 18, 8, 4);
    }
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function wheel(x, y, r) {
    ctx.fillStyle = '#1b1c20'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfc9bc'; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1b1c20'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const a = car.wheel + k * 2.094; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); ctx.stroke(); }
  }
  function drawVehicle() {
    const sx = car.x - camX, sy = car.y - camY, L = P.L, R = P.R;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(car.a);
    if (ride === 'car') {
      // body
      ctx.fillStyle = '#9e1b2a';
      ctx.beginPath();
      ctx.moveTo(-L / 2 - 14, -4); ctx.lineTo(-L / 2 - 14, -20); ctx.quadraticCurveTo(-L / 2 - 12, -26, -L / 2 + 2, -27);
      ctx.lineTo(-L / 2 + 12, -44); ctx.quadraticCurveTo(-4, -50, 14, -44); ctx.lineTo(L / 2 - 2, -28);
      ctx.quadraticCurveTo(L / 2 + 16, -26, L / 2 + 17, -14); ctx.lineTo(L / 2 + 16, -4); ctx.closePath(); ctx.fill();
      // windows
      ctx.fillStyle = 'rgba(30,34,42,.85)';
      ctx.beginPath(); ctx.moveTo(-L / 2 + 8, -29); ctx.lineTo(-L / 2 + 15, -41); ctx.lineTo(-6, -43); ctx.lineTo(-6, -29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, -29); ctx.lineTo(-2, -43); ctx.lineTo(11, -41); ctx.lineTo(L / 2 - 8, -29); ctx.fill();
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(L / 2 + 11, -22, 5, 5);
      ctx.fillStyle = '#ff5a4f'; ctx.fillRect(-L / 2 - 14, -21, 3, 6);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-L / 2 - 8, -24, L + 16, 2);
      wheel(-L / 2, 0, R); wheel(L / 2, 0, R);
    } else {
      wheel(-L / 2, 0, R); wheel(L / 2, 0, R);
      ctx.strokeStyle = '#2a2b30'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(-6, -18); ctx.lineTo(14, -18); ctx.lineTo(L / 2, 0); ctx.stroke();
      ctx.strokeStyle = '#c8a86b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(10, -22); ctx.stroke();
      ctx.strokeStyle = '#2a2b30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -18); ctx.lineTo(20, -30); ctx.stroke();
      // rider
      ctx.strokeStyle = '#15161a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-4, -22); ctx.lineTo(2, -40); ctx.lineTo(18, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -22); ctx.lineTo(6, -10); ctx.stroke();
      ctx.fillStyle = '#9e1b2a'; ctx.beginPath(); ctx.arc(4, -48, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(30,34,42,.85)'; ctx.fillRect(6, -51, 6, 4);
    }
    ctx.restore();
  }
  function drawDust(dt) {
    for (let i = dust.length - 1; i >= 0; i--) {
      const p = dust[i]; p.life -= dt; if (p.life <= 0) { dust.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
      ctx.fillStyle = `rgba(150,130,100,${p.life})`; ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, 4 + (0.6 - p.life) * 10, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawPlace() {
    const name = ZONE_NAME[zoneOf(car.x)];
    ctx.font = '600 12px "JetBrains Mono", monospace';
    const w = ctx.measureText(name).width + 34;
    ctx.fillStyle = 'rgba(21,22,26,.72)'; roundRect(W / 2 - w / 2, H - 40, w, 26, 13); ctx.fill();
    ctx.fillStyle = '#f6f5f1'; ctx.textAlign = 'center'; ctx.fillText('📍 ' + name, W / 2, H - 23); ctx.textAlign = 'left';
  }

  /* ---------------- loop ---------------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (visible && !document.hidden) {
      if (state !== 'menu') {
        // sub-step for stability
        const n = 3; for (let i = 0; i < n; i++) step(dt / n);
        const k = 1 - Math.exp(-6 * dt);
        camX += (car.x - W * 0.3 - camX) * k;
        camY += (car.y - H * 0.6 - camY) * k;
      }
      drawBackground(); drawGround(); drawFlags(); drawPickups(); drawDust(dt); drawVehicle(); drawPlace();
      updateHud();
    }
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  makePickups(); place(60); resize(); renderJournal();
  requestAnimationFrame(frame);
})();
