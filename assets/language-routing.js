/* Explicit language choices use the matching static page. Automatic detection never redirects crawlers. */
(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const routes = new Set(['', 'cases/', 'use-cases/podcast/', 'use-cases/course/', 'use-cases/gameplay/', 'features/publish/', 'features/auto-cover/', 'guides/first-clips/', 'guides/podcast-to-shorts/', 'guides/local-vs-cloud/', 'cases/jensen-dwarkesh/', 'cases/tim-luoyonghao/', 'cases/autoclip-first-run/', 'blog/', 'blog/what-drives-views/', 'blog/what-drives-views/sources/']);
  function path(url) {
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
    return url.pathname.slice(root.pathname.length).replace(/^en\//, '').replace(/index\.html$/, '');
  }
  function localized(url, language) {
    const page = path(url);
    if (page === null || !routes.has(page) || !['zh', 'en'].includes(language)) return url;
    url.pathname = root.pathname + (language === 'en' ? 'en/' : '') + page;
    url.searchParams.delete('lang');
    return url;
  }
  window.AutoClipLocale = Object.freeze({localized, html(markup) {
    const language = document.documentElement.dataset.staticLanguage || 'zh';
    const source = new URL(document.documentElement.dataset.sourcePath || '', root);
    const fragment = document.createElement('template'); fragment.innerHTML = markup;
    fragment.content.querySelectorAll('a[href]').forEach(a => { a.href = localized(new URL(a.getAttribute('href'),source),language).href; });
    return fragment.innerHTML;
  }});
  const current = new URL(location.href);
  const requested = current.searchParams.get('lang');
  if (['zh', 'en'].includes(requested)) {
    const target = localized(new URL(current), requested);
    if (target.pathname !== current.pathname) { location.replace(target.href); return; }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('language');
    selector?.addEventListener('change', event => {
      if (!['zh', 'en'].includes(event.target.value)) return;
      const target = localized(new URL(location.href), event.target.value);
      if (target.pathname === location.pathname) return;
      event.stopImmediatePropagation();
      try { localStorage.setItem('autoclip.lang', event.target.value); } catch {}
      location.assign(target.href);
    }, true);
  });
})();
