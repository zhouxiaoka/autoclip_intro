import json
from pathlib import Path
import re
import subprocess
import unittest
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT=Path(__file__).resolve().parents[1]


class SearchPages(unittest.TestCase):
    def test_generator_is_current_and_idempotent(self):
        subprocess.run(['python3',str(ROOT/'scripts/build_search_pages.py'),'--check'],cwd=ROOT,check=True)

    def test_english_pages_have_static_content_self_canonicals_and_real_language_pairs(self):
        from build_search_pages import SOURCES, route
        for path in [route(source) for source in SOURCES]:
            p=ROOT/'en'/path/'index.html';text=p.read_text()
            body=text.split('<body',1)[1].split('<script',1)[0]
            self.assertRegex(text,r'<html lang="en"[^>]*data-static-language="en"')
            self.assertRegex(body,r'<h1[^>]*>[^<]*\S')
            self.assertNotRegex(body,r'<(?:h1|h3|p)[^>]*data-copy[^>]*>\s*</')
            self.assertIn('rel="canonical" href="https://zhouxiaoka.github.io/autoclip_intro/en/'+path+'"',text)
            self.assertEqual(re.findall(r'hreflang="([^"]+)"',text),['zh-CN','en','x-default'])
            self.assertIn('hreflang="zh-CN" href="https://zhouxiaoka.github.io/autoclip_intro/'+path+'"',text)
            if not path:self.assertIn('Cloud transcription, image generation and publishing-service fees are excluded.',body)

    def test_case_video_schema_matches_playable_output_and_sitemap_has_all_articles(self):
        from xml.etree import ElementTree
        entries=json.loads((ROOT/'data/growth-content.json').read_text())
        urls={x.text for x in ElementTree.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
        for path,item in entries.items():
            for language in ['zh','en']:
                prefix='en/' if language=='en' else ''
                url='https://zhouxiaoka.github.io/autoclip_intro/'+prefix+path
                self.assertIn(url,urls)
                text=(ROOT/(prefix+path+'index.html')).read_text()
                graph=json.loads(re.search(r'<script type="application/ld\+json">([\s\S]*?)</script>',text)[1])['@graph']
                article=next(x for x in graph if x['@type']=='Article')
                self.assertEqual(article['url'],url)
                self.assertEqual(article['headline'],item[language]['title'].removesuffix(' | AutoClip'))
                if item['kind']=='case':
                    video=next(x for x in graph if x['@type']=='VideoObject')
                    self.assertIn('src="'+video['contentUrl']+'"',text)
                    self.assertIn('poster="'+video['thumbnailUrl']+'"',text)
                    self.assertEqual(video['url'],url)

    def test_generated_pages_reference_existing_local_files(self):
        class Links(HTMLParser):
            def __init__(self):super().__init__();self.links=[]
            def handle_starttag(self,tag,attrs):
                d=dict(attrs)
                for k in ['href','src','poster']:
                    if d.get(k):self.links.append((tag,k,d[k]))
        for p in (ROOT/'en').rglob('index.html'):
            links=Links();links.feed(p.read_text())
            for tag,key,value in links.links:
                u=urlsplit(value)
                if u.scheme or u.netloc or not u.path or u.path.startswith('/'):continue
                target=(p.parent/unquote(u.path)).resolve()
                self.assertTrue(target.exists(),str(p.relative_to(ROOT))+': '+value)
                if target.is_dir() and tag=='a':self.assertTrue((target/'index.html').exists(),value)

    def test_faq_schema_matches_visible_product_facts(self):
        for language in ['zh','en']:
            text=(ROOT/('en/index.html' if language=='en' else 'index.html')).read_text()
            d=json.loads(re.search(r'<script type="application/ld\+json">([\s\S]*?)</script>',text)[1])
            faq=next(x for x in d['@graph'] if x['@type']=='FAQPage')
            for i,question in enumerate(faq['mainEntity'],1):
                # HTML entities are decoded by the parser, as crawlers see them.
                from html import unescape
                q=re.search(fr'data-i18n="faq.{i}.q">([^<]*)',text)[1]
                a=re.search(fr'data-i18n="faq.{i}.a">([^<]*)',text)[1]
                self.assertEqual(unescape(q),question['name']);self.assertEqual(unescape(a),question['acceptedAnswer']['text'])


if __name__=='__main__':unittest.main()
