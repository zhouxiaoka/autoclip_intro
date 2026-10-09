"""Generate crawlable zh/en HTML from the site's existing translation catalogs.

Run after copy/release changes; --check verifies checked-in pages are current.
No network access or third-party dependencies are needed.
"""
import argparse
import html
import json
import os
from pathlib import Path
import re
import subprocess
from html.parser import HTMLParser
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://zhouxiaoka.github.io/autoclip_intro/'
SOURCES = ['index.html', 'cases/index.html', 'use-cases/podcast/index.html',
           'use-cases/course/index.html', 'use-cases/gameplay/index.html',
           'features/publish/index.html', 'features/auto-cover/index.html']
SOURCES += [p+'index.html' for p in json.loads((ROOT/'data/growth-content.json').read_text())]
ROUTES = {str(Path(p).parent).replace('.', '') + ('/' if Path(p).parent != Path('.') else '') for p in SOURCES}
ROUTES.update({'blog/'})
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}


def catalogs():
    code = r"""
const fs=require('node:fs'),vm=require('node:vm');
const home=fs.readFileSync('index.html','utf8');
const script=home.match(/<script>([\s\S]*?)<\/script>/)[1];
const context={};vm.runInNewContext(script.slice(script.indexOf('  var T ='),script.indexOf('  var isWin')),context);
const footer=fs.readFileSync('assets/footer.js','utf8');
const f={};vm.runInNewContext(footer.slice(footer.indexOf('const C='),footer.indexOf('function apply'))+';globalThis.copy=C',f);
const pages={};for(const p of process.argv.slice(1)){
 if(!fs.existsSync(p))continue;
 const h=fs.readFileSync(p,'utf8'),s=h.match(/<script>window.INNER_COPY\s*=([\s\S]*?)<\/script>/);
 if(s){const c={window:{}};vm.runInNewContext('window.INNER_COPY='+s[1],c);pages[p]=c.window.INNER_COPY;}
 else if(p==='cases/index.html') {const t=h.match(/<script>([\s\S]*?)<\/script>/)[1],c={};vm.runInNewContext(t.slice(t.indexOf('  var COPY ='),t.indexOf('  var ATTR')),c);pages[p]=c.COPY;}
}
process.stdout.write(JSON.stringify({home:context.T,footer:f.copy,pages}));
"""
    return json.loads(subprocess.check_output(['node','-e',code,*SOURCES],cwd=ROOT,text=True))


def route(path):
    return str(Path(path).parent).replace('.', '') + ('/' if Path(path).parent != Path('.') else '')


def relocate(value, source, destination, language, tag):
    """Rewrite a relative URL for the page that will contain it."""
    u = urlsplit(value)
    if u.scheme or u.netloc or not u.path or u.path.startswith('/'):
        return value
    target = os.path.normpath(os.path.join(os.path.dirname(source), u.path))
    normalized = target.removesuffix('/index.html') + '/' if target != '.' else ''
    if tag == 'a' and language == 'en' and normalized in ROUTES:
        target = 'en/' + normalized
    elif tag == 'a' and language == 'en' and normalized == 'guides/publish/':
        u = u._replace(query='lang=en')
    rel = os.path.relpath(target, os.path.dirname(destination) or '.')
    if u.path.endswith('/') or target.endswith('/') or target == '.': rel += '/'
    return urlunsplit(('', '', rel, u.query, u.fragment))


class Render(HTMLParser):
    def __init__(self, source, destination, language, copy, footer):
        super().__init__(convert_charrefs=False)
        self.source, self.destination, self.language = source, destination, language
        self.copy, self.footer = copy, footer
        self.out, self.skip = [], 0
        self.page = route(source)
        self.canonical = SITE + ('en/' if language == 'en' else '') + self.page

    def link(self, value, tag, key):
        return relocate(value, self.source, self.destination, self.language, tag)

    def handle_starttag(self, tag, attrs):
        if self.skip:
            if tag not in VOID: self.skip += 1
            return
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'alternate' and 'hreflang' in a: return
        if tag == 'html':
            a['lang'] = 'zh-CN' if self.language == 'zh' else 'en'
            a['data-static-language'] = self.language
            a['data-source-path'] = self.page
        if tag == 'link' and a.get('rel') == 'canonical': a['href'] = self.canonical
        for key in ('href','src','poster'):
            if key in a and not (tag == 'link' and a.get('rel') == 'canonical'):
                a[key] = self.link(a[key], tag, key)
        if tag == 'meta':
            name = a.get('name') or a.get('property')
            title = self.copy.get('title', '')
            description = self.copy.get('meta.desc') or self.copy.get('lede', '')
            if name in ('description','og:description','twitter:description') and description: a['content'] = description
            if name in ('og:title','twitter:title') and title: a['content'] = title
            if name == 'og:url': a['content'] = self.canonical
            if name == 'og:locale': a['content'] = 'zh_CN' if self.language == 'zh' else 'en_US'
        if tag == 'option' and a.get('value') in ('zh','en'):
            a.pop('selected', None)
            if a['value'] == self.language: a['selected'] = None
        self.out.append('<' + tag + ''.join(' '+k+(('="'+html.escape(v,quote=True)+'"') if v is not None else '') for k,v in a.items()) + '>')
        key = a.get('data-i18n') or a.get('data-i18n-html') or a.get('data-copy')
        value = self.footer.get(a['data-f']) if a.get('data-f') else self.copy.get(key)
        if tag == 'title': value = self.copy.get('title')
        if value is not None and tag not in VOID:
            if 'data-i18n-html' in a:
                value = re.sub(r'(href|src)="([^"]+)"', lambda m: m[1]+'="'+self.link(m[2],'a',m[1])+'"', value)
                self.out.append(value)
            else: self.out.append(html.escape(value))
            self.skip = 1

    def handle_endtag(self, tag):
        if self.skip:
            self.skip -= 1
            if not self.skip: self.out.append('</'+tag+'>')
            return
        if tag == 'head':
            self.out.append('\n<link rel="alternate" hreflang="zh-CN" href="'+SITE+self.page+'">\n<link rel="alternate" hreflang="en" href="'+SITE+'en/'+self.page+'">\n<link rel="alternate" hreflang="x-default" href="'+SITE+self.page+'">\n')
            asset = os.path.relpath('assets/language-routing.js',os.path.dirname(self.destination) or '.')
            self.out.append('<script src="'+asset+'"></script>\n')
        self.out.append('</'+tag+'>')

    def handle_startendtag(self, tag, attrs):
        if self.skip: return
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.handle_endtag(tag)

    def handle_data(self, data):
        if not self.skip: self.out.append(data)
    def handle_entityref(self, name):
        if not self.skip: self.out.append('&'+name+';')
    def handle_charref(self, name):
        if not self.skip: self.out.append('&#'+name+';')
    def handle_comment(self, data):
        if not self.skip: self.out.append('<!--'+data+'-->')
    def handle_decl(self, data): self.out.append('<!'+data+'>')


def schema(text, language, copy, source='index.html'):
    def replace(m):
        d = json.loads(m[1])
        for item in d.get('@graph', []):
            if item['@type'] in ('Article','VideoObject'):
                item['inLanguage'] = 'zh-CN' if language == 'zh' else 'en'
                item['url'] = SITE + ('en/' if language == 'en' else '') + route(source)
                item['description'] = copy['lede']
                if item['@type'] == 'Article':
                    item['headline'] = copy['h1'];item['mainEntityOfPage'] = item['url']
                else:
                    item['name'] = copy['h1']
                    dest = source if language == 'zh' else 'en/'+source
                    for key in ('contentUrl', 'thumbnailUrl'):
                        if item.get(key): item[key] = relocate(item[key], source, dest, language, 'video')
            if item['@type'] == 'SoftwareApplication':
                item['description'] = copy['meta.desc']
                item['softwareVersion'] = re.search(r"var REL = .*?v([\d.]+)/",text).group(1)
            if item['@type'] == 'FAQPage':
                item['inLanguage'] = 'zh-CN' if language == 'zh' else 'en'
                item['url'] = SITE + ('en/' if language == 'en' else '') + '#faq'
                item['mainEntity'] = [{'@type':'Question','name':copy[f'faq.{i}.q'],'acceptedAnswer':{'@type':'Answer','text':copy[f'faq.{i}.a']}} for i in (1,2,3)]
        return '<script type="application/ld+json">\n'+json.dumps(d,ensure_ascii=False,indent=2)+'\n</script>'
    return re.sub(r'<script type="application/ld\+json">([\s\S]*?)</script>',replace,text)


def build(check=False):
    from build_growth_content import build as build_content
    from build_blog import public_routes, build as build_blog
    ROUTES.update(public_routes())
    content_changed = build_content(check)
    c = catalogs()
    research_changed = build_blog(check, c['footer'], c['home'])
    changed = []
    for source in SOURCES:
        text = (ROOT/source).read_text()
        # Routing script is emitted once and remains reproducible after repeated runs.
        text = re.sub(r'\s*<script src="[^"]*assets/language-routing\.js"></script>', '', text)
        text = re.sub(r'\s*<link rel="alternate"[^>]*hreflang[^>]*>', '', text)
        text = re.sub(r'\s*</head>', '</head>', text)
        for language in ('zh','en'):
            destination = source if language == 'zh' else 'en/'+source
            copy = c['home'][language] if source == 'index.html' else c['pages'].get(source,{}).get(language,{})
            content = schema(text,language,copy,source)
            parser = Render(source,destination,language,copy,c['footer'][language]); parser.feed(content)
            result = ''.join(parser.out)
            target = ROOT/destination
            if not target.exists() or target.read_text() != result:
                changed.append(destination)
                if not check:
                    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(result)
    if changed: print(('Out of date: ' if check else 'Updated: ')+', '.join(changed))
    else: print('Search pages are current')
    return bool(changed) or content_changed or research_changed if check else False


if __name__ == '__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--check',action='store_true')
    raise SystemExit(build(ap.parse_args().check))
