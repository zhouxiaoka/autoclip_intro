"""Build substantive guides and evidence pages from reviewed bilingual content."""
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://zhouxiaoka.github.io/autoclip_intro/'
MEDIA = 'https://pub-3fb92949b9c2480b89feec5ec03f3540.r2.dev/cases/'


def e(value):
    return html.escape(str(value), quote=True)


def render(path, item, contents):
    shell = (ROOT/'use-cases/podcast/index.html').read_text()
    header = re.search(r'<header[\s\S]*?</header>', shell)[0]
    footer = re.search(r'<footer[\s\S]*?</footer>', shell)[0]
    for old,new in [('href="./"','href="../../use-cases/podcast/"'),('href="../course/"','href="../../use-cases/course/"'),('href="../gameplay/"','href="../../use-cases/gameplay/"')]:
        footer=footer.replace(old,new)
    copies = {}
    for lang in ('zh', 'en'):
        d = item[lang]
        c = {'title':d['title'], 'meta.desc':d['lede'], 'h1':d['title'].removesuffix(' | AutoClip'),
             'lede':d['lede'], 'download':'下载' if lang=='zh' else 'Download',
             'back':'‹ 首页' if lang=='zh' else '‹ Home',
             'eyebrow':('实测案例' if item['kind']=='case' else '使用教程') if lang=='zh' else ('Recorded case' if item['kind']=='case' else 'Guide'),
             'related':'继续阅读' if lang=='zh' else 'Read next',
             'source':'查看原片' if lang=='zh' else 'View original source',
             'cover':'这条成片的自动封面' if lang=='zh' else 'Automatic cover for this output',
             'rights':'原片版权属于原作者。此页展示已有公开案例的自动输出，不构成转发授权。' if lang=='zh' else 'The source belongs to its original creator. This page demonstrates an existing public output and does not grant redistribution rights.',
             'install':'安装与故障排查' if lang=='zh' else 'Installation and troubleshooting',
             'cli':'CLI / MCP 文档' if lang=='zh' else 'CLI / MCP documentation',
             'models':'模型配置文档' if lang=='zh' else 'Model configuration'}
        for i,(h,p) in enumerate(d['sections']): c.update({f's{i}h':h,f's{i}p':p})
        if item.get('original'):
            c['rights'] = '原创教程与合成旁白，可用于介绍 AutoClip，请保留来源标注。' if lang=='zh' else 'Original lesson with synthetic narration. Reuse to introduce AutoClip with source attribution.'
            c['srt'] = '下载配套 SRT' if lang=='zh' else 'Download matching SRT'
            c['receipt'] = '查看运行记录' if lang=='zh' else 'View run receipt'
            c['workflow'] = '55 秒流程演示（静音双语）' if lang=='zh' else '55-second workflow film (silent, bilingual)'
            c['library'] = '查看完整案例库' if lang=='zh' else 'Open the complete case library'
        for i,link in enumerate(item['links']): c[f'link{i}'] = contents[link][lang]['title'].removesuffix(' | AutoClip')
        copies[lang]=c
    c=copies['zh']
    main = f'<a class="back" href="../../" data-copy="back">{e(c["back"])}</a><span class="eyebrow" data-copy="eyebrow">{c["eyebrow"]}</span><h1 data-copy="h1">{e(c["h1"])}</h1>'
    graph=[{'@type':'Article','headline':c['h1'],'description':c['lede'],'inLanguage':'zh-CN',
            'datePublished':'2026-10-02','dateModified':'2026-10-02','url':SITE+path,
            'author':{'@type':'Organization','name':'AutoClip','url':SITE},
            'mainEntityOfPage':SITE+path}]
    if item['kind']=='case':
        case=json.loads((ROOT/'cases'/item['case_id']/'case.json').read_text())
        out=case['outputs'][0]
        media=MEDIA+item['case_id']+'/'
        main+=f'<video class="case-watch" controls playsinline preload="metadata" poster="{e(media+out["poster"])}"><source src="{e(media+out["video"])}" type="video/mp4"></video>'
        main+=f'<p class="source-note"><a href="{e(case["source"]["url"])}" target="_blank" rel="noopener" data-copy="source">{c["source"]}</a> · <span data-copy="rights">{c["rights"]}</span></p>'
        graph.append({'@type':'VideoObject','name':c['h1'],'description':c['lede'],'inLanguage':'zh-CN',
                      'thumbnailUrl':media+out['poster'],'contentUrl':media+out['video'],
                      'uploadDate':case['added']+'T00:00:00+08:00','duration':f'PT{out["duration_sec"]}S','url':SITE+path})
    main+=f'<p class="lede" data-copy="lede">{e(c["lede"])}</p>'
    for i,_ in enumerate(item['zh']['sections']):
        main+=f'<section class="article-section"><h2 data-copy="s{i}h">{e(c[f"s{i}h"])}</h2><p data-copy="s{i}p">{e(c[f"s{i}p"])}</p></section>'
        if i==2 and item['kind']=='case':
            main+=f'<figure class="output-cover"><img src="{e(media+out["cover"])}" alt="{e(out.get("post",{}).get("title",c["h1"]))}" loading="lazy"><figcaption data-copy="cover">{c["cover"]}</figcaption></figure>'
    main+=f'<nav class="article-related"><h2 data-copy="related">{c["related"]}</h2>'
    for i,link in enumerate(item['links']):main+=f'<a href="../../{link}" data-copy="link{i}">{e(c[f"link{i}"])}</a>'
    main+='</nav><div class="article-resources">'
    if item.get('original'):
        for key,file in [('srt','source.srt'),('receipt','run-receipt.json'),('workflow','workflow-55s.mp4')]:
            main+=f'<a href="{e(media+file)}" data-copy="{key}">{c[key]}</a>'
        main+=f'<a href="../../cases/" data-copy="library">{c["library"]}</a>'
    for key,file in [('install','USER_INSTALLATION_GUIDE.md'),('models','MULTI_LLM_PROVIDER_GUIDE.md'),('cli','CLI_AND_MCP.md')]:
        main+=f'<a href="https://github.com/zhouxiaoka/autoclip/blob/main/docs/{file}" target="_blank" rel="noopener" data-copy="{key}">{c[key]}</a>'
    main+='</div><div class="inner-cta"><a class="btn btn-primary" href="../../#download" data-copy="download">下载</a></div>'
    return f'''<!DOCTYPE html>
<html lang="zh-CN" data-media-origin="https://pub-3fb92949b9c2480b89feec5ec03f3540.r2.dev"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(c['title'])}</title><meta name="description" content="{e(c['lede'])}">
<link rel="canonical" href="{SITE+path}"><meta property="og:title" content="{e(c['title'])}"><meta property="og:description" content="{e(c['lede'])}"><meta property="og:url" content="{SITE+path}"><meta property="og:type" content="article">
<link rel="icon" href="../../logo.svg"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Noto+Sans+SC:wght@400;500&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="../../tokens.css"><link rel="stylesheet" href="../../assets/home.css"><link rel="stylesheet" href="../../assets/article.css">
<script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script>
</head><body class="cases-page"><div class="site-flow">{header}<main class="stage article-main"><article class="container article-content">{main}</article></main>{footer}<div class="footer-reveal-end" aria-hidden="true"></div></div>
<script>window.INNER_COPY = {json.dumps(copies,ensure_ascii=False)};</script>
<script src="../../assets/inner-page.js"></script><script src="../../assets/footer.js"></script><script src="../../assets/analytics-config.js"></script><script src="../../assets/analytics.js"></script>
</body></html>
'''


def build(check=False):
    contents=json.loads((ROOT/'data/growth-content.json').read_text())
    changed=[]
    # Compare against the generated static zh form, so check mode is reproducible.
    from build_search_pages import Render, catalogs, schema
    footer=catalogs()['footer']['zh']
    for path,item in contents.items():
        raw=render(path,item,contents)
        copy=json.loads(re.search(r'window.INNER_COPY = ([\s\S]*?);</script>',raw)[1])['zh']
        source=path+'index.html'
        raw=re.sub(r'\s*</head>', '</head>', raw)
        p=Render(source,source,'zh',copy,footer);p.feed(schema(raw,'zh',copy,source));text=''.join(p.out)
        target=ROOT/source
        if not target.exists() or target.read_text()!=text:
            changed.append(source)
            if not check:target.parent.mkdir(parents=True,exist_ok=True);target.write_text(text)
    if changed:print(('Out of date: ' if check else 'Updated: ')+', '.join(changed))
    return bool(changed)
