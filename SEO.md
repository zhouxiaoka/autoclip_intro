# 官网 SEO 与 GEO

更新：2026-10-02。官网：https://zhouxiaoka.github.io/autoclip_intro/；英文：https://zhouxiaoka.github.io/autoclip_intro/en/。

AutoClip（zhouxiaoka/autoclip）当前定位：开源 AI 视频剪辑桌面工具，一个链接、一键出片，交付视频、封面和发布文案。剪辑与渲染在本机，分析模型自选。当前产品事实和费用范围以 README、隐私说明、案例记录为依据。

## 搜索入口

首页、案例库、三个场景页、两个功能页、三篇教程和两个精选案例提供中文、英文静态 HTML。各自使用 canonical，zh-CN / en 互相声明 hreflang；x-default 指中文默认入口。其余六种语言在新版营销页面回退英文，不作为已翻译版本声明。显式语言切换和旧 `?lang=en` 链接会前往对应静态页面，保留 UTM 与锚点；不按浏览器语言自动重定向。

修改文案后运行 `python3 scripts/build_search_pages.py` 并提交生成文件。发版同步脚本同样重建英文页面，CI 检查生成结果、元信息、静态正文、FAQ 与资源路径。正文、FAQ JSON-LD、README 和 llms 文件的费用与上传范围应保持一致。

## 发现与归因

GitHub About 和 Topics 已更新。Google / Bing 已验证并提交 sitemap 和首页重抓。2026-10-02 上一轮提交时，Google sitemap 后台仍显示 Couldn't fetch，但实时 URL 检查抓取成功；提交不代表已收录。用 Search Console 查看各页面的真实状态，不重复提交以代替处理。

GitHub 仓库流量、官网已同意访客和实际使用结果分别记录，不互相代替；t.co 来源也不一定来自项目自己的账号。

官网 AI 入口归类为 chatgpt / perplexity / claude / gemini / copilot。ChatGPT 自动附带的 `utm_source=chatgpt.com` 转换为固定类别，未知域名与邮件地址仍过滤。推广链接使用渠道与活动代号；复盘按漏斗第一步来源查看。详见 ANALYTICS.md。

2026-10-01 的 PostHog 历史记录为 69 次官网 pageview / 38 个已同意浏览器，安装包点击 24 次 / 20 个浏览器。覆盖范围只含已同意访客，是小样本；不能据此认定稳定转化率，也不能与仓库访问相除。客户端首次出片、官网点击和 GitHub Stars 分别观察。

## 持续内容

教程和精选案例正文集中在 `data/growth-content.json`，由 `scripts/build_growth_content.py` 和搜索页面生成器生成可抓取的正文。修改正文后运行 `python3 scripts/build_search_pages.py`，不要只修改生成 HTML。每个案例保留来源、字幕条件、平台、输出、历史测试条件与限制；两个不同访谈的记录不作为严格速度对照。单视频案例提供与可播放文件一致的 VideoObject，它不保证获得视频搜索展示。

`llms.txt` / `llms-full.txt` 是可引用的事实摘要，不是保证排名的机制。Google AI 搜索不要求额外 AI 文本文件，仍依赖可索引的可靠正文与内部链接：[Google AI 搜索指南](https://developers.google.com/search/docs/appearance/ai-features)。多语言 URL 的依据见[官方指南](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)。

继续使用 GitHub Pages。自定义域名不是本轮前置条件，也没有自动排名加成。域根 robots.txt 的 404 不等于 Google 被禁止抓取；项目子目录的 robots.txt 不能管理域根抓取规则：[robots.txt 规范](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)。

### Original first-run case — 2026-10-02

`cases/autoclip-first-run/` and its English pair record official 1.5.0 outputs from an original 127.3-second lesson with supplied SRT. Production-stage elapsed 62.4 seconds excludes setup, source creation, first model download, review and publishing. API bill not independently measured; preserve the two automatic-description review findings. The source and matching SRT are reproducible; this case does not benchmark transcription or long-podcast speed.
