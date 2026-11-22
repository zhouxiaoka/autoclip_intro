const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('legacy gameplay use-case paths redirect cleanly to features/game-streams/', () => {
  const zh = fs.readFileSync(path.join(root, 'use-cases/gameplay/index.html'), 'utf8');
  const en = fs.readFileSync(path.join(root, 'en/use-cases/gameplay/index.html'), 'utf8');

  for (const html of [zh, en]) {
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.match(html, /rel="canonical" href="https:\/\/zhouxiaoka\.github\.io\/autoclip_intro\/features\/game-streams\/"/);
  }
  assert.match(zh, /url=\.\.\/\.\.\/features\/game-streams\//);
  assert.match(en, /url=\.\.\/\.\.\/\.\.\/features\/game-streams\/\?lang=en/);
  assert.equal(fs.existsSync(path.join(root, 'use-cases/gameplay/content.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'use-cases/gameplay/assets')), false);
});
