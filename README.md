# autoclip_intro

[AutoClip](https://github.com/zhouxiaoka/autoclip) 的官网仓库，通过 GitHub Pages 发布在 <https://zhouxiaoka.github.io/autoclip_intro/>。

产品代码、issue、下载包都在主仓库 [zhouxiaoka/autoclip](https://github.com/zhouxiaoka/autoclip)；这里只放官网。

## 结构

```
index.html          单页官网，含 zh / en / ja / ko / es / pt / ru / fr 八语文案（页尾 <script> 里的 T 对象）
tokens.css          设计 token，与产品 frontend/src/index.css 的 --ac-* 同名（规范见主仓库 DESIGN.md）
logo.svg            品牌标记（矢量）；favicon-32.png / apple-touch-icon.png 由它渲染
img/                hero 与示例卡里的视频静帧（WebP），以及 1200×630 的 og.png
robots.txt          允许抓取 /，Sitemap 指向 GitHub Pages
sitemap.xml         单页站点，目前只有首页
```

零构建：改完 `index.html` 直接 push 到 `main`，Pages 约一分钟后生效。

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

支持中文、英语、日语、韩语、西班牙语、巴西葡萄牙语、俄语、法语。优先级：URL 的 `?lang=es` 等参数 → 上次手动选择 → 浏览器偏好语言列表 → 英语。`pt-BR` 和 `pt-PT` 均使用巴西葡语文案；西语使用通用表达。导航中的原生语言选择器支持键盘与移动端，选择后更新 URL，可直接分享对应语言。

所有文案仍在 `index.html` 的 `T` 对象中，发布版本同步脚本会更新八语中的版本号。页面标题、说明与 `html[lang]` 随语言切换；静态社交爬虫未执行 JavaScript 时仍看到默认中文元信息。Canonical、分享图，以及 FAQPage / SoftwareApplication JSON-LD，都按这份默认中文 HTML 编写，不随语言切换。

验证：`node --test scripts/i18n.test.cjs`。

本次八语改动已验证目录中的文案键、语言优先级、切换后的标题/描述/下载目标、语言选择持久化，以及八语在桌面和约 400 CSS 像素宽度下的排版。新增四语尚未经过母语用户审校。部署前继续使用现有 Pages 流程；本地验证本身不会发布官网。
