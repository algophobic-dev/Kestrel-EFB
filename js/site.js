// Kestrel EFB website. Small page behaviours; every page works without this file.
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Parts of each section rise in as they enter the screen.
const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('[data-rise], .stage').forEach(el => seen.observe(el));

// Feature switches
$$('.switch').forEach(sw => sw.addEventListener('click', () => {
  const on = sw.getAttribute('aria-checked') !== 'true';
  sw.setAttribute('aria-checked', on); sw.closest('.band').classList.toggle('on', on);
}));

// Stages slider
const range = $('#stage-range');
if (range) {
  const stages = $$('#stage-data > div').map(d => ({ name: d.dataset.name, h: d.dataset.h, p: d.dataset.p, fill: d.dataset.fill }));
  const h = $('#stage-h'), p = $('#stage-p'), say = $('.stages .say'), imgs = $$('.stages .see img'), names = $$('.stages .names button'), fill = $('.stages .track i');
  const show = (i, instant) => {
    range.value = i; fill.style.setProperty('--pos', (i / (stages.length - 1) * 100) + '%');
    range.setAttribute('aria-valuetext', stages[i].name);
    imgs.forEach((im, k) => im.classList.toggle('on', k === i)); names.forEach((b, k) => b.classList.toggle('on', k === i));
    const set = () => { h.textContent = stages[i].h; p.textContent = stages[i].p; say.style.background = `var(${stages[i].fill})`; h.style.opacity = p.style.opacity = 1; };
    if (instant) return set();
    h.style.opacity = p.style.opacity = 0; setTimeout(set, 200);
  };
  range.addEventListener('input', () => show(+range.value));
  names.forEach((b, k) => b.addEventListener('click', () => show(k)));
  show(0, true);
}

// Type a route: live weather and distance from the National Weather Service.
const input = $('#route');
if (input) {
  const out = $('#answer'), cache = new Map();
  const CAT = { VFR: 'var(--vfr)', MVFR: 'var(--mvfr)', IFR: 'var(--ifr)', LIFR: 'var(--lifr)' };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const nws = async path => { const r = await fetch('https://api.weather.gov' + path, { headers: { Accept: 'application/geo+json' } }); if (!r.ok) throw new Error(r.status); return r.json(); };
  const station = id => {
    if (!cache.has(id)) cache.set(id, Promise.all([nws(`/stations/${id}`), nws(`/stations/${id}/observations/latest`).catch(() => null)])
      .then(([s, o]) => ({ id, name: s.properties.name, lon: s.geometry.coordinates[0], lat: s.geometry.coordinates[1], obs: o?.properties })).catch(() => null));
    return cache.get(id);
  };
  function category(o) {
    const vis = o.visibility?.value != null ? o.visibility.value / 1609.34 : null;
    const ceil = Math.min(...(o.cloudLayers || []).filter(c => ['BKN', 'OVC', 'VV'].includes(c.amount) && c.base?.value != null).map(c => c.base.value * 3.28084), Infinity);
    if (vis == null && ceil === Infinity) return null;
    const v = vis ?? 99;
    return ceil < 500 || v < 1 ? 'LIFR' : ceil < 1000 || v < 3 ? 'IFR' : ceil <= 3000 || v <= 5 ? 'MVFR' : 'VFR';
  }
  function card(s) {
    const c = el('div', 'stn'), o = s.obs, head = el('div', 'id'); head.append(el('span', '', s.id));
    const cat = o && category(o); if (cat) { const b = el('span', 'cat', cat); b.style.background = CAT[cat]; head.append(b); }
    c.append(head, el('div', 'name', s.name));
    if (!o) { c.append(el('div', 'raw', 'No current report from this station.')); return c; }
    const dl = el('dl'), row = (k, v) => { if (v != null) dl.append(el('dt', '', k), el('dd', '', v)); };
    const kt = o.windSpeed?.value != null ? Math.round(o.windSpeed.value / 1.852) : null;
    row('Wind', kt == null ? null : kt === 0 ? 'Calm' : `${String(Math.round(o.windDirection?.value ?? 0)).padStart(3, '0')}° at ${kt} kt`);
    row('Visibility', o.visibility?.value != null ? `${Math.min(10, +(o.visibility.value / 1609.34).toFixed(1))} sm` : null);
    row('Temperature', o.temperature?.value != null ? `${Math.round(o.temperature.value)}°C` : null);
    row('Altimeter', o.barometricPressure?.value != null ? `${(o.barometricPressure.value / 3386.39).toFixed(2)} inHg` : null);
    c.append(dl); if (o.rawMessage) c.append(el('div', 'raw', o.rawMessage));
    return c;
  }
  const rad = d => d * Math.PI / 180;
  function leg(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon), x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    const nm = 2 * 3440.065 * Math.asin(Math.sqrt(x));
    const brg = (Math.atan2(Math.sin(dLon) * Math.cos(rad(b.lat)), Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLon)) * 180 / Math.PI + 360) % 360;
    const min = Math.round(nm / 110 * 60), d = el('div', 'leg');
    d.append(el('div', 'big', `${Math.round(nm).toLocaleString()} nm`), el('div', 'soft', `${a.id} to ${b.id}, direct. Course ${String(Math.round(brg)).padStart(3, '0')}° true. About ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min at 110 knots.`));
    return d;
  }
  let run = 0, timer;
  async function update() {
    const ids = [...new Set(input.value.toUpperCase().match(/\b[A-Z][A-Z0-9]{3}\b/g) || [])].slice(0, 2), mine = ++run;
    if (!ids.length) { out.replaceChildren(el('p', 'soft', 'Enter one or two US airport identifiers, such as KBJC KASE.')); return; }
    out.setAttribute('aria-busy', 'true');
    const got = await Promise.all(ids.map(station)); if (mine !== run) return;
    out.removeAttribute('aria-busy');
    const ok = got.filter(Boolean), missing = ids.filter((id, i) => !got[i]), kids = [];
    if (ok.length === 2) kids.push(leg(ok[0], ok[1]));
    ok.forEach(s => kids.push(card(s)));
    if (missing.length) kids.push(el('p', 'soft', `No weather station found for ${missing.join(' or ')}. Use a four-letter identifier that starts with K, such as KDEN.`));
    out.replaceChildren(...kids);
  }
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 450); });
  $$('.examples button').forEach(b => b.addEventListener('click', () => { input.value = b.textContent; update(); input.focus(); }));
  $('#route-form').addEventListener('submit', e => { e.preventDefault(); update(); });
  update();
}
