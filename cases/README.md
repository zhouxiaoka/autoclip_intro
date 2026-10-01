# 案例库

首页「案例库」区和 `/cases/` 页都从这里读数据，由 `assets/library.js` 渲染。加案例只加数据，不改页面。

## 结构

```
cases/
  index.json            # 案例 ID 列表，新到旧；updated = 最新案例日期
  <case-id>/
    case.json           # 一个原片 = 一个案例
    01.mp4              # 540 宽、带声音，点开交付包时才加载
    01-loop.mp4         # 8 秒静音循环，进入可视区才加载
    01.jpg              # 海报
    01-cover.jpg        # 发布包封面（有才放）
```

`case.json` 字段（`scripts/cases.test.cjs` 会逐条校验）：

| 字段 | 说明 |
|---|---|
| `id` `added` `scene` `featured` | 小写 ID；收录日期；`interview` / `podcast` / `course` / `gameplay` / `talk` |
| `contributor` | `null` 为官方样例；社区投稿写 `{name, url}` |
| `source` | 原片 `title` `channel` `url` `duration_sec` `language`；成片会链回原片对应时刻 |
| `run` | 可选，真实运行记录：`minutes` `cost_cny` `model` `model_calls` `tokens_in` `tokens_out` `found` `rendered` `subtitles` |
| `outputs[]` | 每条成片：`id` `platform` `template` `title_lines` `duration_sec` `source_start_sec` `mood` `palette`，媒体文件名，以及发布包的 `cover` 与 `post {title, description, tags}` |

交付包弹窗按字段是否存在展示：有 `cover` 显示封面，有 `post` 显示标题、简介、话题和「复制文案」；都没有时注明「生成于发布包上线之前，只有成片」。不要手写或补写文案，只收 AutoClip 实际产出的内容。

## 加一个案例

从 AutoClip 项目一键导入（读取已完成的成片、发布包文案和封面）：

```bash
python3 scripts/add_case.py --id jensen-dwarkesh --scene interview \
  --project ~/Library/Application\ Support/AutoClip/projects/<项目 ID> \
  --source-url https://www.youtube.com/watch?v=Hrbq66XqtCo --source-duration 6193 \
  --run run.json --featured
```

`--skip <渲染任务 ID 前缀>` 可排除个别不合格的成片；`run.json` 里写这次运行的实测数据，`found` / `rendered` 由脚本从项目里统计。

只有成片文件时（社区投稿、旧 demo）：

```bash
python3 scripts/add_case.py --id kojima-wired --scene interview \
  --source-url https://www.youtube.com/watch?v=02Ah5VQrzvA --source-title "..." --source-channel WIRED --source-duration 1033 \
  --file "douyin:interview:/path/clip.mp4:第一行标题|第二行标题" \
  --contributor-name someone --contributor-url https://github.com/someone
```

导入后跑 `node --test scripts/*.test.cjs`，再本地预览 `python3 -m http.server` 打开 `/cases/`。

## 社区投稿

入口是首页成片墙末尾和 `/cases/` 顶部的「投稿你的成片」，指向 GitHub Discussions 的 Show and tell 分类（主仓库有投稿模板）。收录标准：

- AutoClip 生成，未经人工剪辑（改标题、换模板等产品内操作可以）；
- 原片是公开视频，附链接；投稿人对成片有发布权；
- 写明 AutoClip 版本、模型、平台；有用时附实测用时和费用。

维护者挑选后用上面的 `--file` 或 `--project` 方式导入，`contributor` 写投稿人。

## 体积

当前约 4 MB / 条（三份媒体合计）。案例数过百或仓库超过 500 MB 时，把媒体移到 GitHub Release 附件或对象存储，`library.js` 里的 `media()` 改成读 `case.media_base`。
