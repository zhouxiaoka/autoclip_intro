const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '../use-cases/gameplay');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const catalog = html.match(/<script>(window\.INNER_COPY = [\s\S]*?)<\/script>/)[1];
const script = fs.readFileSync(path.join(root, '../../assets/inner-page.js'), 'utf8');
const catalogs = {window: {}};
vm.runInNewContext(catalog, catalogs);
const copy = catalogs.window.INNER_COPY;

test('game use case covers its rendered content and references existing local assets', () => {
  const keys = [...html.matchAll(/data-copy="([^"]+)"/g)].map(m => m[1]);
  for (const lang of ['zh', 'en']) {
    for (const key of keys) assert.ok(copy[lang][key], `${lang}.${key}`);
  }
  assert.match(html, /src="\.\.\/\.\.\/assets\/inner-page\.js"/);
  for (const [, target] of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    assert.ok(fs.existsSync(path.resolve(root, target)), target);
  }
});

test('eight language selections render the current catalogs or English fallback and preserve navigation', () => {
  const nodes = {};
  const node = k => nodes[k] ??= {value: '', addEventListener(t, fn) {this[t] = fn;}};
  const elements = [...html.matchAll(/data-copy="([^"]+)"/g)].map(m => ({
    key: m[1], textContent: '', getAttribute() {return this.key;},
  }));
  const links = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*\bdata-home\b/g)].map(m => ({
    href: m[1], getAttribute() {return this.href;},
  }));
  const targets = links.map(link => new URL(link.href, 'https://example.test/autoclip_intro/use-cases/gameplay/'));
  const storage = new Map();
  const doc = {
    documentElement: {}, getElementById: node,
    querySelectorAll: q => q === '[data-copy]' ? elements : q === '[data-home]' ? links : [],
  };
  const context = {
    window: {}, document: doc, navigator: {languages: ['en']},
    location: {search: '?lang=ja', href: 'https://example.test/autoclip_intro/use-cases/gameplay/?lang=ja'},
    localStorage: {getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v)},
    URL, URLSearchParams, history: {replaceState(a, b, url) {this.url = url;}},
  };
  vm.runInNewContext(catalog + '\n' + script, context);
  assert.equal(doc.documentElement.lang, 'ja');
  assert.equal(doc.title, copy.en.title);
  for (const lang of ['zh', 'en', 'ja', 'ko', 'es', 'pt', 'ru', 'fr']) {
    nodes.language.change({target: {value: lang}});
    const expected = copy[lang] || copy.en;
    assert.equal(doc.documentElement.lang, lang === 'zh' ? 'zh-CN' : lang === 'pt' ? 'pt-BR' : lang);
    assert.equal(doc.title, expected.title);
    assert.equal(storage.get('autoclip.lang'), lang);
    assert.equal(context.history.url.searchParams.get('lang'), lang);
    for (const el of elements) assert.equal(el.textContent, expected[el.key]);
    links.forEach((link, i) => {
      const url = new URL(link.href);
      assert.equal(url.pathname, targets[i].pathname);
      assert.equal(url.hash, targets[i].hash);
      assert.equal(url.searchParams.get('lang'), lang);
    });
  }
});
