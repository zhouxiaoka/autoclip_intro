const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/analytics.js'), 'utf8');
function boot(options = {}) {
  const url = new URL(options.url || 'https://zhouxiaoka.github.io/autoclip_intro/');
  const root = options.root || new URL('/autoclip_intro/', url.origin).href;
  const memory = options.memory || new Map();
  if (options.consent) memory.set('autoclip.website.analytics.consent', options.consent);
  const requests = [], listeners = {}, windowListeners = {}, observers = [];
  const nodes = new Map();
  function node(tagName) {
    return {tagName: tagName.toUpperCase(), style: {}, children: [], dataset: {},
      append(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); },
      setAttribute(k, v) { this[k] = v; },
      remove() { nodes.delete(this.id); }, addEventListener(type, fn) { this[type] = fn; }, focus() {},
    };
  }
  const footer = node('footer');
  const settings = node('div'); nodes.set('site-analytics-settings', settings);
  const document = {
    currentScript: {src: root + 'assets/analytics.js'},
    documentElement: {lang: 'zh'}, referrer: options.referrer || '', body: node('body'), head: node('head'),
    getElementById: id => nodes.get(id), createElement: node,
    querySelector: s => s === 'footer' ? footer : null,
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
  let seq = 0;
  const context = {URL, document, location: url, navigator: options.navigator || {},
    crypto: {randomUUID: () => '00000000-0000-4000-8000-' + String(++seq).padStart(12,'0')},
    localStorage: {
      getItem(k) { if (options.storageBlocked) throw Error('storage denied'); return memory.get(k) ?? null; },
      setItem(k,v) { if (options.storageBlocked) throw Error('storage denied'); memory.set(k,v); },
      removeItem(k) { memory.delete(k); },
    },
    fetch(endpoint, init) { requests.push({endpoint, ...init, payload: JSON.parse(init.body)}); if (options.throwFetch) throw Error('offline'); return options.rejectFetch ? Promise.reject(Error('offline')) : Promise.resolve({ok: true}); },
    MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} },
  };
  context.window = {AUTOCLIP_ANALYTICS_CONFIG: options.config || {key: 'phc_test', host: 'https://us.i.posthog.com'}, addEventListener: (type,fn) => { windowListeners[type] = fn; }};
  vm.runInNewContext(source, context);
  function click(href, dataset = {}, section = '', type = 'click', button = 0) {
    const anchor = {href, dataset, closest: selector => selector === section ? {} : null};
    listeners[type]({type, button, target: {closest: selector => selector === 'a[href]' ? anchor : null}});
  }
  return {context, requests, memory, click, nodes, listeners, windowListeners, observers,
    footer, settings, api: context.window.AutoClipAnalytics, events: () => requests.map(r => r.payload.event)};
}
test('no requests or visitor identifier before consent; allow once; revoke clears ID and stops events', () => {
  const b = boot(); b.click('https://github.com/zhouxiaoka/autoclip/releases/download/v1/a.dmg');
  assert.equal(b.requests.length, 0); assert.equal(b.memory.size, 0);
  b.api.setConsent(true); b.api.setConsent(true);
  assert.deepEqual(b.events(), ['website_pageview']);
  assert.match(b.requests[0].payload.distinct_id, /^website_/);
  b.api.setConsent(false);
  assert.equal(b.memory.has('autoclip.website.analytics.visitor'), false);
  b.click('https://github.com/zhouxiaoka/autoclip/releases/download/v1/a.exe');
  assert.equal(b.requests.length, 1);
});
test('stored consent sends one page view, reuses browser ID, duplicate script is harmless', () => {
  const b = boot({consent:'yes'});
  vm.runInNewContext(source,b.context);
  const next = boot({memory:b.memory, url:'https://zhouxiaoka.github.io/autoclip_intro/use-cases/podcast/'});
  assert.equal(b.requests.length,1);
  assert.equal(next.requests[0].payload.distinct_id,b.requests[0].payload.distinct_id);
  assert.equal(next.requests[0].payload.properties.page,'/use-cases/podcast/');
});
test('DNT, GPC, local previews, unrelated pages and invalid configuration send nothing', () => {
  for (const options of [
    {navigator:{doNotTrack:'1'}}, {navigator:{globalPrivacyControl:true}},
    {url:'http://localhost:8770/'}, {url:'https://example.com/autoclip_intro/'},
    {url:'https://zhouxiaoka.github.io/other/'}, {url:'https://zhouxiaoka.github.io/autoclip_intro/private/'},
    {config:{key:'phx_personal',host:'https://us.i.posthog.com'}},
    {config:{key:'phc_test',host:'https://attacker.example'}},
  ]) { const b=boot({...options,consent:'yes'}); b.api.setConsent(true); assert.equal(b.requests.length,0); }
});
test('only allowlisted metadata is transmitted; URLs, queries and referrer paths stay private', () => {
  const b=boot({consent:'yes',url:'https://zhouxiaoka.github.io/autoclip_intro/?email=secret&token=secret&utm_source=github&utm_medium=readme&utm_campaign=launch&utm_term=secret#secret',referrer:'https://private.internal/customer/secret'});
  const r=b.requests[0], p=r.payload.properties;
  assert.equal(p.utm_source,'github'); assert.equal(p.utm_campaign,'launch'); assert.equal(p.referrer_source,'other');
  assert.equal(p.surface,'website'); assert.equal(p.$process_person_profile,false); assert.equal(p.$geoip_disable,true);
  assert.equal(r.body.includes('secret'),false); assert.equal(r.body.includes('private.internal'),false);
  assert.equal(r.referrerPolicy,'no-referrer'); assert.equal(r.credentials,'omit'); assert.equal(r.keepalive,true);
  const bad=boot({consent:'yes',url:'https://zhouxiaoka.github.io/autoclip_intro/?utm_source=person%40mail.com'});
  assert.equal(bad.requests[0].payload.properties.utm_source,undefined);
});
test('actual downloads, anchor intent, release browsing and sponsor attribution are separate', () => {
  const b=boot({consent:'yes'});
  b.click('https://github.com/zhouxiaoka/autoclip/releases/download/v1/app.dmg',{},'.hero');
  b.click('https://github.com/zhouxiaoka/autoclip/releases/download/v1/app.exe',{},'#download','auxclick',1);
  b.click('/autoclip_intro/#download');
  b.click('https://github.com/zhouxiaoka/autoclip/releases/latest');
  b.click('https://sponsor.example/signup?secret=123',{sponsorId:'partner-a'});
  b.click('https://github.com/zhouxiaoka/autoclip-malicious');
  assert.deepEqual(b.events(),['website_pageview','website_download_click','website_download_click','website_download_intent','website_resource_click','website_sponsor_click']);
  assert.equal(b.requests[1].payload.properties.platform,'macos'); assert.equal(b.requests[1].payload.properties.placement,'hero');
  assert.equal(b.requests[2].payload.properties.platform,'windows');
  assert.equal(b.requests[5].payload.properties.sponsor_id,'partner-a'); assert.equal(b.requests[5].body.includes('secret'),false);
});
test('playback counts actual playing once per clip, completion separately, and no unrelated media', () => {
  const b=boot({consent:'yes'}), video={tagName:'VIDEO',currentSrc:'https://zhouxiaoka.github.io/autoclip_intro/assets/showcase/clip-9.mp4'};
  b.listeners.playing({type:'playing',target:video}); b.listeners.playing({type:'playing',target:video});
  b.listeners.ended({type:'ended',target:video});
  video.currentSrc='https://another.example/clip-9.mp4'; b.listeners.playing({type:'playing',target:video});
  assert.deepEqual(b.events(),['website_pageview','website_demo_play','website_demo_complete']);
});
test('language changes rerender eight translated preferences and do not create extra pageviews', () => {
  const b=boot();
  for(const lang of ['en','ja','ko','es','pt','ru','fr','zh']) {
    b.context.document.documentElement.lang=lang; b.observers[0]();
    assert.ok(b.nodes.get('site-analytics-preferences').children[0].children[0].textContent);
  }
  assert.equal(b.events().length, 0);
  const allowed = boot({consent:'yes'});
  for (const lang of ['en','ja','ko','es','pt','ru','fr','zh']) {
    allowed.context.document.documentElement.lang=lang; allowed.observers[0]();
    assert.equal(allowed.nodes.has('site-analytics-preferences'), false);
  }
  assert.equal(allowed.events().filter(x=>x==='website_pageview').length,1);
  assert.equal(allowed.events().filter(x=>x==='website_language_change').length,8);
});
test('cross-tab revocation stops capture',()=>{
  const b=boot({consent:'yes'}); b.memory.set('autoclip.website.analytics.consent','no');
  b.windowListeners.storage({key:'autoclip.website.analytics.consent'});
  b.click('https://github.com/zhouxiaoka/autoclip/releases/download/v1/a.dmg');
  assert.equal(b.requests.length,1); assert.equal(b.api.isEnabled(),false);
});
test('first-visit allow closes the banner; managing preferences keeps the choice pending', () => {
  const b = boot();
  const panel = b.nodes.get('site-analytics-preferences');
  assert.equal(panel.className, 'analytics-banner');
  assert.ok(b.context.document.body.children.includes(panel));
  assert.equal(b.footer.children.length, 0);
  const [allow, preferences] = panel.children[1].children;
  assert.equal(preferences.href, 'https://zhouxiaoka.github.io/autoclip_intro/analytics/?lang=zh');
  assert.equal(b.memory.size, 0);
  assert.equal(b.requests.length, 0);
  allow.click();
  assert.equal(b.nodes.has('site-analytics-preferences'), false);
  assert.equal(b.requests.length, 1);
  for (const consent of ['yes', 'no']) {
    const next = boot({consent});
    assert.equal(next.nodes.has('site-analytics-preferences'), false);
  }
  assert.equal(boot({navigator: {doNotTrack: '1'}}).nodes.has('site-analytics-preferences'), false);
  assert.equal(boot({navigator: {globalPrivacyControl: true}}).nodes.has('site-analytics-preferences'), false);
});
test('privacy page keeps controls available for changing saved consent and respects browser blocking', () => {
  for (const suffix of ['', 'index.html?lang=en']) {
    const b = boot({url: 'https://zhouxiaoka.github.io/autoclip_intro/analytics/' + suffix, consent: 'yes'});
    const panel = b.nodes.get('site-analytics-preferences');
    assert.equal(panel.className, 'analytics-settings');
    assert.ok(b.settings.children.includes(panel));
    panel.children[1].children[1].click();
    assert.equal(b.memory.get('autoclip.website.analytics.consent'), 'no');
    const disabled = b.nodes.get('site-analytics-preferences');
    assert.equal(disabled.children[0].children[2].textContent, '已关闭');
    disabled.children[1].children[0].click();
    assert.equal(b.memory.get('autoclip.website.analytics.consent'), 'yes');
    assert.equal(b.requests.length, 0);
  }
  const blocked = boot({url: 'https://zhouxiaoka.github.io/autoclip_intro/analytics/', navigator: {globalPrivacyControl: true}});
  const panel = blocked.nodes.get('site-analytics-preferences');
  assert.equal(panel.children[0].children[2].textContent, '浏览器已要求不跟踪');
  assert.equal(panel.children.length, 1);
});
test('storage denial and synchronous/asynchronous network failures do not break UI',async()=>{
  for(const options of [{storageBlocked:true},{throwFetch:true},{rejectFetch:true}]) {
    const b=boot(options); assert.doesNotThrow(()=>b.api.setConsent(true));
    assert.doesNotThrow(()=>b.click('https://github.com/zhouxiaoka/autoclip/releases/download/v1/a.dmg'));
  }
  await new Promise(resolve=>setImmediate(resolve));
});
test('all marketing pages load config then analytics once, using existing local paths',()=>{
  const root=path.join(__dirname,'..');
  for(const p of ['','use-cases/podcast','use-cases/course','use-cases/gameplay','features/publish','features/auto-cover','guides/publish']) {
    const html=fs.readFileSync(path.join(root,p,'index.html'),'utf8');
    for(const asset of ['analytics-config.js','analytics.js']) {
      const links=[...html.matchAll(new RegExp('<script src="([^\"]*assets/'+asset.replace('.','\\.')+')"></script>','g'))];
      assert.equal(links.length,1,p+': '+asset); assert.ok(fs.existsSync(path.resolve(root,p,links[0][1])));
    }
    assert.ok(html.indexOf('assets/analytics-config.js')<html.indexOf('assets/analytics.js'));
  }
});
