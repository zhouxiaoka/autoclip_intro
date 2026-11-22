const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'features', 'game-streams');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'launch.js'), 'utf8');

function extractCatalogs() {
  const start = js.indexOf('const COPY =');
  const end = js.indexOf('const ATTR =');
  const sandbox = {};
  vm.runInNewContext(
    js.slice(start, end) + '\nthis.COPY = COPY; this.SOURCES = SOURCES;',
    sandbox
  );
  return sandbox;
}

test('game-streams zh/en copy covers every data-copy and data-copy-html key in index.html', () => {
  const {COPY} = extractCatalogs();
  const zhKeys = Object.keys(COPY.zh).sort();
  const enKeys = Object.keys(COPY.en).sort();
  assert.deepEqual(enKeys, zhKeys);

  for (const [, key] of html.matchAll(/data-copy(?:-html)?="([^"]+)"/g)) {
    assert.ok(COPY.zh[key], 'missing zh key: ' + key);
    assert.ok(COPY.en[key], 'missing en key: ' + key);
  }
  assert.match(COPY.zh.disclaimer, /Rockstar Games/);
  assert.match(COPY.en.disclaimer, /Rockstar Games/);
  for (const lang of ['zh', 'en']) {
    const joined = Object.values(COPY[lang]).join('\n');
    assert.doesNotMatch(joined, /-c copy|ws:\/\/127\.0\.0\.1|WebSocket/i, lang + ' should stay creator-friendly');
    assert.doesNotMatch(joined, /开服前|¥0 \/ 月|\$0 \/ mo/, lang + ' should stay timely and honest on pricing');
  }
});

test('game-streams defines all 6 replay sources and every referenced local asset exists', () => {
  const {SOURCES} = extractCatalogs();
  assert.deepEqual(Array.from(SOURCES, (s) => s.id), ['obs', 'twitch', 'youtube', 'kick', 'discord', 'capture']);
  for (const src of SOURCES) {
    assert.ok(fs.existsSync(path.join(dir, src.icon)), 'missing icon: ' + src.icon);
    assert.equal(src.zh.steps.length, 3, src.id + ' zh steps');
    assert.equal(src.en.steps.length, 3, src.id + ' en steps');
    assert.ok(src.zh.mode.length <= 6, src.id + ' zh mode badge too wide: ' + src.zh.mode);
    assert.ok(src.en.mode.length <= 12, src.id + ' en mode badge too wide: ' + src.en.mode);
    const srcText = [src.zh.short, src.zh.summary, ...src.zh.steps, src.zh.privacy, src.en.short, src.en.summary, ...src.en.steps, src.en.privacy].join('\n');
    assert.doesNotMatch(srcText, /-c copy|WebSocket|ws:\/\/127\.0\.0\.1/i, src.id + ' contains developer jargon');
  }
  for (const asset of [
    'assets/riso-marks.webp',
    'assets/vice-hero.webp',
    'assets/stream-source.webp',
    'assets/wide-guide.webp',
    'assets/split-chase.webp',
    'assets/split-wuxia.webp',
    'assets/split-squad.webp',
    'assets/riso-collage.webp'
  ]) {
    assert.ok(fs.existsSync(path.join(dir, asset)), 'missing art asset: ' + asset);
  }
});
