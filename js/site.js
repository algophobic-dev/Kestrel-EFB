// Kestrel EFB website. Small page behaviours; every page works without this file.
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Parts of each section rise in as they enter the screen.
const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('[data-rise], .stage').forEach(el => seen.observe(el));

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

// Weather for a flight: distance and current weather for two airports, worldwide, from aviationweather.gov through the app's relay.
const form = $('#route-form');
if (form) {
  const RELAY = 'https://kestrel-relay.kestrelefb.workers.dev';
  const from = $('#from'), to = $('#to'), out = $('#answer');
  const CAT = { VFR: 'var(--vfr)', MVFR: 'var(--mvfr)', IFR: 'var(--ifr)', LIFR: 'var(--lifr)' };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function card(m) {
    const c = el('div', 'stn'), head = el('div', 'id'); head.append(el('span', '', m.icaoId));
    if (CAT[m.fltCat]) { const b = el('span', 'cat', m.fltCat); b.style.background = CAT[m.fltCat]; head.append(b); }
    c.append(head, el('div', 'name', (m.name || '').replace(/, [A-Z]{2}, [A-Z]{2}$|, [A-Z]{2}$/, '')));
    const dl = el('dl'), row = (k, v) => { if (v != null) dl.append(el('dt', '', k), el('dd', '', v)); };
    row('Wind', m.wspd == null ? null : m.wspd === 0 ? 'Calm' : `${m.wdir === 'VRB' ? 'Variable' : String(m.wdir).padStart(3, '0') + '°'} at ${m.wspd} kt${m.wgst ? `, gusts ${m.wgst}` : ''}`);
    row('Visibility', m.visib == null ? null : typeof m.visib === 'number' ? `${m.visib >= 3 ? Math.round(m.visib) : +m.visib.toFixed(1)} sm` : `${m.visib} sm`);
    row('Temperature', m.temp != null ? `${Math.round(m.temp)}°C` : null);
    row('Altimeter', m.altim != null ? `${(m.altim / 33.8639).toFixed(2)} inHg · ${Math.round(m.altim)} hPa` : null);
    c.append(dl); if (m.rawOb) c.append(el('div', 'raw', m.rawOb.replace(/^(METAR|SPECI) /, '')));
    return c;
  }
  const rad = d => d * Math.PI / 180;
  function leg(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon), x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    const nm = 2 * 3440.065 * Math.asin(Math.sqrt(x));
    const brg = (Math.atan2(Math.sin(dLon) * Math.cos(rad(b.lat)), Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLon)) * 180 / Math.PI + 360) % 360;
    const min = Math.round(nm / 110 * 60), d = el('div', 'leg');
    d.append(el('div', 'big', `${Math.round(nm).toLocaleString()} nm`), el('div', 'soft', `${a.icaoId} to ${b.icaoId}, direct. Course ${String(Math.round(brg)).padStart(3, '0')}° true. About ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min at 110 knots.`));
    return d;
  }
  let run = 0;
  async function update() {
    const ids = [from.value, to.value].map(v => v.trim().toUpperCase()).filter(Boolean), mine = ++run;
    if (!ids.length) { out.replaceChildren(el('p', 'soft', 'Enter an airport code in From and To, then select Show weather.')); return; }
    const bad = ids.filter(id => !/^[A-Z0-9]{4}$/.test(id));
    if (bad.length) { out.replaceChildren(el('p', 'soft', `${bad.join(' and ')}: use a four-letter ICAO code, such as KDEN or EGLL.`)); return; }
    out.replaceChildren(el('p', 'soft', 'Loading weather.')); out.setAttribute('aria-busy', 'true');
    let list = [];
    try { const r = await fetch(`${RELAY}/metar?ids=${[...new Set(ids)].join(',')}`); if (!r.ok) throw 0; list = await r.json(); }
    catch { if (mine === run) { out.removeAttribute('aria-busy'); out.replaceChildren(el('p', 'soft', 'Weather did not load. Check your connection and try again.')); } return; }
    if (mine !== run) return;
    out.removeAttribute('aria-busy');
    const got = ids.map(id => list.find(m => m.icaoId === id)), kids = [];
    if (got[0] && got[1] && ids[0] !== ids[1]) kids.push(leg(got[0], got[1]));
    got.forEach(m => m && kids.push(card(m)));
    const missing = ids.filter((id, i) => !got[i]);
    if (missing.length) kids.push(el('p', 'soft', `No current weather report for ${missing.join(' or ')}. Check the code, or try a larger airport nearby.`));
    out.replaceChildren(...kids);
  }
  form.addEventListener('submit', e => { e.preventDefault(); update(); });
  $$('.examples button').forEach(b => b.addEventListener('click', () => { [from.value, to.value] = b.textContent.split(' '); update(); }));
  update();
}
