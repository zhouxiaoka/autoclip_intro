(function () {
  const languages = {zh:'zh-CN',en:'en',ja:'ja',ko:'ko',es:'es',pt:'pt-BR',ru:'ru',fr:'fr'};
  const valid = key => Object.prototype.hasOwnProperty.call(GAME_COPY, key);
  const selector = document.getElementById('language');
  function apply(lang) {
    if (!valid(lang)) lang = 'en';
    const copy = GAME_COPY[lang];
    document.documentElement.lang = languages[lang];
    document.querySelectorAll('[data-copy]').forEach(el => { el.textContent = copy[el.dataset.copy]; });
    document.title = copy.label + ' | AutoClip';
    ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'].forEach(q => { document.querySelector(q).content = copy.intro; });
    ['meta[property="og:title"]','meta[name="twitter:title"]'].forEach(q => { document.querySelector(q).content = document.title; });
    selector.value = lang;
    document.querySelectorAll('[data-home-link]').forEach(a => { const url = new URL(a.getAttribute('href'), location.href); url.searchParams.set('lang',lang); a.href = url.href; });
    try { localStorage.setItem('autoclip.lang',lang); } catch (_) {}
  }
  let saved; try { saved = localStorage.getItem('autoclip.lang'); } catch (_) {}
  const requested = new URLSearchParams(location.search).get('lang');
  const detected = (navigator.languages || [navigator.language || 'en']).map(l => l.toLowerCase().split(/[-_]/)[0]).find(valid);
  apply(valid(requested) ? requested : valid(saved) ? saved : detected || 'en');
  selector.addEventListener('change', e => {
    apply(e.target.value);
    const url = new URL(location.href); url.searchParams.set('lang',e.target.value); history.replaceState(null,'',url);
  });
})();
