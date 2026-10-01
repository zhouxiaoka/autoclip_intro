/* Explicit, consent-gated website events. No SDK, replay, autocapture or app identity. */
(() => {
  'use strict';
  if (window.AutoClipAnalytics) return;
  const config = window.AUTOCLIP_ANALYTICS_CONFIG || {};
  const root = new URL('../', document.currentScript.src);
  const prefix = 'autoclip.website.analytics.';
  const pages = new Set(['', 'cases/', 'use-cases/podcast/', 'use-cases/course/', 'use-cases/gameplay/', 'features/publish/', 'features/auto-cover/', 'guides/publish/']);
  const languages = ['zh', 'en', 'ja', 'ko', 'es', 'pt', 'ru', 'fr'];
  const read = key => { try { return localStorage.getItem(prefix + key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(prefix + key, value); } catch {} };
  const remove = key => { try { localStorage.removeItem(prefix + key); } catch {} };
  let consent = read('consent');
  let visitor;
  let pageSent = false;
  const blocked = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const production = location.origin === 'https://zhouxiaoka.github.io' && location.pathname.startsWith('/autoclip_intro/');
  const configured = /^phc_[A-Za-z0-9]+$/.test(config.key || '') && /^https:\/\/(us|eu)\.i\.posthog\.com$/.test(config.host || '');
  const enabled = () => production && configured && consent === 'yes' && !blocked();
  const language = () => { const l = document.documentElement.lang.split('-')[0]; return languages.includes(l) ? l : 'en'; };
  function pagePath(url) {
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
    const p = url.pathname.slice(root.pathname.length).replace(/index\.html$/, '');
    return pages.has(p) ? '/' + p : null;
  }
  const slug = value => /^[a-zA-Z0-9_-]{1,64}$/.test(value || '') ? value : undefined;
  function attribution() {
    const props = {};
    const u = new URL(location.href);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      const value = slug(u.searchParams.get(key));
      if (value) props[key] = value;
    }
    try {
      const ref = new URL(document.referrer);
      const hosts = ['github.com', 'google.com', 'www.google.com', 'bing.com', 'www.bing.com', 'baidu.com', 'www.baidu.com', 't.co', 'www.youtube.com'];
      props.referrer_source = ref.origin === location.origin ? 'internal' : hosts.includes(ref.hostname) ? ref.hostname : 'other';
    } catch { props.referrer_source = 'direct'; }
    return props;
  }
  const allowed = {
    website_pageview: [],
    website_download_click: ['platform', 'placement'],
    website_download_intent: ['placement'],
    website_demo_play: ['clip_id'],
    website_demo_complete: ['clip_id'],
    website_sponsor_click: ['sponsor_id', 'placement'],
    website_resource_click: ['resource', 'placement'],
    website_language_change: ['from_language', 'to_language'],
  };
  function capture(event, details = {}) {
    if (!enabled() || !Object.hasOwn(allowed, event)) return;
    try {
      const page = pagePath(new URL(location.href));
      if (page === null) return;
      if (!visitor) {
        const stored = read('visitor');
        visitor = /^website_[a-f0-9-]{36}$/.test(stored || '') ? stored : 'website_' + crypto.randomUUID();
        write('visitor', visitor);
      }
      const properties = {
        $process_person_profile: false, $geoip_disable: true,
        surface: 'website', analytics_environment: 'production', schema_version: 1,
        page, language: language(), ...attribution(),
      };
      for (const key of allowed[event]) {
        const value = slug(String(details[key] ?? ''));
        if (value) properties[key] = value;
      }
      const body = JSON.stringify({api_key: config.key, distinct_id: visitor, event, properties});
      // A simple CORS request, no cookies/referrer. Navigation never waits on analytics.
      void fetch(config.host + '/i/v0/e/', {
        method: 'POST', body, headers: {'Content-Type': 'text/plain'},
        credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      }).catch(() => {});
    } catch { /* Analytics failures cannot interrupt navigation or playback. */ }
  }
  function pageview() { if (enabled() && !pageSent) { pageSent = true; capture('website_pageview'); } }
  function setConsent(value) {
    consent = value === true ? 'yes' : 'no';
    write('consent', consent);
    if (consent === 'no') { remove('visitor'); visitor = undefined; pageSent = false; }
    pageview(); renderPreferences();
  }
  const placement = node => node.closest('header') ? 'header' : node.closest('footer') ? 'footer' : node.closest('.hero') ? 'hero' : node.closest('#download') ? 'download' : 'content';
  function onClick(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const a = event.target.closest?.('a[href]');
    if (!a) return;
    try {
      const u = new URL(a.href, location.href);
      const where = placement(a);
      if (a.dataset.sponsorId && slug(a.dataset.sponsorId)) {
        capture('website_sponsor_click', {sponsor_id: a.dataset.sponsorId, placement: where}); return;
      }
      if (u.hostname === 'github.com' && u.pathname.startsWith('/zhouxiaoka/autoclip/releases/download/')) {
        const platform = /\.dmg$/i.test(u.pathname) ? 'macos' : /\.exe$/i.test(u.pathname) ? 'windows' : 'other';
        capture('website_download_click', {platform, placement: where});
      } else if (pagePath(u) === '/' && u.hash === '#download') {
        capture('website_download_intent', {placement: where});
      } else if (u.hostname === 'github.com' && /^\/zhouxiaoka\/autoclip(?:\/|$)/.test(u.pathname)) {
        const resource = u.pathname.includes('/releases') ? 'releases' : /\/(issues|discussions)(\/|$)/.test(u.pathname) ? 'community' : u.pathname.includes('/blob/') ? 'docs' : 'repository';
        capture('website_resource_click', {resource, placement: where});
      } else if (pagePath(u)?.startsWith('/guides/')) {
        capture('website_resource_click', {resource: 'guide', placement: where});
      }
    } catch {}
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
  const played = new WeakMap();
  function media(event) {
    const video = event.target;
    if (video.tagName !== 'VIDEO') return;
    try {
      const u = new URL(video.currentSrc || video.src, location.href);
      const own = u.origin === root.origin, mediaOrigin = document.documentElement.dataset?.mediaOrigin;
      if (!own && u.origin !== mediaOrigin) return;
      const legacy = own && u.pathname.startsWith(root.pathname + 'assets/showcase/') && u.pathname.match(/\/clip-(9|11|12|13)\.mp4$/);
      const library = u.pathname.match(/\/cases\/([a-z0-9-]{1,48})\/(\d{2})\.mp4$/);
      if (!legacy && !library) return;
      const clip = legacy ? legacy[1] : library[1] + '_' + library[2];
      const seen = played.get(video) || new Set();
      const key = event.type + ':' + clip;
      if (!enabled() || seen.has(key)) return;
      seen.add(key); played.set(video, seen);
      capture(event.type === 'playing' ? 'website_demo_play' : 'website_demo_complete', {clip_id: clip});
    } catch {}
  }
  // Native media events do not bubble. Count playback, not clicks or failed play attempts.
  document.addEventListener('playing', media, true);
  document.addEventListener('ended', media, true);
  const copy = {
    zh: ['访问统计', '允许匿名访问统计，帮助我们了解页面浏览、下载点击、案例播放和赞助链接点击情况。由 PostHog 接收，不录屏。', '允许', '拒绝', '关闭统计', '已开启', '已关闭', '浏览器已要求不跟踪', '详情'],
    en: ['Site analytics', 'Allow anonymous statistics on page visits, downloads, demos and sponsor clicks. Sent to PostHog; no session recording.', 'Allow', 'Decline', 'Disable analytics', 'Enabled', 'Disabled', 'Your browser requests no tracking', 'Details'],
    ja: ['アクセス解析', '閲覧、ダウンロード、デモ再生、スポンサーリンクの匿名統計を許可しますか？ PostHog に送信し、画面録画は行いません。', '許可', '拒否', '解析を無効にする', '有効', '無効', 'ブラウザーの追跡拒否が有効です', '詳細'],
    ko: ['방문 통계', '방문, 다운로드, 데모 재생, 후원 링크 클릭의 익명 통계를 허용하시겠어요? PostHog로 전송하며 화면은 녹화하지 않습니다.', '허용', '거부', '통계 끄기', '켜짐', '꺼짐', '브라우저가 추적 거부를 요청했습니다', '자세히'],
    es: ['Estadísticas', 'Permite estadísticas anónimas de visitas, descargas, demos y clics en patrocinadores. Se envían a PostHog, sin grabar sesiones.', 'Permitir', 'Rechazar', 'Desactivar', 'Activadas', 'Desactivadas', 'Tu navegador solicita no rastrear', 'Detalles'],
    pt: ['Estatísticas', 'Permita estatísticas anônimas de visitas, downloads, demos e cliques em patrocinadores. Enviadas ao PostHog, sem gravar sessões.', 'Permitir', 'Recusar', 'Desativar', 'Ativadas', 'Desativadas', 'Seu navegador solicita não rastrear', 'Detalhes'],
    ru: ['Статистика сайта', 'Разрешить анонимную статистику посещений, скачиваний, демо и переходов к спонсорам? Данные отправляются в PostHog, без записи сеансов.', 'Разрешить', 'Отказаться', 'Отключить', 'Включена', 'Отключена', 'Браузер запрещает отслеживание', 'Подробнее'],
    fr: ['Statistiques', 'Autoriser les statistiques anonymes de visites, téléchargements, démos et clics sponsors ? Envoyées à PostHog, sans enregistrement de session.', 'Autoriser', 'Refuser', 'Désactiver', 'Activées', 'Désactivées', 'Votre navigateur refuse le suivi', 'Détails'],
  };
  const bannerCopy = {
    zh: ['允许匿名访问统计，帮助我们改进体验。由 PostHog 接收，不录屏。', '允许并继续', '管理偏好'],
    en: ['Allow anonymous analytics to help improve AutoClip. Sent to PostHog; no session recording.', 'Allow and continue', 'Manage preferences'],
    ja: ['AutoClip の改善に匿名統計を使用します。PostHog に送信し、画面録画は行いません。', '許可して続ける', '設定を管理'],
    ko: ['익명 통계로 AutoClip을 개선합니다. PostHog로 전송하며 화면은 녹화하지 않습니다.', '허용하고 계속', '환경설정 관리'],
    es: ['Permite estadísticas anónimas para mejorar AutoClip. Se envían a PostHog, sin grabar sesiones.', 'Permitir y continuar', 'Gestionar preferencias'],
    pt: ['Permita estatísticas anônimas para melhorar o AutoClip. Enviadas ao PostHog, sem gravar sessões.', 'Permitir e continuar', 'Gerenciar preferências'],
    ru: ['Анонимная статистика помогает улучшать AutoClip. Данные отправляются в PostHog, без записи сеансов.', 'Разрешить и продолжить', 'Управлять настройками'],
    fr: ['Autorisez les statistiques anonymes pour améliorer AutoClip. Envoyées à PostHog, sans enregistrement de session.', 'Autoriser et continuer', 'Gérer mes préférences'],
  };
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('assets/analytics.css', root).href;
  document.head.append(stylesheet);
  const settingsPage = location.pathname.replace(/index\.html$/, '') === new URL('analytics/', root).pathname;
  function renderPreferences() {
    document.getElementById('site-analytics-preferences')?.remove();
    // Show the first-visit choice in the viewport. Saved choices live on the privacy page.
    if (!settingsPage && (consent !== null || blocked())) return;
    const host = settingsPage ? document.getElementById('site-analytics-settings') : document.body;
    if (!host) return;
    const panel = document.createElement('section');
    panel.id = 'site-analytics-preferences';
    panel.className = settingsPage ? 'analytics-settings' : 'analytics-banner';
    panel.setAttribute('aria-labelledby', 'site-analytics-title');
    const c = copy[language()];
    const b = bannerCopy[language()];
    const content = document.createElement('div');
    content.className = 'analytics-copy';
    const title = document.createElement('h2');
    title.id = 'site-analytics-title'; title.tabIndex = -1; title.textContent = c[0];
    content.append(title);
    const text = document.createElement('p'); text.textContent = settingsPage ? c[1] : b[0]; content.append(text);
    if (settingsPage) {
      const status = document.createElement('p');
      status.className = 'analytics-status';
      status.setAttribute('role', 'status');
      status.textContent = blocked() ? c[7] : consent === 'yes' ? c[5] : c[6];
      content.append(status);
    }
    panel.append(content);
    if (!blocked()) {
      const actions = document.createElement('div'); actions.className = 'analytics-actions';
      const choices = settingsPage ? [[c[2], true], [consent === 'yes' ? c[4] : c[3], false]] : [[b[1], true]];
      for (const [label, value] of choices) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        if (!settingsPage) button.className = 'analytics-allow';
        button.addEventListener('click', () => {
          setConsent(value);
          if (settingsPage) document.getElementById('site-analytics-title')?.focus({preventScroll: true});
        });
        actions.append(button);
      }
      if (!settingsPage) {
        const preferences = document.createElement('a');
        preferences.className = 'analytics-action';
        preferences.href = new URL('analytics/?lang=' + language(), root).href;
        preferences.textContent = b[2];
        actions.append(preferences);
      }
      panel.append(actions);
    }
    host.append(panel);
  }
  window.AutoClipAnalytics = Object.freeze({setConsent, isEnabled: enabled});
  window.addEventListener('storage', event => {
    if (event.key !== prefix + 'consent' && event.key !== null) return;
    consent = read('consent');
    if (consent !== 'yes') { visitor = undefined; pageSent = false; }
    renderPreferences(); pageview();
  });
  let previousLanguage = language();
  new MutationObserver(() => {
    const next = language();
    if (next !== previousLanguage) {
      capture('website_language_change', {from_language: previousLanguage, to_language: next}); previousLanguage = next;
    }
    renderPreferences();
  }).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  renderPreferences(); pageview();
})();
