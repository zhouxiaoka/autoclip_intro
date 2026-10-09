"""Render the bilingual research note into static zh/en pages.

The markdown in data/research/ is the wording source. Generated HTML keeps that
wording and only adds the site shell, figure layout and language routes.
"""
import html
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://zhouxiaoka.github.io/autoclip_intro/'
NOTE = 'research/what-drives-views/'
SRC = ROOT / 'data/research/2026-10-what-drives-views'
FIGURES = ROOT / NOTE / 'figures'


def esc(value):
    return html.escape(str(value), quote=True)


def rel_to(page_route, target):
    origin = page_route.strip('/') or '.'
    destination = target.strip('/')
    rel = os.path.relpath(destination, origin)
    if target.endswith('/') or not os.path.splitext(target)[1]:
        if not rel.endswith('/'):
            rel += '/'
    return rel


def site_href(page_route, target, language):
    if target.startswith(('http://', 'https://', 'mailto:')):
        return target
    from build_search_pages import ROUTES
    fragment = ''
    path = target
    if '#' in path:
        path, fragment = path.split('#', 1)
        fragment = '#' + fragment
    query = ''
    if '?' in path:
        path, query = path.split('?', 1)
        query = '?' + query
    localized = path
    # English mirrors exist only for registered routes. Files such as
    # analytics/ and llms.txt stay at the site root.
    if language == 'en' and path == 'guides/publish/':
        localized = 'guides/publish/'
        query = '?lang=en'
    elif language == 'en' and (path == '' or path in ROUTES):
        localized = 'en/' + path
    if localized in ('', './'):
        rel = rel_to(page_route, 'en/' if language == 'en' else './')
    else:
        rel = rel_to(page_route, localized)
    return rel + query + fragment


def rewrite(url, page_route, language):
    if url in ('article-en.md', 'article-zh.md'):
        target = ('en/' if url.endswith('en.md') else '') + NOTE
        return rel_to(page_route, target)
    if url == 'sources.md':
        return rel_to(page_route, NOTE + 'sources/')
    if url.startswith('figures/'):
        return rel_to(page_route, NOTE + url)
    return url


def parse_inline(source, page_route, language, stop=None, in_link=False):
    out = []
    i = 0
    while i < len(source):
        if source.startswith('**', i) and stop != '**':
            inner, nxt = parse_inline(source[i + 2:], page_route, language, '**', in_link)
            if nxt is not None and source.startswith('**', i + 2 + nxt):
                out.append('<strong>' + inner + '</strong>')
                i = i + 2 + nxt + 2
                continue
        if stop and source.startswith(stop, i) and not (stop == '*' and source.startswith('**', i)):
            return ''.join(out), i
        if source.startswith('`', i):
            end = source.find('`', i + 1)
            if end != -1:
                code = source[i + 1:end]
                body = esc(code)
                if code == 'sources.md' and not in_link:
                    href = rewrite('sources.md', page_route, language)
                    out.append('<a href="' + esc(href) + '"><code>sources.md</code></a>')
                else:
                    out.append('<code>' + body + '</code>')
                i = end + 1
                continue
        if source.startswith('*', i) and stop != '*':
            inner, nxt = parse_inline(source[i + 1:], page_route, language, '*', in_link)
            if nxt is not None and nxt > 0 and source.startswith('*', i + 1 + nxt) and not source.startswith('**', i + 1 + nxt):
                out.append('<em>' + inner + '</em>')
                i = i + 1 + nxt + 1
                continue
        if source.startswith('[', i):
            match = re.match(r'\[([^\]]+)\]\(([^)\s]+)\)', source[i:])
            if match:
                text, _ = parse_inline(match.group(1), page_route, language, in_link=True)
                href = rewrite(match.group(2), page_route, language)
                out.append('<a href="' + esc(href) + '">' + text + '</a>')
                i += match.end()
                continue
        if source.startswith('<http://', i) or source.startswith('<https://', i):
            end = source.find('>', i)
            if end != -1:
                url = source[i + 1:end]
                out.append('<a href="' + esc(url) + '">' + esc(url) + '</a>')
                i = end + 1
                continue
        out.append(esc(source[i]))
        i += 1
    if stop:
        return ''.join(out), None
    return ''.join(out), i


def inline(source, page_route, language):
    text, end = parse_inline(source, page_route, language)
    if end != len(source):
        raise ValueError('inline parser stopped early: ' + source[:80])
    return text


def front_matter(text):
    if not text.startswith('---\n'):
        return {}, text
    end = text.find('\n---\n', 3)
    raw = text[4:end]
    meta = {}
    for line in raw.splitlines():
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        meta[key.strip()] = value.strip().strip('"')
    return meta, text[end + 5:]


def blocks(text):
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.strip() == '---':
            yield ('hr',)
            i += 1
            continue
        if line.startswith('#'):
            level = len(line) - len(line.lstrip('#'))
            yield ('h', level, line[level:].strip())
            i += 1
            continue
        if line.startswith('>'):
            buf = []
            while i < len(lines) and lines[i].startswith('>'):
                buf.append(lines[i][1:].lstrip())
                i += 1
            yield ('quote', ' '.join(buf))
            continue
        if line.startswith('|'):
            buf = []
            while i < len(lines) and lines[i].startswith('|'):
                buf.append(lines[i])
                i += 1
            yield ('table', buf)
            continue
        if line.startswith('- '):
            items = []
            while i < len(lines) and lines[i].startswith('- '):
                items.append(lines[i][2:])
                i += 1
            yield ('ul', items)
            continue
        if re.match(r'\d+\. ', line):
            items = []
            while i < len(lines) and re.match(r'\d+\. ', lines[i]):
                items.append(lines[i])
                i += 1
            yield ('ol', items)
            continue
        if line.startswith('!['):
            match = re.match(r'!\[([^\]]*)\]\(([^)\s]+)\)\s*$', line)
            if not match:
                raise ValueError('bad image: ' + line)
            caption = credit = None
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and lines[j].startswith('*') and not lines[j].startswith('**'):
                caption = lines[j].strip()
                j += 1
                if j < len(lines) and (lines[j].startswith('来源：') or lines[j].startswith('Source:')):
                    credit = lines[j].strip()
                    j += 1
            yield ('image', match.group(1), match.group(2), caption, credit)
            i = j
            continue
        buf = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not _block_start(lines[i]):
            buf.append(lines[i].strip())
            i += 1
        yield ('p', ' '.join(part.strip() for part in buf))


def _block_start(line):
    return line.startswith(('#', '>', '|', '- ')) or line.strip() == '---' or line.startswith('![') or re.match(r'\d+\. ', line)


def linked_figures(raw):
    found = []
    for match in re.finditer(r'\[([^\]]+)\]\(([^)\s]+\.(?:png|jpe?g|webp))\)', raw):
        found.append((match.group(1), match.group(2)))
    return found


def render_body(markdown, page_route, language):
    _, body = front_matter(markdown)
    parts = []
    seen_paragraph = False
    for block in blocks(body):
        kind = block[0]
        if kind == 'hr':
            parts.append('<hr>')
        elif kind == 'h':
            level, text = block[1], block[2]
            parts.append(f'<h{level}>{inline(text, page_route, language)}</h{level}>')
        elif kind == 'quote':
            parts.append('<blockquote><p>' + inline(block[1], page_route, language) + '</p></blockquote>')
        elif kind == 'ul':
            items = ''.join('<li>' + inline(item, page_route, language) + '</li>' for item in block[1])
            parts.append('<ul>' + items + '</ul>')
        elif kind == 'ol':
            items = ''.join('<li>' + inline(item, page_route, language) + '</li>' for item in block[1])
            parts.append('<ol>' + items + '</ol>')
        elif kind == 'image':
            _, alt, src, caption, credit = block
            href = rewrite(src, page_route, language)
            cap = ''
            if caption or credit:
                cap = '<figcaption>'
                if caption:
                    cap += '<span class="cap">' + inline(caption, page_route, language) + '</span>'
                if credit:
                    cap += '\n<span class="credit">' + inline(credit, page_route, language) + '</span>'
                cap += '</figcaption>'
            parts.append(f'<figure><img src="{esc(href)}" alt="{esc(alt)}" loading="lazy">{cap}</figure>')
        elif kind == 'table':
            rows = []
            for raw in block[1]:
                cells = [cell.strip() for cell in raw.strip().strip('|').split('|')]
                if cells and all(re.fullmatch(r':?-{3,}:?', cell) for cell in cells):
                    continue
                rows.append(cells)
            head, *rest = rows
            thead = '<tr>' + ''.join('<th>' + inline(cell, page_route, language) + '</th>' for cell in head) + '</tr>'
            tbody = ''.join('<tr>' + ''.join('<td>' + inline(cell, page_route, language) + '</td>' for cell in row) + '</tr>' for row in rest)
            parts.append('<div class="table-scroll"><table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table></div>')
        elif kind == 'p':
            raw = block[1]
            rendered = inline(raw, page_route, language)
            klass = ' class="kicker"' if not seen_paragraph and raw.startswith('*') else ''
            seen_paragraph = True
            parts.append(f'<p{klass}>{rendered}</p>')
            extras = []
            for alt, src in linked_figures(raw):
                href = rewrite(src, page_route, language)
                extras.append(f'<figure><img src="{esc(href)}" alt="{esc(alt)}" loading="lazy"></figure>')
            parts.extend(extras)
        else:
            raise ValueError(kind)
    return '\n'.join(parts)


def plain_markdown(markdown):
    _, body = front_matter(markdown)
    chunks = []
    for block in blocks(body):
        kind = block[0]
        if kind == 'hr':
            continue
        if kind == 'h':
            chunks.append(_plain_inline(block[2]))
        elif kind == 'quote':
            chunks.append(_plain_inline(block[1]))
        elif kind in ('ul', 'ol'):
            chunks.extend(_plain_inline(item) for item in block[1])
        elif kind == 'image':
            if block[3]:
                chunks.append(_plain_inline(block[3]))
            if block[4]:
                chunks.append(_plain_inline(block[4]))
        elif kind == 'table':
            for raw in block[1]:
                cells = [cell.strip() for cell in raw.strip().strip('|').split('|')]
                if cells and all(re.fullmatch(r':?-{3,}:?', cell) for cell in cells):
                    continue
                chunks.append(' '.join(_plain_inline(cell) for cell in cells))
        elif kind == 'p':
            chunks.append(_plain_inline(block[1]))
    return _squash(' '.join(chunks))


def _plain_inline(source):
    codes = []

    def keep(match):
        codes.append(match.group(1))
        return '\x00' + str(len(codes) - 1) + '\x00'

    text = re.sub(r'`([^`]*)`', keep, source)
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'<((?:https?)://[^>]+)>', r'\1', text)
    text = text.replace('**', '')
    text = re.sub(r'(?<!\*)\*(?!\*)', '', text)

    def restore(match):
        return codes[int(match.group(1))]

    return re.sub(r'\x00(\d+)\x00', restore, text)


def visible_text(article_html):
    from html.parser import HTMLParser

    class Collector(HTMLParser):
        def __init__(self):
            super().__init__()
            self.parts = []
            self.skip = 0
        def handle_data(self, data):
            if not self.skip:
                self.parts.append(data)
        def handle_starttag(self, tag, attrs):
            if tag in ('script', 'style'):
                self.skip += 1
        def handle_endtag(self, tag):
            if tag in ('script', 'style') and self.skip:
                self.skip -= 1
            elif tag in ('p', 'li', 'h1', 'h2', 'h3', 'td', 'th', 'blockquote', 'figcaption', 'caption'):
                self.parts.append('\n')

    parser = Collector()
    parser.feed(article_html)
    return _squash(''.join(parser.parts))


def _squash(value):
    return re.sub(r'\s+', ' ', value).strip()


def assert_wording(markdown, article_html):
    left, right = plain_markdown(markdown), visible_text(article_html)
    if left != right:
        import difflib
        diff = '\n'.join(list(difflib.unified_diff(left.split(' '), right.split(' '), lineterm='', n=2))[:120])
        raise SystemExit('Research wording drifted:\n' + diff)


def asset(page_route, path):
    return rel_to(page_route, path)


def footer_html(page_route, language, labels):
    shell = (ROOT / 'index.html').read_text()
    footer = re.search(r'<footer class="footer site-footer">[\s\S]*?</footer>', shell)
    if not footer:
        raise SystemExit('homepage footer missing')
    block = footer.group(0)
    if 'data-f="research"' not in block:
        raise SystemExit('homepage footer is missing the research link')

    def href_repl(match):
        href = match.group(1)
        if href.startswith(('http://', 'https://', 'mailto:')):
            return match.group(0)
        return 'href="' + esc(site_href(page_route, href, language)) + '"'

    block = re.sub(r'href="([^"]+)"', href_repl, block)

    def label_repl(match):
        key, _inner = match.group(1), match.group(2)
        label = labels[language].get(key, match.group(2))
        return 'data-f="' + key + '">' + esc(label) + '</'

    block = re.sub(r'data-f="([^"]+)">([^<]*)</', label_repl, block)
    if language == 'en':
        block = block.replace('aria-label="页脚"', 'aria-label="Footer"')
    if page_route.rstrip('/') in (NOTE.rstrip('/'), ('en/' + NOTE).rstrip('/')):
        current = site_href(page_route, NOTE, language)
        block = block.replace('href="' + current + '" data-f="research"', 'href="' + current + '" data-f="research" aria-current="page"', 1)
    return block


def header_html(page_route, language, home):
    copy = home[language]
    nav = [
        ('#clips', 'nav.clips'),
        ('#numbers', 'nav.numbers'),
        ('#developers', 'nav.developers'),
        ('#faq', 'nav.faq'),
        (NOTE, 'nav.research'),
    ]
    links = []
    on_article = page_route.rstrip('/') in (NOTE.rstrip('/'), ('en/' + NOTE).rstrip('/'))
    for href, key in nav:
        current = ' aria-current="page"' if href == NOTE and on_article else ''
        extra = ' class="nav-research"' if key == 'nav.research' else ''
        links.append(f'<a{extra} href="{esc(site_href(page_route, href, language))}"{current}>{esc(copy[key])}</a>')
    options = [
        ('zh', 'zh-CN', '简体中文'),
        ('en', 'en', 'English'),
        ('ja', 'ja', '日本語'),
        ('ko', 'ko', '한국어'),
        ('es', 'es', 'Español'),
        ('pt', 'pt-BR', 'Português (Brasil)'),
        ('ru', 'ru', 'Русский'),
        ('fr', 'fr', 'Français'),
    ]
    opts = []
    for value, lang, label in options:
        selected = ' selected' if value == language else ''
        opts.append(f'<option value="{value}" lang="{lang}"{selected}>{label}</option>')
    home_href = site_href(page_route, '#top', language)
    download = site_href(page_route, '#download', language)
    nav_label = '主导航' if language == 'zh' else 'Main navigation'
    logo = asset(page_route, 'logo.svg')
    return f'''<header class="nav">
  <div class="container nav-in">
    <a class="brand serif" href="{esc(home_href)}" aria-label="AutoClip"><img src="{esc(logo)}" alt="">AutoClip</a>
    <nav class="nav-links" aria-label="{nav_label}">
      {''.join(links)}
    </nav>
    <div class="nav-right">
      <div class="lang">
        <select id="language" aria-label="Language / 语言">
          {''.join(opts)}
        </select>
      </div>
      <a class="btn btn-primary btn-sm" href="{esc(download)}">{esc(copy['nav.cta'])}</a>
    </div>
  </div>
</header>'''


def page_html(markdown, page_route, language, footer_labels, home, kind):
    meta, _ = front_matter(markdown)
    title = meta.get('title') or re.search(r'^# (.+)$', markdown, re.M).group(1)
    description = ''
    quote = re.search(r'^> (.+)$', markdown, re.M)
    if quote:
        description = _squash(_plain_inline(quote.group(1)))
    if not description:
        description = title
    canonical = SITE + page_route
    html_lang = 'zh-CN' if language == 'zh' else 'en'
    article_lang = 'en' if kind == 'sources' else html_lang
    body = render_body(markdown, page_route, language)
    assert_wording(markdown, body)
    chart = 'fig1-same-template-contrasts-' + ('zh' if language == 'zh' else 'en') + '-dark.png'
    if kind == 'sources' or not (FIGURES / chart).exists():
        image = SITE + NOTE + 'figures/fig1-same-template-contrasts-zh-dark.png'
    else:
        image = SITE + NOTE + 'figures/' + chart
    prefix = asset(page_route, 'assets/research.css')
    home_css = asset(page_route, 'assets/home.css')
    tokens = asset(page_route, 'tokens.css')
    routing = asset(page_route, 'assets/language-routing.js')
    back = '‹ 首页' if language == 'zh' else '‹ Home'
    back_href = site_href(page_route, '#top', language)
    graph = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'description': description,
        'inLanguage': article_lang,
        'datePublished': meta.get('date', '2026-10-09'),
        'dateModified': meta.get('date', '2026-10-09'),
        'image': image,
        'url': canonical,
        'mainEntityOfPage': canonical,
        'author': {'@type': 'Organization', 'name': 'AutoClip', 'url': SITE},
    }
    import json
    return f'''<!DOCTYPE html>
<html lang="{html_lang}" data-static-language="{language}" data-source-path="{esc(page_route)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:image" content="{esc(image)}">
<meta property="og:locale" content="{'zh_CN' if language == 'zh' else 'en_US'}">
<link rel="icon" href="{esc(asset(page_route, 'logo.svg'))}">
<link rel="alternate" hreflang="zh-CN" href="{SITE}{NOTE if kind == 'article' else NOTE + 'sources/'}">
<link rel="alternate" hreflang="en" href="{SITE}en/{NOTE if kind == 'article' else NOTE + 'sources/'}">
<link rel="alternate" hreflang="x-default" href="{SITE}{NOTE if kind == 'article' else NOTE + 'sources/'}">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Noto+Sans+SC:wght@400;500&amp;family=Noto+Serif+SC:wght@600&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="{esc(tokens)}">
<link rel="stylesheet" href="{esc(home_css)}?v=2026-10-09-research">
<link rel="stylesheet" href="{esc(prefix)}">
<script type="application/ld+json">
{json.dumps(graph, ensure_ascii=False, indent=2)}
</script>
<script src="{esc(routing)}"></script>
</head>
<body class="research-page">
{header_html(page_route, language, home)}
<main class="research-main">
  <div class="container">
    <a class="research-back" href="{esc(back_href)}">{back}</a>
    <article class="research-article" lang="{article_lang}">
{body}
    </article>
  </div>
</main>
{footer_html(page_route, language, footer_labels)}
<script src="{esc(asset(page_route, 'assets/footer.js'))}"></script>
<script src="{esc(asset(page_route, 'assets/analytics-config.js'))}"></script>
<script src="{esc(asset(page_route, 'assets/analytics.js'))}"></script>
<script>
document.getElementById('language').addEventListener('change', function (event) {{
  var lang = event.target.value;
  if (lang === 'zh' || lang === 'en') return;
  location.assign(document.querySelector('link[rel="alternate"][hreflang="en"]').href);
}});
</script>
</body>
</html>
'''


def build(check=False, footer=None, home=None):
    if footer is None or home is None:
        from build_search_pages import catalogs
        data = catalogs()
        footer = footer or data['footer']
        home = home or data['home']
    jobs = [
        ('article-zh.md', NOTE, 'zh', 'article'),
        ('article-en.md', 'en/' + NOTE, 'en', 'article'),
        ('sources.md', NOTE + 'sources/', 'zh', 'sources'),
        ('sources.md', 'en/' + NOTE + 'sources/', 'en', 'sources'),
    ]
    changed = []
    for filename, route, language, kind in jobs:
        markdown = (SRC / filename).read_text()
        text = page_html(markdown, route, language, footer, home, kind)
        target = ROOT / route / 'index.html'
        if not target.exists() or target.read_text() != text:
            changed.append(str(target.relative_to(ROOT)))
            if not check:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(text)
    if changed:
        print(('Out of date: ' if check else 'Updated research: ') + ', '.join(changed))
    return bool(changed) if check else False


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true')
    raise SystemExit(build(ap.parse_args().check))
