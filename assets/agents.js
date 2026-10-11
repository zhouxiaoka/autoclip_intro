/* /agents: install tabs, copy buttons and consent-gated agents_* events. */
(() => {
  'use strict';
  const track = (event, details) => { try { window.AutoClipAnalytics?.capture(event, details); } catch {} };
  const copy = () => (window.INNER_COPY || {})[document.documentElement.lang.startsWith('zh') ? 'zh' : 'en'] || {};
  const buttons = [...document.querySelectorAll('#install .dev li button[data-client]')];
  const terms = [...document.querySelectorAll('#install .term[data-client]')];
  let current = buttons[0]?.dataset.client;
  function select(client, user) {
    current = client;
    for (const b of buttons) { const on = b.dataset.client === client; b.closest('li').classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
    for (const t of terms) t.hidden = t.dataset.client !== client;
    if (user) track('agents_tab_switch', {client});
  }
  buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.client, true)));
  const btn = document.querySelector('#install .copy-btn');
  btn?.addEventListener('click', async () => {
    const term = terms.find(t => t.dataset.client === current);
    if (!term) return;
    // Copy the commands/config only: drop comment lines and the "$ " prompt.
    const text = [...term.childNodes].filter(n => !(n.nodeType === 1 && n.classList.contains('c')) && !(n.nodeType === 1 && n.classList.contains('p')))
      .map(n => n.textContent).join('').split('\n').map(l => l.trimEnd()).filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(text); } catch { return; }
    track('agents_install_copy', {client: current});
    const label = copy().copied || 'Copied';
    btn.textContent = label;
    setTimeout(() => { btn.textContent = copy().copy || 'Copy'; }, 1600);
  });
  document.addEventListener('click', event => {
    const a = event.target.closest?.('a[data-gh]');
    if (a) track('agents_github_click', {position: a.dataset.gh});
  }, true);

  // Style samples: hover/focus plays, tap toggles, in-view autoplay unless reduced motion.
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const tiles = [...document.querySelectorAll('#styles .sty')];
  const label = () => { const c = copy(); tiles.forEach((t, i) => { const v = c[`s${i + 1}.v`]; if (v) t.setAttribute('aria-label', v); }); };
  label();
  for (const tile of tiles) {
    const video = tile.querySelector('video');
    if (!video) continue;
    let pinned = false; let visible = false;
    const play = () => { video.preload = 'auto'; const r = video.play(); r?.catch?.(() => {}); tile.classList.add('playing'); };
    const stop = () => { video.pause(); tile.classList.remove('playing'); };
    const sync = () => (pinned || (visible && !reduce?.matches)) ? play() : stop();
    tile.addEventListener('mouseenter', play);
    tile.addEventListener('mouseleave', sync);
    tile.addEventListener('focus', play);
    tile.addEventListener('blur', sync);
    const toggle = () => { pinned = !pinned; tile.setAttribute('aria-pressed', String(pinned)); pinned ? play() : stop(); if (pinned) track('agents_style_play', {style: tile.dataset.style}); };
    tile.addEventListener('click', toggle);
    tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting && e.intersectionRatio >= .6; sync(); }, {threshold: [0, .6]}).observe(tile);
    reduce?.addEventListener?.('change', sync);
  }
  // analytics.js loads after this file; send the page event once it exists.
  window.addEventListener('load', () => track('agents_page_view'));
})();
