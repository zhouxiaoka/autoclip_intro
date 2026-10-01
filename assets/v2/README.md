# 首页 v2 成片

全部由 AutoClip 新版出片流程（Pipeline V2）自动生成，未经人工修改。2026-10-01 在本地生成，原始 1080×1920 文件在 `/private/tmp/autoclip-e2e/demos/`。

每条三个文件：

- `clip-NN.mp4`：540×960、带声音，点击后在播放器里加载。
- `clip-NN-loop.mp4`：取自约 30% 处的 8 秒，360×640、无声，成片墙进入可视区才加载、静音循环。
- `clip-NN.jpg`：同一时刻的海报。

| 编号 | 平台 · 模板 | 原片 |
|---|---|---|
| 01 02 03 | 抖音 / 小红书 · 访谈式 | [Dwarkesh Patel — Dario Amodei](https://www.youtube.com/watch?v=n1E9IZfvGMA) |
| 04 06 | TikTok / Shorts · 播客式 | 同上 |
| 07 | 小红书 · 访谈式 | [Y Combinator — Sam Altman](https://www.youtube.com/watch?v=ZIaOBAjvc38) |
| 08 | Shorts · 播客式 | 同上 |
| 09 10 | 抖音 · 访谈式（原片自带字幕，保留完整画面） | [WIRED — Hideo Kojima](https://www.youtube.com/watch?v=02Ah5VQrzvA) |

原 demo 05（Reels）没有收录：名牌把 Dario Amodei 写成了「AI safety researcher」。

重新生成：

```bash
ffmpeg -ss <30%> -i demo.mp4 -t 8 -an -vf "scale=360:640,fps=24" -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart clip-NN-loop.mp4
ffmpeg -i demo.mp4 -vf scale=540:960 -c:v libx264 -crf 29 -preset slow -pix_fmt yuv420p -c:a aac -b:a 80k -movflags +faststart clip-NN.mp4
ffmpeg -ss <30%> -i demo.mp4 -frames:v 1 -vf scale=540:960 -q:v 4 clip-NN.jpg
```
