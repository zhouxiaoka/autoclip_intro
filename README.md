# autoclip_intro

[AutoClip](https://github.com/zhouxiaoka/autoclip) 的官网仓库，通过 GitHub Pages 发布在 <https://zhouxiaoka.github.io/autoclip_intro/>。

产品代码、issue、下载包都在主仓库 [zhouxiaoka/autoclip](https://github.com/zhouxiaoka/autoclip)；这里只放官网。

## 结构

```
index.html          单页官网，含 zh / en / ja / ko 四语文案（页尾 <script> 里的 T 对象）
tokens.css          设计 token，与产品 frontend/src/index.css 的 --ac-* 同名（规范见主仓库 DESIGN.md）
logo.svg            品牌标记（矢量）；favicon-32.png / apple-touch-icon.png 由它渲染
img/                hero 与示例卡里的视频静帧（WebP）
```

零构建：改完 `index.html` 直接 push 到 `main`，Pages 约一分钟后生效。

## 本地预览

```bash
npx serve -l 8765 .
# 打开 http://localhost:8765
```

## 发新版本时要改的地方

1. hero 与下载区的版本号、下载链接（搜 `v1.2.1` 与 `releases/download/`），四语各一份。
2. 下载卡上的安装包体积。
3. `hero.note` 里的版本号。

## 反馈入口

官网 `#feedback` 卡指向飞书多维表格表单（免登录）与 GitHub Issues / Discussions；收件箱的说明见主仓库 `HANDOFF.md`「反馈收件箱」一节。
