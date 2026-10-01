const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8')
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8')
const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8')
const full = fs.readFileSync(path.join(root, 'llms-full.txt'), 'utf8')

const pages = [
  '/',
  '/cases/',
  '/use-cases/podcast/',
  '/use-cases/course/',
  '/use-cases/gameplay/',
  '/guides/publish/',
  '/features/publish/',
  '/features/auto-cover/',
  '/llms.txt',
  '/llms-full.txt',
]

test('sitemap lists public pages with a current lastmod', () => {
  for (const page of pages) {
    assert.match(sitemap, new RegExp(`https://zhouxiaoka.github.io/autoclip_intro${page === '/' ? '/' : page}`))
  }
  assert.match(sitemap, /<lastmod>2026-10-01<\/lastmod>/)
  assert.doesNotMatch(sitemap, /2026-09-22/)
})

test('robots points crawlers at the sitemap and llms files', () => {
  assert.match(robots, /Sitemap: https:\/\/zhouxiaoka\.github\.io\/autoclip_intro\/sitemap\.xml/)
  assert.match(robots, /llms\.txt/)
  assert.match(robots, /llms-full\.txt/)
})

test('GEO files describe the 1.5 desktop product, not the old Docker demo', () => {
  for (const text of [llms, full]) {
    assert.match(text, /1\.5\.0/)
    assert.match(text, /MIT/)
    assert.match(text, /YouTube/)
    assert.match(text, /Bilibili|B 站/)
    assert.match(text, /Douyin|抖音/)
    assert.doesNotMatch(text, /申请内测/)
  }
  assert.match(full, /OpusClip/)
  assert.match(full, /not CLI-only and not Docker-only/i)
})

test('homepage is crawlable without JavaScript', () => {
  assert.match(html, /<p class="lede" data-i18n="hero.lede">贴链接/)
  assert.match(html, /<summary data-i18n="faq.1.q">要花钱吗？<\/summary>/)
  assert.match(html, /<p data-i18n="faq.1.a">AutoClip 免费开源/)
  assert.match(html, /<span class="a" data-i18n="cmp.1.a">软件免费/)
  assert.match(html, /rel="llms-txt"/)
  assert.match(html, /hreflang="en"/)
  assert.match(html, /"softwareVersion": "1.5.0"/)
  assert.match(html, /https:\/\/github.com\/zhouxiaoka\/autoclip/)
  assert.match(html, /<noscript>/)
})
