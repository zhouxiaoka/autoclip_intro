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

## 换一批 demo（日常迭代）

两份数据是唯一来源，页面不写死任何数字：

- `data/benchmarks.json`：每次实测一行（时长、各阶段用时、调用、tokens、费用）。首页「速度与成本」的大数字、阶段耗时图和对比表都由它算出来；`headline` 指定首屏引用哪一次，`chart` 指定图里画哪几次。
- `cases/manifest.json`：案例清单。每个案例写项目目录（`project`）或成片文件（`files`），加上原片链接，可选 `skip`（排除个别成片）和 `benchmark`（引用上面的实测，案例卡上的用时和费用就从这里来）。

新一批 demo 跑完后：

```bash
# 1. 有新的实测：在 data/benchmarks.json 加一行或改数字
# 2. 有新项目：在 cases/manifest.json 加一条，或改 project 路径；批次号 batch 改成新的
python3 scripts/build_cases.py            # 全部重建；只重建某几个：build_cases.py tim-luoyonghao
python3 scripts/build_cases.py --prune    # 同时删掉清单里已经去掉的案例
node --test scripts/*.test.cjs
```

路径里的 `{projects}` / `{demos}` 来自清单顶部的 `projects_root` / `demos_root`，可用环境变量 `AUTOCLIP_PROJECTS` / `AUTOCLIP_DEMOS` 覆盖。`batch` 会作为媒体地址的 `?v=` 参数，换批后浏览器和 CDN 不会继续用旧视频。

单个案例也可以直接用 `scripts/add_case.py`（参数见文件头），适合临时收录社区投稿。

## 社区投稿

入口是首页成片墙末尾和 `/cases/` 顶部的「投稿你的成片」，指向 GitHub Discussions 的 Show and tell 分类（主仓库有投稿模板）。收录标准：

- AutoClip 生成，未经人工剪辑（改标题、换模板等产品内操作可以）；
- 原片是公开视频，附链接；投稿人对成片有发布权；
- 写明 AutoClip 版本、模型、平台；有用时附实测用时和费用。

维护者挑选后用上面的 `--file` 或 `--project` 方式导入，`contributor` 写投稿人。

## 媒体放在哪

每条成片三份媒体合计约 4 MB。默认和网页一起放在本仓库；移到对象存储只改一个配置：

```bash
AUTOCLIP_MEDIA_BASE=https://media.example.com/cases/ scripts/upload_media.sh   # rclone 上传并写入 index.json
```

之后重建时在环境里保留 `AUTOCLIP_MEDIA_BASE`（清单里的 `media_base` 读它）。`library.js` 从 `media_base` 读媒体，埋点也会识别这个域名。迁移后可以把 `cases/*/*.mp4` 从仓库里删掉、加进 `.gitignore`，只留 `case.json`。
