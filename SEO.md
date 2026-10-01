# 官网流量、SEO 与 GEO

日期：2026-10-01。站点：https://zhouxiaoka.github.io/autoclip_intro/

官网访问量低，主要不是首页不好看，而是**发现层还在引用旧产品**。来了的人转化不差。不要把时间花在再做一版落地页。

## 线上事实（已同意访客，PostHog `surface=website`）

近 30 日：`website_pageview` 69 次 / 38 个浏览器；几乎都发生在 2026-10-01。

同窗口：下载安装包点击 24 次 / 20 人，案例播放 13 次 / 9 人。同意访客里大约一半点了下载。

来源（近 14 日 pageview）：直接访问最多，Google 英文 6 个访客，Bing 1 个，GitHub 2 个。百度几乎没有。语言以英文为主。

这是**同意后才上报**的下限，不是全站精确 UV。DNT / GPC、拦截器和未点「允许」的人都不计入。网站 `$pageview` 为 0，因为官网不用 PostHog 默认像素。

客户端 1.5.0 当天 Windows 生产日活已经到十几台。人和下载主要不经过官网搜索。

## 为什么搜索和 AI 帮不上忙

1. GitHub About 仍是旧句：`AI-powered video clipping and highlight generation · 一款智能高光提取与剪辑的二创工具`。Google 和多数模型先读这一行，不是官网 H1。
2. 外站和旧索引还在引用「视频高光 / Docker / 申请内测」。
3. `github.io` 项目站权重低，`llms.txt` 也不在域名根路径 `zhouxiaoka.github.io/llms.txt`。
4. 首页对比表和 FAQ 以前在静态 HTML 里是空的，不执行 JS 的爬虫看不到。这次已把中文默认正文写进 HTML，并加了 `llms.txt` / `llms-full.txt`、刷新 sitemap。

## 你这周做的三件事（比再改官网值钱）

1. **改 GitHub About**（Settings → General）  
   Description：`一个链接，一键出片。开源桌面工具，本地把长视频剪成抖音 / 小红书 / TikTok / Shorts。`  
   英文可作副句：`Open-source local clipper. One link, ready-to-post shorts.`  
   Website 保持官网。Topics 建议加上：`tiktok` `youtube-shorts` `douyin` `podcast` `opensource` `tauri`，拿掉空泛的 `auto` / `videos`。
2. **让爬虫重抓新文案**  
   [Google Search Console](https://search.google.com/search-console) 验证 `zhouxiaoka.github.io`，提交 `https://zhouxiaoka.github.io/autoclip_intro/sitemap.xml`，对首页和 `llms-full.txt` 点「请求编入索引」。Bing Webmaster 同样做一遍。
3. **把流量送到已经能转化的入口**  
   README 顶栏加官网（本次已改中英）。发 1.5.0 的地方（HelloGitHub、Trendshift、讨论区、你常去的创作者群）用现在这句「一个链接，一键出片」，不要再用「高光 / 内测」。

自定义域名（例如 `autoclip.sh` / `getautoclip.com`）能同时抬 SEO 和 GEO：`/llms.txt` 会出现在域根。有域名再做，不挡上面三步。

## 不要做的

- 不要再堆关键词页或「OpusClip 平替」薄页。首页已有对照表，`llms-full.txt` 已写给回答引擎。
- 不要为了统计关掉同意墙。看板名字继续叫「已同意访客」。
- 不要把 Sentry 或客户端日活解释成官网 UV。

## 本次仓库改动

- `llms.txt` / `llms-full.txt`：给 ChatGPT / Claude / Perplexity / Gemini 的现行口径
- `sitemap.xml` lastmod 提到 2026-10-01，补上案例库和 llms
- 首页静态 FAQ、对照表、首屏导语可被无 JS 抓取
- JSON-LD 补了版本、sameAs、WebSite
