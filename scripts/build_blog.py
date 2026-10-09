"""Render content/blog markdown into the static zh/en blog.

Each language is one markdown file. Generated HTML keeps the article wording
and adds the site shell, wide figure layout, index, feeds and language routes.
"""
import html
import json
import os
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://zhouxiaoka.github.io/autoclip_intro/'
CONTENT = ROOT / 'content/blog'
FIGURE_ROOT = 'blog'
_ctx = {'slug': ''}

TAG_LABEL = {
    'zh': {'Research': '研究', 'Memo': '备忘'},
    'en': {'Research': 'Research', 'Memo': 'Memo'},
}
MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
COPY = {
    'zh': {
        'index_title': '博客 · AutoClip',
        'index_desc': 'AutoClip 的研究笔记和备忘，新的在最上面。',
        'index_kicker': '博客',
        'index_h1': '研究与备忘',
        'index_lede': '研究笔记和备忘。新的在最上面。',
        'feed': '订阅 RSS',
        'toc': '目录',
        'back': '‹ 博客',
        'prev': '上一篇',
        'next': '下一篇',
        'more': '更多文章',
        'minutes': '{n} 分钟阅读',
        'sources_back': '‹ 返回文章',
    },
    'en': {
        'index_title': 'Blog · AutoClip',
        'index_desc': 'Research notes and memos from the AutoClip team, newest first.',
        'index_kicker': 'Blog',
        'index_h1': 'Research and memos',
        'index_lede': 'Research notes and memos. Newest first.',
        'feed': 'RSS feed',
        'toc': 'On this page',
        'back': '‹ Blog',
        'prev': 'Previous',
        'next': 'Next',
        'more': 'More posts',
        'minutes': '{n} min read',
        'sources_back': '‹ Back to the note',
    },
}


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
    slug = _ctx['slug']
    if url in ('article-en.md', 'article-zh.md'):
        target = ('en/' if url.endswith('en.md') else '') + f'blog/{slug}/'
        return rel_to(page_route, target)
    if url == 'sources.md':
        base = f'blog/{slug}/sources/'
        return rel_to(page_route, ('en/' if language == 'en' else '') + base)
    if url.startswith('figures/'):
        return rel_to(page_route, f'blog/{slug}/{url}')
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


def render_body(markdown, page_route, language, slug):
    _ctx['slug'] = slug
    _, body = front_matter(markdown)
    parts = []
    toc = []
    counters = [0, 0]
    seen_paragraph = False
    for block in blocks(body):
        kind = block[0]
        if kind == 'hr':
            parts.append('<hr>')
        elif kind == 'h':
            level, text = block[1], block[2]
            hid = ''
            if level == 2:
                counters[0] += 1
                counters[1] = 0
                anchor = f's-{counters[0]}'
                hid = f' id="{anchor}"'
                toc.append((2, anchor, _plain_inline(text)))
            elif level == 3 and counters[0]:
                counters[1] += 1
                anchor = f's-{counters[0]}-{counters[1]}'
                hid = f' id="{anchor}"'
                toc.append((3, anchor, _plain_inline(text)))
            parts.append(f'<h{level}{hid}>{inline(text, page_route, language)}</h{level}>')
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
    return '\n'.join(parts), toc


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

def parse_tags(raw):
    raw = str(raw).strip()
    if raw.startswith('[') and raw.endswith(']'):
        raw = raw[1:-1]
    return [part.strip().strip('"').strip("'") for part in raw.split(',') if part.strip()]


def reading_minutes(markdown, language):
    text = plain_markdown(markdown)
    cjk = len(re.findall(r'[\u4e00-\u9fff]', text))
    words = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text))
    if language == 'zh':
        minutes = cjk / 430 + words / 180
    else:
        minutes = words / 220 + cjk / 430
    return max(1, int(round(minutes or 1)))


def format_date(iso, language):
    year, month, day = [int(part) for part in iso.split('-')]
    if language == 'zh':
        return f'{year} 年 {month} 月 {day} 日'
    return f'{day} {MONTHS[month]} {year}'


def rss_date(iso):
    year, month, day = [int(part) for part in iso.split('-')]
    return format_datetime(datetime(year, month, day, tzinfo=timezone.utc))


def tag_text(tag, language):
    return TAG_LABEL.get(language, {}).get(tag, tag)


class Post:
    def __init__(self, meta, markdown):
        self.meta = meta
        self.markdown = markdown
        self.title = meta.get('title', '')
        self.date = meta.get('date', '')
        self.lang = meta.get('lang', '')
        self.slug = meta.get('slug', '')
        self.tags = parse_tags(meta.get('tags', ''))
        self.summary = meta.get('summary', '')
        self.cover = meta.get('cover', '')
        self.authors = meta.get('authors', '')
        self.listed = str(meta.get('listed', 'true')).lower() != 'false'
        self.role = meta.get('role', 'post')
        missing = [key for key in ('title', 'date', 'lang', 'slug') if not getattr(self, key if key != 'lang' else 'lang')]
        if missing:
            raise SystemExit('blog markdown is missing ' + ', '.join(missing))
        if self.listed and self.role == 'post' and (not self.summary or not self.cover or not self.tags):
            raise SystemExit(f'{self.slug} needs summary, cover and tags')
        self.minutes = reading_minutes(markdown, self.lang or 'en')

    def site_path(self, language=None):
        language = language or self.lang
        path = f'blog/{self.slug}/'
        if self.role == 'sources':
            path += 'sources/'
        if language == 'en':
            path = 'en/' + path
        return path

    def cover_path(self):
        if self.cover.startswith(('http://', 'https://')):
            return self.cover
        if self.cover.startswith('figures/'):
            return f'blog/{self.slug}/{self.cover}'
        return self.cover


def load_posts():
    posts = []
    if not CONTENT.exists():
        return posts
    for path in sorted(CONTENT.glob('*.md')):
        markdown = path.read_text()
        meta, _ = front_matter(markdown)
        if not meta.get('title'):
            heading = re.search(r'^# (.+)$', markdown, re.M)
            if heading:
                meta['title'] = heading.group(1)
        posts.append(Post(meta, markdown))
    return posts


def public_routes():
    found = ['blog/']
    for post in load_posts():
        path = f'blog/{post.slug}/sources/' if post.role == 'sources' else f'blog/{post.slug}/'
        if path not in found:
            found.append(path)
    return found


def listed_posts(posts, language):
    rows = [post for post in posts if post.listed and post.role == 'post' and post.lang == language]
    rows.sort(key=lambda post: (post.date, post.slug), reverse=True)
    return rows


def neighbors(post, posts):
    series = listed_posts(posts, post.lang)
    if post not in series:
        return None, None
    index = series.index(post)
    older = series[index + 1] if index + 1 < len(series) else None
    newer = series[index - 1] if index else None
    return older, newer


def footer_html(page_route, language, labels):
    shell = (ROOT / 'index.html').read_text()
    footer = re.search(r'<footer class="footer site-footer">[\s\S]*?</footer>', shell)
    if not footer:
        raise SystemExit('homepage footer missing')
    block = footer.group(0)
    if 'data-f="blog"' not in block:
        raise SystemExit('homepage footer is missing the blog link')

    def href_repl(match):
        href = match.group(1)
        if href.startswith(('http://', 'https://', 'mailto:')):
            return match.group(0)
        return 'href="' + esc(site_href(page_route, href, language)) + '"'

    block = re.sub(r'href="([^"]+)"', href_repl, block)

    def label_repl(match):
        key = match.group(1)
        label = labels[language].get(key, match.group(2))
        return 'data-f="' + key + '">' + esc(label) + '</'

    block = re.sub(r'data-f="([^"]+)">([^<]*)</', label_repl, block)
    if language == 'en':
        block = block.replace('aria-label="页脚"', 'aria-label="Footer"')
    if page_route.startswith('blog/') or page_route.startswith('en/blog/'):
        current = site_href(page_route, 'blog/', language)
        block = block.replace(
            'href="' + current + '" data-f="blog"',
            'href="' + current + '" data-f="blog" aria-current="page"',
            1,
        )
    return block


def header_html(page_route, language, home):
    copy = home[language]
    nav = [
        ('#clips', 'nav.clips'),
        ('#numbers', 'nav.numbers'),
        ('#developers', 'nav.developers'),
        ('#faq', 'nav.faq'),
        ('blog/', 'nav.blog'),
    ]
    links = []
    for href, key in nav:
        extra = ' class="nav-blog" aria-current="page"' if key == 'nav.blog' else ''
        links.append(f'<a{extra} href="{esc(site_href(page_route, href, language))}">{esc(copy[key])}</a>')
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
    nav_label = '主导航' if language == 'zh' else 'Main navigation'
    return f'''<header class="nav">
  <div class="container nav-in">
    <a class="brand serif" href="{esc(site_href(page_route, '#top', language))}" aria-label="AutoClip"><img src="{esc(asset(page_route, 'logo.svg'))}" alt="">AutoClip</a>
    <nav class="nav-links" aria-label="{nav_label}">
      {''.join(links)}
    </nav>
    <div class="nav-right">
      <div class="lang">
        <select id="language" aria-label="Language / 语言">
          {''.join(opts)}
        </select>
      </div>
      <a class="btn btn-primary btn-sm" href="{esc(site_href(page_route, '#download', language))}">{esc(copy['nav.cta'])}</a>
    </div>
  </div>
</header>'''


_EVIDENCE = re.compile(
    r'\s*(?:（[^）]*证据[:：][^）]*）|\([^)]*(?:High|Medium|Low)[^)]*\))\s*$'
)
_TOC_SHORT = {
    '3. 发现：什么在预测播放': '3. 发现',
    '4. 这对 AutoClip 意味着什么': '4. 对 AutoClip',
    '5. 我们保留的包装手法 Top 10（附参数）': '5. 包装手法 Top 10',
    '6. 四轮自制模板，我们学到的包装经验': '6. 四轮模板',
    '7. 准备在我们自己的切片号上验证的假设': '7. 待验证的假设',
    '附录：完整缩略图总览（我们自己的成片）': '附录',
    '图片来源 / 参考': '图片来源',
    '2.2 证据卫生：怎么避免自己骗自己': '2.2 证据卫生',
    '2.3 本文用到的术语': '2.3 术语',
    '发现 1：同一个模板，结果天差地别': '发现 1：同模板，结果天差地别',
    '发现 2：入点。前约 1.5 秒要有人脸或"看得见的事件"': '发现 2：入点',
    '发现 3：具体的标题写"人名 + 具体行为 / 数字"': '发现 3：具体的标题',
    '发现 4：能独立成立的一句话，胜过需要上下文的': '发现 4：能独立成立',
    '发现 5：默认越短越好，但有一个明确的例外': '发现 5：默认越短越好',
    '发现 6：包装手法是手艺，高播低播都在用': '发现 6：包装是手艺',
    '每条手法的画面示例': '画面示例',
    '3. Findings: what predicts views': '3. Findings',
    '4. What this means for AutoClip': '4. For AutoClip',
    '5. The top-10 packaging techniques we kept (with parameters)': '5. Top 10 techniques',
    '6. What four rounds of our own templates taught us about packaging': '6. Four template rounds',
    '7. Open hypotheses we will test on our own clip account': '7. Hypotheses',
    'Appendix: full thumbnail overviews (our renders)': 'Appendix',
    'Figure credits / References': 'Credits',
    '2.1 What we sampled': '2.1 Sample',
    '2.2 Evidence hygiene: how we tried not to fool ourselves': '2.2 Evidence hygiene',
    '2.3 Terms used in this note': '2.3 Terms',
    'Finding 1 — Same template, wildly different outcomes': 'Finding 1: Same template',
    'Finding 2 — The start point: a face or a visible event in the first ~1.5 s': 'Finding 2: The start',
    'Finding 3 — Specific titles name a person plus a concrete act or number': 'Finding 3: Specific titles',
    'Finding 4 — A self-contained line beats context-dependent ones': 'Finding 4: A complete line',
    'Finding 5 — Shorter by default, with a clear exception': 'Finding 5: Shorter by default',
    'Finding 6 — Packaging techniques are craft, used by hits and flops alike': 'Finding 6: Packaging is craft',
    'Visual examples, one figure per technique': 'Visual examples',
}


def short_toc(text):
    cleaned = _EVIDENCE.sub('', text).strip()
    return _TOC_SHORT.get(cleaned, cleaned)


def toc_html(toc, language):
    if not toc:
        return ''
    label = COPY[language]['toc']
    sections = []
    current = None
    for level, anchor, text in toc:
        link = f'<a href="#{esc(anchor)}">{esc(short_toc(text))}</a>'
        if level == 2 or current is None:
            current = [link, []]
            sections.append(current)
        else:
            current[1].append(link)
    items = []
    for link, children in sections:
        nested = ''
        if children:
            nested = '<ol>' + ''.join(f'<li>{child}</li>' for child in children) + '</ol>'
        items.append(f'<li class="toc-section">{link}{nested}</li>')
    return f'<nav class="toc" aria-label="{esc(label)}"><p>{esc(label)}</p><ol>{"".join(items)}</ol></nav>'


def pager_html(older, newer, page_route, language):
    if not older and not newer:
        return ''

    def cell(post, kind):
        if not post:
            return '<span></span>'
        label = COPY[language]['prev' if kind == 'prev' else 'next']
        href = rel_to(page_route, post.site_path(language))
        return f'<a class="{kind}" href="{esc(href)}"><span>{esc(label)}</span><strong>{esc(post.title)}</strong></a>'

    label = COPY[language]['more']
    return f'<nav class="post-pager" aria-label="{esc(label)}">{cell(older, "prev")}{cell(newer, "next")}</nav>'


def alternates(zh_url, en_url):
    default = zh_url or en_url
    lines = []
    if zh_url:
        lines.append(f'<link rel="alternate" hreflang="zh-CN" href="{esc(zh_url)}">')
    if en_url:
        lines.append(f'<link rel="alternate" hreflang="en" href="{esc(en_url)}">')
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{esc(default)}">')
    return '\n'.join(lines)


def document(page_route, language, title, description, image, zh_url, en_url, jsonld, main, footer_labels, home, source_path):
    canonical = SITE + page_route
    html_lang = 'zh-CN' if language == 'zh' else 'en'
    locale = 'zh_CN' if language == 'zh' else 'en_US'
    feed = ('en/' if language == 'en' else '') + 'blog/feed.xml'
    head_links = alternates(zh_url, en_url)
    return f'''<!DOCTYPE html>
<html lang="{html_lang}" data-static-language="{language}" data-source-path="{esc(source_path)}">
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
<meta property="og:locale" content="{locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{esc(image)}">
<link rel="icon" href="{esc(asset(page_route, 'logo.svg'))}">
{head_links}
<link rel="alternate" type="application/rss+xml" title="{esc(COPY[language]['index_title'])}" href="{esc(rel_to(page_route, feed))}">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Noto+Sans+SC:wght@400;500&amp;family=Noto+Serif+SC:wght@600&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="{esc(asset(page_route, 'tokens.css'))}">
<link rel="stylesheet" href="{esc(asset(page_route, 'assets/home.css?v=2026-10-09-blog'))}">
<link rel="stylesheet" href="{esc(asset(page_route, 'assets/blog.css?v=2026-10-09-toc'))}">
<script type="application/ld+json">
{json.dumps(jsonld, ensure_ascii=False, indent=2)}
</script>
<script src="{esc(asset(page_route, 'assets/language-routing.js'))}"></script>
</head>
<body class="blog-page">
{header_html(page_route, language, home)}
__MAIN__
{footer_html(page_route, language, footer_labels)}
<script src="{esc(asset(page_route, 'assets/footer.js'))}"></script>
<script src="{esc(asset(page_route, 'assets/analytics-config.js'))}"></script>
<script src="{esc(asset(page_route, 'assets/analytics.js'))}"></script>
<script>
document.getElementById('language').addEventListener('change', function (event) {{
  var lang = event.target.value;
  if (lang === 'zh' || lang === 'en') return;
  var en = document.querySelector('link[rel="alternate"][hreflang="en"]');
  if (en) location.assign(en.href);
}});
(function () {{
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if (!links.length) return;
  var byId = {{}};
  links.forEach(function (link) {{ byId[link.getAttribute('href').slice(1)] = link; }});
  var current = null;
  function setCurrent(id) {{
    var next = byId[id];
    if (!next || next === current) return;
    if (current) current.removeAttribute('aria-current');
    current = next;
    current.setAttribute('aria-current', 'true');
    document.querySelectorAll('.toc-section.is-open').forEach(function (el) {{
      el.classList.remove('is-open');
    }});
    var section = next.closest('.toc-section');
    if (section) section.classList.add('is-open');
  }}
  var headings = Array.prototype.slice.call(document.querySelectorAll('.post-body h2[id], .post-body h3[id]'));
  var frame = 0;
  function update() {{
    var line = window.innerHeight * 0.32;
    var id = null;
    headings.forEach(function (heading) {{
      if (heading.getBoundingClientRect().top <= line) id = heading.id;
    }});
    if (!id) {{
      if (current) current.removeAttribute('aria-current');
      current = null;
      document.querySelectorAll('.toc-section.is-open').forEach(function (el) {{
        el.classList.remove('is-open');
      }});
      return;
    }}
    setCurrent(id);
  }}
  window.addEventListener('scroll', function () {{
    if (!frame) frame = requestAnimationFrame(function () {{ frame = 0; update(); }});
  }}, {{ passive: true }});
  update();
}})();
</script>
</body>
</html>
'''.replace('__MAIN__', main)


def index_main(posts, page_route, language):
    copy = COPY[language]
    cards = []
    for post in listed_posts(posts, language):
        tags = ''.join(f'<span class="tag">{esc(tag_text(tag, language))}</span>' for tag in post.tags[:1])
        minutes = copy['minutes'].format(n=post.minutes)
        cards.append(
            f'<a class="blog-card" href="{esc(rel_to(page_route, post.site_path(language)))}">'
            f'<img src="{esc(rel_to(page_route, post.cover_path()))}" alt="">'
            f'<div><p class="post-kicker">{tags}<time datetime="{esc(post.date)}">{esc(format_date(post.date, language))}</time>'
            f'<span>{esc(minutes)}</span></p>'
            f'<h2>{esc(post.title)}</h2><p>{esc(post.summary)}</p></div></a>'
        )
    return f'''<main class="blog-index">
  <div class="blog-wrap">
    <header class="blog-head">
      <span class="eyebrow">{esc(copy['index_kicker'])}</span>
      <h1>{esc(copy['index_h1'])}</h1>
      <p class="lede">{esc(copy['index_lede'])}</p>
      <a class="blog-feed" href="{esc(rel_to(page_route, ('en/' if language == 'en' else '') + 'blog/feed.xml'))}">{esc(copy['feed'])}</a>
    </header>
    <div class="blog-list">
      {''.join(cards)}
    </div>
  </div>
</main>'''


def post_main(post, posts, page_route, language):
    body, toc = render_body(post.markdown, page_route, language, post.slug)
    assert_wording(post.markdown, body)
    copy = COPY[language]
    if post.role == 'sources':
        back_href = rel_to(page_route, ('en/' if language == 'en' else '') + f'blog/{post.slug}/')
        back_label = copy['sources_back']
    else:
        back_href = site_href(page_route, 'blog/', language)
        back_label = copy['back']
    bits = [f'<span class="tag">{esc(tag_text(tag, language))}</span>' for tag in post.tags[:1]]
    bits.append(f'<time datetime="{esc(post.date)}">{esc(format_date(post.date, language))}</time>')
    bits.append(f'<span>{esc(copy["minutes"].format(n=post.minutes))}</span>')
    if post.authors and post.role == 'post':
        bits.append(f'<span>{esc(post.authors)}</span>')
    older, newer = neighbors(post, posts) if post.role == 'post' else (None, None)
    article_lang = 'en' if post.lang == 'en' else 'zh-CN'
    return (
        '<main>\n  <div class="blog-wrap post-layout">\n    '
        + toc_html(toc, language)
        + f'\n    <a class="post-back" href="{esc(back_href)}">{esc(back_label)}</a>\n'
        + f'    <header class="post-hero"><p class="post-kicker">{"".join(bits)}</p></header>\n'
        + f'    <article class="post-body" lang="{article_lang}">'
        + body
        + '</article>\n    '
        + pager_html(older, newer, page_route, language)
        + '\n  </div>\n</main>'
    )


def article_jsonld(post, page_route, language, image):
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'description': post.summary or post.title,
        'image': image,
        'datePublished': post.date,
        'dateModified': post.date,
        'inLanguage': 'zh-CN' if post.lang == 'zh' else 'en',
        'keywords': ', '.join(tag_text(tag, language) for tag in post.tags),
        'url': SITE + page_route,
        'mainEntityOfPage': SITE + page_route,
        'author': {'@type': 'Organization', 'name': 'AutoClip', 'url': SITE},
        'publisher': {'@type': 'Organization', 'name': 'AutoClip', 'url': SITE},
    }


def index_jsonld(posts, language):
    entries = []
    for post in listed_posts(posts, language):
        entries.append({
            '@type': 'BlogPosting',
            'headline': post.title,
            'datePublished': post.date,
            'url': SITE + post.site_path(language),
            'image': SITE + post.cover_path(),
            'description': post.summary,
        })
    return {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': COPY[language]['index_title'],
        'description': COPY[language]['index_desc'],
        'url': SITE + ('en/' if language == 'en' else '') + 'blog/',
        'inLanguage': 'zh-CN' if language == 'zh' else 'en',
        'blogPost': entries,
    }


def feed_xml(posts, language):
    copy = COPY[language]
    page = ('en/' if language == 'en' else '') + 'blog/'
    items = []
    for post in listed_posts(posts, language):
        link = SITE + post.site_path(language)
        items.append(
            '<item>'
            f'<title>{esc(post.title)}</title>'
            f'<link>{esc(link)}</link>'
            f'<guid isPermaLink="true">{esc(link)}</guid>'
            f'<pubDate>{rss_date(post.date)}</pubDate>'
            f'<description>{esc(post.summary)}</description>'
            '</item>'
        )
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<rss version="2.0">\n<channel>\n'
        f'<title>{esc(copy["index_title"])}</title>\n'
        f'<link>{esc(SITE + page)}</link>\n'
        f'<description>{esc(copy["index_desc"])}</description>\n'
        f'<language>{"zh-CN" if language == "zh" else "en"}</language>\n'
        f'<lastBuildDate>{rss_date(listed_posts(posts, language)[0].date if listed_posts(posts, language) else "2026-10-09")}</lastBuildDate>\n'
        + '\n'.join(items) + '\n</channel>\n</rss>\n'
    )


def sync_sitemap(entries):
    path = ROOT / 'sitemap.xml'
    text = path.read_text()
    text = re.sub(
        r'\n[ \t]*<url>\s*<loc>https://zhouxiaoka\.github\.io/autoclip_intro/(?:en/)?(?:blog|research)/[^<]*</loc>\s*<lastmod>[^<]*</lastmod>\s*</url>',
        '',
        text,
    )
    text = re.sub(r'\n*</urlset>\s*$', '\n</urlset>\n', text)
    block = ''.join(
        f'\n  <url>\n    <loc>{SITE}{loc}</loc>\n    <lastmod>{day}</lastmod>\n  </url>'
        for loc, day in entries
    )
    text = text.replace('</urlset>', block + '\n</urlset>', 1)
    return path, text


def sync_language_routes(paths):
    path = ROOT / 'assets/language-routing.js'
    text = path.read_text()
    match = re.search(r'const routes = new Set\(\[([^\]]*)\]\)', text)
    if not match:
        raise SystemExit('language routes not found')
    items = re.findall(r"'([^']*)'", match.group(1))
    items = [item for item in items if not item.startswith('blog/') and not item.startswith('research/')]
    for item in paths:
        if item not in items:
            items.append(item)
    rendered = 'const routes = new Set([' + ', '.join(f"'{item}'" for item in items) + '])'
    updated = text[:match.start()] + rendered + text[match.end():]
    return path, updated


def write_if_changed(path, text, check, changed):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text() != text:
        changed.append(str(path.relative_to(ROOT)))
        if not check:
            path.write_text(text)


def build(check=False, footer=None, home=None):
    if footer is None or home is None:
        from build_search_pages import catalogs
        data = catalogs()
        footer = footer or data['footer']
        home = home or data['home']
    from build_search_pages import ROUTES
    ROUTES.update(public_routes())
    posts = load_posts()
    for post in posts:
        if post.cover and not post.cover.startswith(('http://', 'https://')):
            target = ROOT / post.cover_path()
            if not target.exists():
                raise SystemExit('missing cover ' + str(target.relative_to(ROOT)))
    changed = []
    newest = ''
    for language in ('zh', 'en'):
        rows = listed_posts(posts, language)
        if rows and rows[0].date > newest:
            newest = rows[0].date
    if not newest:
        newest = '2026-10-09'
    sitemap_entries = []
    for language in ('zh', 'en'):
        route = ('en/' if language == 'en' else '') + 'blog/'
        rows = listed_posts(posts, language)
        image = SITE + rows[0].cover_path() if rows else SITE + 'img/og.png'
        zh_url = SITE + 'blog/'
        en_url = SITE + 'en/blog/'
        main = index_main(posts, route, language)
        text = document(
            route, language, COPY[language]['index_title'], COPY[language]['index_desc'],
            image, zh_url, en_url, index_jsonld(posts, language), main, footer, home, 'blog/',
        )
        write_if_changed(ROOT / route / 'index.html', text, check, changed)
        write_if_changed(ROOT / route / 'feed.xml', feed_xml(posts, language), check, changed)
        sitemap_entries.append((route, newest))
    for post in posts:
        languages = ('zh', 'en') if post.role == 'sources' else (post.lang,)
        for language in languages:
            route = post.site_path(language)
            if post.role == 'sources':
                zh_url = SITE + post.site_path('zh')
                en_url = SITE + post.site_path('en')
            else:
                zh_post = next((item for item in posts if item.slug == post.slug and item.lang == 'zh' and item.role == 'post'), None)
                en_post = next((item for item in posts if item.slug == post.slug and item.lang == 'en' and item.role == 'post'), None)
                zh_url = SITE + zh_post.site_path('zh') if zh_post else ''
                en_url = SITE + en_post.site_path('en') if en_post else ''
            image = SITE + post.cover_path() if post.cover else SITE + 'img/og.png'
            description = post.summary or post.title
            main = post_main(post, posts, route, language)
            text = document(
                route, language, post.title, description, image, zh_url, en_url,
                article_jsonld(post, route, language, image), main, footer, home,
                route[3:] if route.startswith('en/') else route,
            )
            write_if_changed(ROOT / route / 'index.html', text, check, changed)
            sitemap_entries.append((route, post.date))
    sitemap_path, sitemap = sync_sitemap(sitemap_entries)
    write_if_changed(sitemap_path, sitemap, check, changed)
    route_path, route_js = sync_language_routes(public_routes())
    write_if_changed(route_path, route_js, check, changed)
    for stale in (
        ROOT / 'research/what-drives-views/index.html',
        ROOT / 'research/what-drives-views/sources/index.html',
        ROOT / 'en/research/what-drives-views/index.html',
        ROOT / 'en/research/what-drives-views/sources/index.html',
    ):
        if stale.exists():
            changed.append(str(stale.relative_to(ROOT)))
            if not check:
                stale.unlink()
    if changed:
        print(('Out of date: ' if check else 'Updated blog: ') + ', '.join(changed))
    return bool(changed) if check else False


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true')
    raise SystemExit(build(ap.parse_args().check))
