# autoclip_intro

[AutoClip](https://github.com/zhouxiaoka/autoclip) 的官网仓库，通过 GitHub Pages 发布在 <https://zhouxiaoka.github.io/autoclip_intro/>。

产品代码、issue、下载包都在主仓库 [zhouxiaoka/autoclip](https://github.com/zhouxiaoka/autoclip)；这里只放官网。

## 结构

```
index.html          中文静态首页与中英文文案目录
en/                 生成的英文静态首页、场景与功能页
tokens.css          设计 token，与产品 frontend/src/index.css 的 --ac-* 同名（规范见主仓库 DESIGN.md）
logo.svg            品牌标记（矢量）；favicon-32.png / apple-touch-icon.png 由它渲染
img/                hero 与示例卡里的视频静帧（WebP），以及 1200×630 的 og.png
use-cases/          静态用法页：podcast/、course/，以及共用 case.css；引用根目录 tokens.css 与图标
robots.txt          允许抓取 /，并指向 Sitemap 与 llms.txt
sitemap.xml         首页、案例库、场景页、功能页、llms
llms.txt            给回答引擎的短说明（现行 1.5 口径）
llms-full.txt       完整产品事实，供引用
SEO.md              官网流量事实与创始人要做的三步
```

静态 Pages 部署：修改正文或发版信息后运行 `python3 scripts/build_search_pages.py`，将中文默认正文和英文镜像一并提交。CI 校验生成结果是否最新；版本同步也会重建并提交英文页面。

## 本地预览

```bash
npx serve -l 8765 .
# 打开 http://localhost:8765
```

## Release 自动同步

`.github/workflows/sync-release.yml` 从 `zhouxiaoka/autoclip` 的 GitHub Release 同步八语版本文案、下载链接及安装包体积，并自动提交到 `main`、显式请求 GitHub Pages 构建。

- **每日同步**：cron `17 3 * * *`，北京时间每天 11:17 检查最新正式 Release；GitHub 调度可能延迟。无需额外 token。
- **发版触发**：接收 `repository_dispatch` 的 `autoclip-release` 事件，读取 `client_payload.tag`。
- **手动同步**：在 Actions → Sync release info → Run workflow 运行；tag 留空取 latest，也可指定已发布版本。

仅有 tag 不会更新官网；Release 必须包含 macOS ARM64 `.dmg` 和 Windows x64 `.exe` 两个安装包，否则同步失败并保留原页面。

本地检查与同步：

```bash
python3 scripts/sync_release.py --check  # 0 = 已同步，1 = 需要更新
python3 scripts/sync_release.py          # 更新到 latest
python3 scripts/sync_release.py v1.3.0   # 更新到指定已发布 Release
```

### 可选：发版即时更新

主仓库需先合入 [PR #105](https://github.com/zhouxiaoka/autoclip/pull/105) 的 `Notify website` 步骤，再在 **zhouxiaoka/autoclip** 的 Settings → Secrets and variables → Actions 中配置 `WEBSITE_DISPATCH_TOKEN`。

使用 fine-grained PAT：Repository access 只选 **autoclip_intro**，Contents 权限为 **Read and write**。该 token 用来发送跨仓库 dispatch；官网 workflow 自身使用内置 `GITHUB_TOKEN` 提交和请求 Pages 构建。

没有配置该 secret 或通知步骤尚未合入时，每日 cron 仍可独立同步。GitHub 可能在公共仓库连续 60 天无活动后停用定时 workflow；如被停用，在 Actions 中重新启用。

## 反馈入口

官网 `#feedback` 卡指向飞书多维表格表单（免登录）。可复现的 Bug 走 GitHub Issues；公告、第一次出片、想法与路线图分别是 Discussions [#127](https://github.com/zhouxiaoka/autoclip/discussions/127)、[#128](https://github.com/zhouxiaoka/autoclip/discussions/128)、[#129](https://github.com/zhouxiaoka/autoclip/discussions/129)；已知问题仍是 [Issues #96](https://github.com/zhouxiaoka/autoclip/issues/96)。收件箱的说明见主仓库 `HANDOFF.md`「反馈收件箱」一节。

## 语言

主要营销页面提供中文与英文静态正文。中文路径与 `/en/` 英文路径各有 canonical，并互相声明 zh-CN / en hreflang。旧的 `?lang=en` 和明确语言切换会前往对应静态路径，保留推广参数和锚点；直接访问静态页面时语言与 URL 一致。没有自动按浏览器语言重定向。

首页中文与英文文案仍在 `index.html` 的 `T` 对象中，内页在各页的 `INNER_COPY` 中，页脚在 `assets/footer.js` 中。生成脚本把正文、标题、说明和 FAQ JSON-LD 写入 HTML，英文资源路径相应调整。日、韩、西、葡、俄、法在新版营销页面暂时回退英文，不声明为已翻译的 hreflang 页面；发布教程保留其既有八语内容。

验证：`node --test scripts/i18n.test.cjs scripts/seo.test.cjs`。

搜索与回答引擎口径见 [SEO.md](SEO.md)。维护后运行 `python3 scripts/build_search_pages.py --check`、Node 测试与 Python 测试；它们会检查静态正文、语言配对、FAQ 事实一致性和本地资源路径。

本次八语改动已验证目录中的文案键、语言优先级、切换后的标题/描述/下载目标、语言选择持久化，以及八语在桌面和约 400 CSS 像素宽度下的排版。新增四语尚未经过母语用户审校。部署前继续使用现有 Pages 流程；本地验证本身不会发布官网。

## 1.4 游戏素材页面（发布前准备）

新增 `use-cases/gameplay/`：八语、可恢复导入/确认、字幕与视觉路线、编辑导出及单跑酷样本证据。图形是明确标记的流程示意，不是假产品截图；未内置未获发布授权的游戏视频或生成式CTA概念图。六款文字预设属于基础能力，动态CTA/品牌库/逐词字幕后置。

首页八语同步更新双路线和云端抽帧隐私说明。下载链接仍由正式Release管理。新功能固定标记1.4.0，发布同步不得把历史功能首次支持版本改成最新下载版本。

合并该PR会触发Pages公开部署。1.4正式发布前页面使用“功能预告”说明；发布时将首页LAUNCH_COPY中的game.version及游戏页content.js中的version更新为正式提供状态（八语一起），并复核1.4.0安装包已经可下载。不要用未发布包链接替代稳定下载。

验证：`node --test scripts/*.test.cjs`；`python3 -m unittest discover -s scripts -p '*_test.py'`。游戏页母语审校、最终1.4包的公开演示仍待发布验收，不能将内部样片数目当作广告效果证据。

## 官网设计迭代（2026-09-28）

开发分支：`website/upgrade-strategy`。保留静态 Pages 部署、既有地址、原 logo / Instrument Serif 品牌字和自动发版同步。

- `assets/redesign.css`：共用导航、页脚、首页与场景页视觉层，包含手机与深色适配。
- `assets/site.js`：导航菜单、场景 tabs、案例播放器、八语展示文案、随滚动可逆的卡片渐显。滚动使用缓存布局、transform / opacity，支持 reduced motion。
- `assets/case-copy.js`：访谈、课程页八语工作流说明。
- `assets/showcase/`：真实片段、原片静帧、中英两套海报。其他语言使用英文海报。视频仅点击后请求，原片链接回 Sources Podcast。
- 保留 `use-cases/podcast/`、`course/`、`gameplay/` 和已有功能、指南链接。发布、自动封面说明页已重做首屏与内容结构，并与首页、三类场景页一样支持八语和共用语言菜单。

海报是网站设计资产，基于真实静帧通过生图重设计，不代表 AutoClip 自动产出的原始封面。视频保持真实工作流输出，未重新剪辑或伪造竖屏内容。原片：<https://www.youtube.com/watch?v=VeizK1M7V7E>。原始视频没有复制进官网，四段视频合计约 70 MB，各文件低于 100 MB。

检查：

```sh
node --test scripts/*.test.cjs
python3 -m unittest discover -s scripts -p '*_test.py'
# 启动具有 Range 支持的本地服务器：
python3 scripts/preview.py --port 8770
# 另一终端运行浏览器回归：
SITE_URL=http://127.0.0.1:8770/ node scripts/website-review.cjs
# Playwright 不在本地 node_modules 时用 PLAYWRIGHT_MODULE 指定安装路径。
```

浏览器回归覆盖八语切换、桌面/手机排版、菜单键盘行为、场景 tabs、四段视频播放与拖动、关闭释放、按需加载、深色和减少动态效果。仅本地预览不触发发布。

发布 / 自动封面页使用 `assets/feature-{content,page}.js` 和 `assets/feature-redesign.css`。首屏海报为设计示例，下方保留应用内预览。平台滚动带只使用悬停暂停，减少动态效果模式仍为静态排列；不显示暂停按钮。

## 官网访问统计

全站采用访客主动允许后才启用的 PostHog 匿名统计，页脚可随时关闭，并尊重 DNT / GPC。官网与客户端事件通过 `surface = website` 区分；本地预览不发送数据。事件口径、赞助链接标记、看板与 SQL 查询、验收步骤见 [ANALYTICS.md](ANALYTICS.md)，访客说明见 [访问统计](analytics/index.html)。

## 首页 v2 与案例库（2026-10-01）

开发分支：`cursor/homepage-v2`，随出片链路 V2 发版上线。

- `index.html` + `assets/home.css`：新首页。浅色主体，加一条深色「成片展示带」（规范见主仓库 `DESIGN.md` Web 层）。首页不再加载 `site.js` / `ui-polish.js` / `redesign.css`，子页面照旧。
- `data/benchmarks.json` + `assets/benchmarks.js`：实测数据，首页速度与成本区的数字、阶段耗时图和表格都从这里算。
- `assets/hero.js`：首屏「贴链接 → 选平台 → 一键出片」演示、AI 对话对照、滚动步骤导航；减少动态效果时直接显示终态。标题默认衬线（拉丁 Instrument Serif、中文 Noto Serif SC）。
- `assets/art/`：孔版风艺术素材（AI 生成），首屏拼贴、下载区横幅；说明与提示词见 `assets/art/README.md`。
- `cases/` + `assets/library.js`：数据驱动的案例库，`cases/manifest.json` + `scripts/build_cases.py` 一条命令换一批 demo。首页展示带按原片轮流取 12 条，`/cases/` 展示全部并可按平台、原片筛选；点开一条显示该平台的交付包（成片、封面、标题、简介、话题）。加案例只加数据，见 [`cases/README.md`](cases/README.md)。
- `assets/footer.js`：所有页面共用的页脚文案（八语扩展只改这里）。页脚链接直接写在每页 HTML 里，便于搜索引擎抓取；新增文档在 `index.html` 和 `cases/index.html` 的页脚各加一行，并在 `footer.js` 加对应文案。
- 日、韩、西、葡、俄、法暂时显示英文，中文定稿后统一翻译。
