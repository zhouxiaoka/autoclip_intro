# 官网统计与转化口径

官网使用现有 PostHog 项目，所有事件带 `surface = website`、`analytics_environment = production`、`schema_version = 1`。客户端数据不合并身份。公开采集 token 在 `assets/analytics-config.js`，它只有事件写入用途；不可放入 PostHog personal API key。

## 访客选择与覆盖范围

首页、三个场景页、两个功能页、发布指南在未选择时显示右下角小卡片，黑色主按钮「允许并继续」开启统计，浅灰次按钮「管理偏好」进入设置页选择允许或拒绝，支持八语。进入管理偏好不会自动同意。选择后提示收起，刷新或跳页不再出现；页脚仅保留「隐私政策」入口，进入说明页后可随时修改选择。未选择或拒绝时不发送事件、不生成访客标识。允许后才记录当前页面与后续行为；不会补报同意前的点击。选择保存在当前浏览器，关闭后停止新上报并删除网站访客标识，其他标签页也会收到撤回状态。已经发出的请求及历史记录不会因此被删除。

尊重 DNT / Global Privacy Control。仅正式 `https://zhouxiaoka.github.io/autoclip_intro/` 下的已知页面上报，本地、其他域名与未知路径禁用。浏览器拦截统计、网络失败或不同意的访问不会计入；因此看板应命名「已同意访客统计」，不要把它当成全站精确流量。提示不遮罩页面、不锁定滚动、不强制同意；DNT / GPC 开启时不显示首次访问提示，隐私页仍显示浏览器不跟踪状态。

访客说明在 [访问统计说明](analytics/index.html)。不启用自动点击采集、录屏、用户档案或跨客户端身份关联；不发送页面文字、表单、邮件地址、API key、完整页面/目标/来源 URL。仅保留有限页面分类、语言、来源分类以及 `utm_source` / `utm_medium` / `utm_campaign`（字母数字、下划线、连字符，最多 64 字符）。推广标记只填写渠道和活动代号，不填个人信息。来源归类为常见公开平台、internal、other、direct，以及 chatgpt / perplexity / claude / gemini / copilot。

已知 AI 入口的域名式 `utm_source`（例如 ChatGPT 自动附带的 `chatgpt.com`）转换成上面的固定分类；不会放开任意域名或邮件地址。只处理明确列出的域名，路径和查询仍不发送。英文 `/en/` 路径使用同一页面分类，以 `language` 区分；新增指南与精选案例页同样遵守页面白名单。

## 事件

| 事件 | 时机 | 额外属性 |
| --- | --- | --- |
| `website_pageview` | 同意后，每次页面加载一次 | 无 |
| `website_download_intent` | 点击跳往首页下载区的链接 | placement |
| `website_download_click` | 点击 GitHub Release 安装包直链，包括中键 | platform: macos / windows / other；placement |
| `website_demo_play` | 示例视频实际开始播放，每页每个播放器中的片段去重 | clip_id |
| `website_demo_complete` | 示例视频 ended，每页每个播放器中的片段去重 | clip_id |

`clip_id`：旧案例为 `9` / `11` / `12` / `13`；案例库成片为 `<案例 ID>_<成片编号>`（如 `jensen-dwarkesh_03`），只统计交付包弹窗里的完整成片，成片墙上自动循环的静音预览不计入。
| `website_sponsor_click` | 点击显式标记的赞助链接 | sponsor_id；placement |
| `website_resource_click` | 打开仓库、文档、发布列表、社区或站内发布指南 | resource；placement |
| `website_language_change` | 切换页面语言 | from_language；to_language |

共同属性：page、language、referrer_source、可选 UTM、surface、analytics_environment、schema_version。匿名 `distinct_id` 使用独立 `website_` 前缀；刷新和跳页复用，不与客户端 ID 拼接。来源和 UTM 按当前页面记录，不跨页面重新归因；查看转化来源时使用漏斗第一步的属性。

下载区锚点、Release 列表与安装包点击分别统计；点击安装包不代表下载完成、安装或活跃。案例播放不代表出片成功。ended 也可能来自用户拖至结尾，不代表完整看完。赞助链接点击不代表对方注册或付款，后者需要赞助商提供汇总归因数据。

## 添加赞助链接

在已有链接加稳定标记，无需新增 JS：

```html
<a href="https://partner.example/" data-sponsor-id="partner-a">合作伙伴</a>
```

当前没有虚构赞助商或占位展位。动态生成的链接同样适用，不采集链接完整地址或文案。`placement` 自动分为 header / footer / hero / download / content。

## PostHog 查看方法

在现有项目创建「AutoClip 官网 · 已同意访客」Dashboard。所有图表均加筛选：`surface = website` 和 `analytics_environment = production`；不要混入客户端事件。

1. **PV 趋势：** `website_pageview` 的 Total count，按日，近 30 天。
2. **UV 趋势：** 同一事件的 Unique users，按日；整月 UV 用整段时间去重，不累加每日 UV。这是浏览器标识数，不是精确人数。
3. **来源分布：** pageview，按 `referrer_source` 或 `utm_source` 分组；internal 表示站内跳页。
4. **下载点击：** `website_download_click`，按 `platform`、`placement` 分组，同时查看次数与去重访客。
5. **访问到下载：** Funnel：pageview → download_click，同一 distinct_id，1 天转化窗口；按第一步来源分组。
6. **案例：** demo_play → demo_complete，按 clip_id 分组；将其称为「播放结束」而非完整观看率。
7. **赞助点击：** sponsor_click 按 sponsor_id 分组；首次挂出真实赞助商后才会有数据。

可直接在 SQL Insight 中查询：

```sql
SELECT toDate(timestamp) AS day,
       countIf(event = 'website_pageview') AS pageviews,
       uniqIf(distinct_id, event = 'website_pageview') AS visitors,
       countIf(event = 'website_download_click') AS download_clicks,
       countIf(event = 'website_sponsor_click') AS sponsor_clicks
FROM events
WHERE properties.surface = 'website'
  AND properties.analytics_environment = 'production'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY day
ORDER BY day
```

这些是查看步骤与查询模板，不代表已创建远程 Dashboard。采集端 token 不能读取项目数据。上线前不存在的历史访问无法补回。

## 验证与上线

- `node --test scripts/*.test.cjs`
- `python3 -m unittest discover -s scripts -p '*_test.py'`
- `git diff --check`
- 预览：`python3 scripts/preview.py --port 8771`。本地即使点允许也不发 PostHog 请求。
- 合并后 Pages 发布。线上验收：同意前无采集请求；允许后一个 pageview；点击安装包、播放案例、切换语言；在 PostHog Live events 筛选 `surface = website`；关闭后无新事件。
- 自动化测试使用 mock transport，不向正式项目发送测试事件；API 接收成功与事件在后台可查应分别验证。

采集 API：[PostHog Capture API](https://posthog.com/docs/api/capture)。网络请求使用 `keepalive`，不阻塞导航，无离线补发或无限重试；同意撤回后不会重放旧事件。

本次接入验证：已发送一条 `analytics_environment = validation` 的合成 pageview，采集端返回 HTTP 200 / `status: Ok`，跨域允许正式官网 Origin。它不计入上述 production 查询；这只证明接口接受请求，尚不代表已在 PostHog 后台核对落库。
